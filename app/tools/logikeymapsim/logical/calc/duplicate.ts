import { issue, type Issue } from "../../base/issue";
import type { Action, Binding, InputTrigger, LogicalMap } from "../model";

function layerKey(map: LogicalMap, layerId?: string): string {
  if (!layerId) return "base";
  const layer = map.layers.find((it) => it.id === layerId);
  if (!layer || layer.kind === "base") return "base";
  return `conditional:${layer.name}`;
}

function triggerKey(map: LogicalMap, trigger: InputTrigger): string {
  const lk = layerKey(map, trigger.layerId);
  if (trigger.type === "press") return `press:${lk}:${trigger.keyId}`;
  if (trigger.type === "combo") return `combo:${lk}:${[...trigger.keyIds].sort().join("+")}`;
  return `hold:${lk}:${trigger.keyId}:${trigger.durationMs === undefined ? "default" : trigger.durationMs}`;
}

function actionKey(map: LogicalMap, action: Action): string {
  if (action.type === "character") return `character:${action.value}`;
  if (action.type === "layer") {
    const target = map.layers.find((it) => it.id === action.targetLayerId);
    const targetKey = !target || target.kind === "base" ? "base" : `conditional:${target.name}`;
    return `layer:${action.mode}:${targetKey}`;
  }
  if (action.type === "shortcut") return `shortcut:${[...action.keys].sort().join("+")}`;
  if (action.type === "ime") return `ime:${action.value}`;
  return `macro:${action.steps.length}`;
}

function toBindings(map: LogicalMap): Binding[] {
  return map.bindings;
}

export function findDuplicates(map: LogicalMap): Issue[] {
  const issues: Issue[] = [];
  const bindings = toBindings(map);
  const actionIndex = new Map<string, string[]>();
  const triggerIndex = new Map<string, string[]>();

  for (const binding of bindings) {
    const ak = actionKey(map, binding.action);
    const tk = triggerKey(map, binding.trigger);

    actionIndex.set(ak, [...(actionIndex.get(ak) ?? []), binding.id]);
    triggerIndex.set(tk, [...(triggerIndex.get(tk) ?? []), binding.id]);
  }

  for (const [key, ids] of actionIndex) {
    if (ids.length > 1) {
      issues.push(issue("warning", "logical.duplicateAction", `Duplicate action: ${key}`, ids));
    }
  }

  for (const [key, ids] of triggerIndex) {
    if (ids.length > 1) {
      issues.push(issue("warning", "logical.duplicateTrigger", `Duplicate trigger: ${key}`, ids));
    }
  }

  return issues;
}
