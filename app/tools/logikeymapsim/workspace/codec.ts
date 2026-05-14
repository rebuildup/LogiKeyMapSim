import { issue, type Issue } from "../base/issue";
import type { Action, Binding, InputTrigger, Layer, LogicalMap } from "../logical/model";
import type { PhysicalKey, PhysicalLayout } from "../physical/model";
import type { TransformChain } from "../transform/model";
import type { Workspace } from "./model";

export type DecodeResult =
  | { ok: true; workspace: Workspace }
  | { ok: false; issues: Issue[] };

type Obj = Record<string, unknown>;

function isObj(value: unknown): value is Obj {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function unknownFieldIssues(value: Obj, allowed: string[], path: string): Issue[] {
  return Object.keys(value)
    .filter((key) => !allowed.includes(key))
    .map((key) => issue("error", "codec.unknownField", `Unknown field at ${path}: ${key}`));
}

function idIssue(value: unknown): Issue | null {
  return typeof value === "string" && value.length > 0 ? null : issue("error", "id.invalid", "Invalid id");
}

function parseTrigger(value: unknown, issues: Issue[], keyIds: Set<string>, layerIds: Set<string>): InputTrigger | null {
  if (!isObj(value)) return null;
  issues.push(...unknownFieldIssues(value, ["type", "keyId", "keyIds", "layerId", "durationMs"], "trigger"));
  const type = value.type;

  if (type === "press") {
    if (idIssue(value.keyId)) issues.push(issue("error", "binding.missingKey", "Press trigger key is missing"));
    if (typeof value.keyId === "string" && !keyIds.has(value.keyId)) issues.push(issue("error", "binding.missingKey", "Press key not found", [value.keyId]));
    if (value.layerId !== undefined && (typeof value.layerId !== "string" || !layerIds.has(value.layerId))) {
      issues.push(issue("error", "binding.missingLayer", "Layer not found"));
    }
    return { type: "press", keyId: String(value.keyId), layerId: typeof value.layerId === "string" ? value.layerId : undefined };
  }

  if (type === "combo") {
    if (!Array.isArray(value.keyIds)) {
      issues.push(issue("error", "binding.invalidComboLength", "Combo keys are invalid"));
      return { type: "combo", keyIds: [], layerId: typeof value.layerId === "string" ? value.layerId : undefined };
    }
    const keyList = value.keyIds.filter((k): k is string => typeof k === "string");
    if (keyList.length < 2) issues.push(issue("error", "binding.invalidComboLength", "Combo must have >=2 keys"));
    if (new Set(keyList).size !== keyList.length) issues.push(issue("error", "binding.duplicateComboKey", "Combo has duplicate keys"));
    for (const keyId of keyList) {
      if (!keyIds.has(keyId)) issues.push(issue("error", "binding.missingKey", "Combo key not found", [keyId]));
    }
    if (value.layerId !== undefined && (typeof value.layerId !== "string" || !layerIds.has(value.layerId))) {
      issues.push(issue("error", "binding.missingLayer", "Layer not found"));
    }
    return { type: "combo", keyIds: keyList, layerId: typeof value.layerId === "string" ? value.layerId : undefined };
  }

  if (type === "hold") {
    if (idIssue(value.keyId)) issues.push(issue("error", "binding.missingKey", "Hold trigger key is missing"));
    if (typeof value.keyId === "string" && !keyIds.has(value.keyId)) issues.push(issue("error", "binding.missingKey", "Hold key not found", [value.keyId]));
    if (value.durationMs !== undefined && (typeof value.durationMs !== "number" || !Number.isFinite(value.durationMs))) {
      issues.push(issue("error", "physical.invalidUnit", "Hold duration must be finite"));
    }
    if (value.layerId !== undefined && (typeof value.layerId !== "string" || !layerIds.has(value.layerId))) {
      issues.push(issue("error", "binding.missingLayer", "Layer not found"));
    }
    return {
      type: "hold",
      keyId: String(value.keyId),
      durationMs: typeof value.durationMs === "number" ? value.durationMs : undefined,
      layerId: typeof value.layerId === "string" ? value.layerId : undefined
    };
  }

  issues.push(issue("error", "binding.invalidTrigger", "Unknown trigger type"));
  return null;
}

function parseAction(value: unknown, issues: Issue[], layerIds: Set<string>): Action | null {
  if (!isObj(value)) return null;
  issues.push(...unknownFieldIssues(value, ["type", "value", "targetLayerId", "mode", "keys", "steps"], "action"));
  const type = value.type;

  if (type === "character") {
    if (typeof value.value !== "string") issues.push(issue("error", "action.invalidCharacterValue", "Character value must be string"));
    return { type: "character", value: String(value.value ?? "") };
  }

  if (type === "layer") {
    if (typeof value.targetLayerId !== "string" || !layerIds.has(value.targetLayerId)) {
      issues.push(issue("error", "action.missingTargetLayer", "Layer action target not found"));
    }
    if (value.mode !== "whileHeld" && value.mode !== "toggle") {
      issues.push(issue("error", "action.invalidLayerMode", "Layer action mode is invalid"));
    }
    return {
      type: "layer",
      targetLayerId: String(value.targetLayerId ?? ""),
      mode: value.mode === "toggle" ? "toggle" : "whileHeld"
    };
  }

  if (type === "shortcut") {
    if (!Array.isArray(value.keys)) issues.push(issue("error", "action.invalidShortcutKeys", "Shortcut keys must be array"));
    return { type: "shortcut", keys: Array.isArray(value.keys) ? value.keys.filter((k): k is string => typeof k === "string") : [] };
  }

  if (type === "macro") {
    if (!Array.isArray(value.steps)) {
      issues.push(issue("error", "action.invalidMacroSteps", "Macro steps must be array"));
      return { type: "macro", steps: [] };
    }
    const steps = value.steps.map((step) => {
      if (!isObj(step)) {
        issues.push(issue("error", "action.invalidMacroSteps", "Invalid macro step"));
        return { action: { type: "character", value: "" } as Action };
      }
      const stepAction = parseAction(step.action, issues, layerIds) ?? ({ type: "character", value: "" } as Action);
      if (step.delayMs !== undefined && (typeof step.delayMs !== "number" || !Number.isFinite(step.delayMs))) {
        issues.push(issue("error", "action.invalidMacroDelay", "Macro delay must be finite"));
      }
      return { action: stepAction, delayMs: typeof step.delayMs === "number" ? step.delayMs : undefined, note: typeof step.note === "string" ? step.note : undefined };
    });
    return { type: "macro", steps };
  }

  if (type === "ime") {
    if (typeof value.value !== "string") issues.push(issue("error", "action.invalidImeValue", "IME value must be string"));
    return { type: "ime", value: String(value.value ?? "") };
  }

  issues.push(issue("error", "action.invalidType", "Unknown action type"));
  return null;
}

function parseLayer(value: unknown, issues: Issue[]): Layer | null {
  if (!isObj(value)) return null;
  issues.push(...unknownFieldIssues(value, ["id", "name", "kind", "trigger"], "layer"));
  if (idIssue(value.id)) issues.push(issue("error", "id.invalid", "Layer id invalid"));
  if (typeof value.name !== "string") issues.push(issue("error", "layer.invalidName", "Layer name invalid"));

  if (value.kind === "base") {
    return { id: String(value.id), name: String(value.name ?? ""), kind: "base" };
  }

  if (value.kind === "conditional") {
    if (!value.trigger) issues.push(issue("error", "layer.missingTrigger", "Conditional layer trigger missing"));
    return {
      id: String(value.id),
      name: String(value.name ?? ""),
      kind: "conditional",
      trigger: { type: "press", keyId: "" }
    };
  }

  issues.push(issue("error", "layer.invalidKind", "Layer kind invalid"));
  return null;
}

function validateConditionalLayerRules(map: LogicalMap, layerIds: Set<string>, issues: Issue[]): void {
  const conditionalIds = new Set(map.layers.filter((it) => it.kind === "conditional").map((it) => it.id));
  for (const layer of map.layers) {
    if (layer.kind !== "conditional") continue;
    const triggerLayerId = layer.trigger.layerId;
    if (triggerLayerId && !layerIds.has(triggerLayerId)) {
      issues.push(issue("error", "binding.missingLayer", "Conditional layer trigger layer missing"));
    }
    if (triggerLayerId === layer.id) {
      issues.push(issue("error", "layer.selfTrigger", "Layer trigger self reference", [layer.id]));
    }
    if (triggerLayerId && conditionalIds.has(triggerLayerId)) {
      issues.push(issue("error", "layer.triggerNotBase", "Conditional trigger cannot reference conditional layer", [layer.id, triggerLayerId]));
    }
  }
}

function parsePhysicalLayout(value: unknown, issues: Issue[]): PhysicalLayout | null {
  if (!isObj(value)) return null;
  issues.push(...unknownFieldIssues(value, ["id", "name", "keys"], "physicalLayout"));
  if (idIssue(value.id)) issues.push(issue("error", "id.invalid", "Physical layout id invalid"));
  if (typeof value.name !== "string") issues.push(issue("error", "physical.invalidName", "Physical layout name invalid"));
  if (!Array.isArray(value.keys)) {
    issues.push(issue("error", "physical.invalidKeys", "Physical keys must be array"));
    return { id: String(value.id), name: String(value.name ?? ""), keys: [] };
  }

  const keys: PhysicalKey[] = value.keys.map((item) => {
    if (!isObj(item)) {
      issues.push(issue("error", "physical.invalidKey", "Physical key must be object"));
      return { id: "", x: 0, y: 0, w: 1, h: 1 };
    }
    issues.push(...unknownFieldIssues(item, ["id", "x", "y", "w", "h", "finger", "groups", "note"], "physicalKey"));

    if (idIssue(item.id)) issues.push(issue("error", "id.invalid", "Physical key id invalid"));
    for (const unitKey of ["x", "y", "w", "h"] as const) {
      if (typeof item[unitKey] !== "number" || !Number.isFinite(item[unitKey])) {
        issues.push(issue("error", "physical.invalidUnit", `Invalid ${unitKey}`));
      }
    }
    if (typeof item.w === "number" && item.w <= 0) issues.push(issue("error", "physical.invalidSize", "w must be > 0"));
    if (typeof item.h === "number" && item.h <= 0) issues.push(issue("error", "physical.invalidSize", "h must be > 0"));

    return {
      id: String(item.id),
      x: Number(item.x ?? 0),
      y: Number(item.y ?? 0),
      w: Number(item.w ?? 1),
      h: Number(item.h ?? 1),
      finger: typeof item.finger === "string" ? item.finger : undefined,
      groups: Array.isArray(item.groups) ? item.groups.filter((v): v is string => typeof v === "string") : undefined,
      note: typeof item.note === "string" ? item.note : undefined
    };
  });

  return {
    id: String(value.id),
    name: String(value.name ?? ""),
    keys
  };
}

function parseLogicalMap(value: unknown, issues: Issue[], layouts: PhysicalLayout[]): LogicalMap | null {
  if (!isObj(value)) return null;
  issues.push(...unknownFieldIssues(value, ["id", "name", "physicalId", "bindings", "layers"], "logicalMap"));

  if (idIssue(value.id)) issues.push(issue("error", "id.invalid", "Logical map id invalid"));
  if (typeof value.name !== "string") issues.push(issue("error", "logical.invalidName", "Logical map name invalid"));
  if (typeof value.physicalId !== "string") issues.push(issue("error", "logical.missingPhysicalLayout", "physicalId must be string"));

  const layout = layouts.find((it) => it.id === value.physicalId);
  if (!layout) issues.push(issue("error", "logical.missingPhysicalLayout", "Physical layout not found", [String(value.physicalId)]));

  const layersRaw = Array.isArray(value.layers) ? value.layers : [];
  const layers: Layer[] = layersRaw.map((item) => parseLayer(item, issues)).filter((v): v is Layer => v !== null);

  const baseCount = layers.filter((it) => it.kind === "base").length;
  if (baseCount !== 1) issues.push(issue("error", "layer.invalidBaseLayerCount", "Base layer count must be exactly one"));

  const layerIds = new Set<string>();
  const layerNames = new Set<string>();
  for (const layer of layers) {
    if (layerIds.has(layer.id)) issues.push(issue("error", "layer.duplicateLayerId", "Duplicate layer id", [layer.id]));
    layerIds.add(layer.id);

    if (layerNames.has(layer.name)) issues.push(issue("error", "layer.duplicateLayerName", "Duplicate layer name", [layer.name]));
    layerNames.add(layer.name);
  }

  const keyIds = new Set(layout?.keys.map((k) => k.id) ?? []);

  const bindingsRaw = Array.isArray(value.bindings) ? value.bindings : [];
  const bindings: Binding[] = bindingsRaw
    .map((item) => {
      if (!isObj(item)) return null;
      issues.push(...unknownFieldIssues(item, ["id", "trigger", "action"], "binding"));
      if (idIssue(item.id)) issues.push(issue("error", "id.invalid", "Binding id invalid"));
      const trigger = parseTrigger(item.trigger, issues, keyIds, layerIds);
      const action = parseAction(item.action, issues, layerIds);
      if (!trigger || !action) return null;
      return { id: String(item.id), trigger, action };
    })
    .filter((v): v is Binding => v !== null);

  const bindingIds = new Set<string>();
  for (const binding of bindings) {
    if (bindingIds.has(binding.id)) issues.push(issue("error", "binding.duplicateBindingId", "Duplicate binding id", [binding.id]));
    bindingIds.add(binding.id);
  }

  const map: LogicalMap = {
    id: String(value.id),
    name: String(value.name ?? ""),
    physicalId: String(value.physicalId ?? ""),
    bindings,
    layers
  };

  validateConditionalLayerRules(map, layerIds, issues);
  return map;
}

function parseTransformChain(value: unknown, issues: Issue[], mapIds: Set<string>): TransformChain | null {
  if (!isObj(value)) return null;
  issues.push(...unknownFieldIssues(value, ["id", "name", "logicalMapIds"], "transformChain"));
  if (idIssue(value.id)) issues.push(issue("error", "id.invalid", "Chain id invalid"));
  if (typeof value.name !== "string") issues.push(issue("error", "transform.invalidName", "Chain name invalid"));
  if (!Array.isArray(value.logicalMapIds)) {
    issues.push(issue("error", "transform.invalidChainLength", "logicalMapIds must be array"));
    return { id: String(value.id), name: String(value.name ?? ""), logicalMapIds: [] };
  }

  const logicalMapIds = value.logicalMapIds.filter((v): v is string => typeof v === "string");
  if (logicalMapIds.length < 2) issues.push(issue("error", "transform.invalidChainLength", "Chain must have at least 2 maps"));
  for (const mapId of logicalMapIds) {
    if (!mapIds.has(mapId)) issues.push(issue("error", "transform.missingLogicalMap", "Logical map in chain not found", [mapId]));
  }

  return { id: String(value.id), name: String(value.name ?? ""), logicalMapIds };
}

export function decodeWorkspace(value: unknown): DecodeResult {
  const issues: Issue[] = [];

  if (!isObj(value)) {
    return { ok: false, issues: [issue("error", "workspace.notObject", "Workspace root must be object")] };
  }

  issues.push(...unknownFieldIssues(value, ["physicalLayouts", "logicalMaps", "transformChains"], "workspace"));

  if (!Array.isArray(value.physicalLayouts)) issues.push(issue("error", "workspace.invalidPhysicalLayouts", "physicalLayouts must be array"));
  if (!Array.isArray(value.logicalMaps)) issues.push(issue("error", "workspace.invalidLogicalMaps", "logicalMaps must be array"));
  if (!Array.isArray(value.transformChains)) issues.push(issue("error", "workspace.invalidTransformChains", "transformChains must be array"));

  const layouts = (Array.isArray(value.physicalLayouts) ? value.physicalLayouts : [])
    .map((item) => parsePhysicalLayout(item, issues))
    .filter((v): v is PhysicalLayout => v !== null);

  const layoutIds = new Set<string>();
  for (const layout of layouts) {
    if (layoutIds.has(layout.id)) issues.push(issue("error", "physical.duplicateLayoutId", "Duplicate physical layout id", [layout.id]));
    layoutIds.add(layout.id);

    const keyIds = new Set<string>();
    for (const key of layout.keys) {
      if (keyIds.has(key.id)) issues.push(issue("error", "physical.duplicateKeyId", "Duplicate physical key id", [layout.id, key.id]));
      keyIds.add(key.id);
    }
  }

  const logicalMaps = (Array.isArray(value.logicalMaps) ? value.logicalMaps : [])
    .map((item) => parseLogicalMap(item, issues, layouts))
    .filter((v): v is LogicalMap => v !== null);

  const mapIds = new Set<string>();
  for (const map of logicalMaps) {
    mapIds.add(map.id);
  }

  const chains = (Array.isArray(value.transformChains) ? value.transformChains : [])
    .map((item) => parseTransformChain(item, issues, mapIds))
    .filter((v): v is TransformChain => v !== null);

  const chainIds = new Set<string>();
  for (const chain of chains) {
    if (chainIds.has(chain.id)) issues.push(issue("error", "transform.duplicateChainId", "Duplicate chain id", [chain.id]));
    chainIds.add(chain.id);
  }

  if (issues.some((it) => it.level === "error")) {
    return { ok: false, issues };
  }

  return {
    ok: true,
    workspace: {
      physicalLayouts: layouts,
      logicalMaps,
      transformChains: chains
    }
  };
}

export function encodeWorkspace(workspace: Workspace): unknown {
  return JSON.parse(JSON.stringify(workspace));
}
