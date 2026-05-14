import { createId } from "../../base/id";
import type { LogicalMap, Action, InputTrigger, Binding } from "../../logical/model";
import type { PhysicalLayout } from "../../physical/model";
import type { BindingRef, TransformOperation, TransformResult, TransformStage } from "../model";

type DiffContext = {
  chainId: string;
  physicalLayouts: PhysicalLayout[];
  stage: TransformStage;
};

function getLayerKey(map: LogicalMap, layerId?: string): string {
  if (!layerId) return "base";
  const layer = map.layers.find((it) => it.id === layerId);
  if (!layer || layer.kind === "base") return "base";
  return `conditional:${layer.name}`;
}

function triggerKey(map: LogicalMap, trigger: InputTrigger): string {
  const lk = getLayerKey(map, trigger.layerId);
  if (trigger.type === "press") return `press:${lk}:${trigger.keyId}`;
  if (trigger.type === "combo") return `combo:${lk}:${[...trigger.keyIds].sort().join("+")}`;
  return `hold:${lk}:${trigger.keyId}:${trigger.durationMs === undefined ? "default" : trigger.durationMs}`;
}

function actionKey(map: LogicalMap, action: Action): string | null {
  if (action.type === "character") return `character:${action.value}`;
  if (action.type === "layer") {
    const layer = map.layers.find((it) => it.id === action.targetLayerId);
    const lk = !layer || layer.kind === "base" ? "base" : `conditional:${layer.name}`;
    return `layer:${action.mode}:${lk}`;
  }
  return null;
}

function ref(logicalMapId: string, bindingId: string): BindingRef {
  return { logicalMapId, bindingId };
}

function byAction(map: LogicalMap): {
  supported: Map<string, Binding[]>;
  unsupported: Binding[];
} {
  const supported = new Map<string, Binding[]>();
  const unsupported: Binding[] = [];

  for (const binding of map.bindings) {
    const key = actionKey(map, binding.action);
    if (!key) {
      unsupported.push(binding);
      continue;
    }
    supported.set(key, [...(supported.get(key) ?? []), binding]);
  }

  return { supported, unsupported };
}

function manual(stage: TransformStage, reason: TransformOperation["reason"], from?: BindingRef, to?: BindingRef): TransformOperation {
  return {
    id: createId("op"),
    kind: "manual",
    stage,
    from,
    to,
    reason
  };
}

export function diff(source: LogicalMap, target: LogicalMap, context: DiffContext): TransformResult {
  const sourceBy = byAction(source);
  const targetBy = byAction(target);

  const operations: TransformOperation[] = [];

  for (const binding of sourceBy.unsupported) {
    operations.push(manual(context.stage, "unsupportedAction", ref(source.id, binding.id)));
  }
  for (const binding of targetBy.unsupported) {
    operations.push(manual(context.stage, "unsupportedAction", undefined, ref(target.id, binding.id)));
  }

  const allKeys = new Set<string>([...sourceBy.supported.keys(), ...targetBy.supported.keys()]);

  for (const action of allKeys) {
    const sourceItems = sourceBy.supported.get(action) ?? [];
    const targetItems = targetBy.supported.get(action) ?? [];

    if (sourceItems.length === 0) {
      for (const targetItem of targetItems) {
        operations.push(manual(context.stage, "missingSourceAction", undefined, ref(target.id, targetItem.id)));
      }
      continue;
    }

    if (targetItems.length === 0) {
      for (const sourceItem of sourceItems) {
        operations.push(manual(context.stage, "missingTargetAction", ref(source.id, sourceItem.id)));
      }
      continue;
    }

    if (sourceItems.length > 1) {
      for (const targetItem of targetItems) {
        operations.push(manual(context.stage, "ambiguousSourceAction", undefined, ref(target.id, targetItem.id)));
      }
      continue;
    }

    if (targetItems.length > 1) {
      for (const sourceItem of sourceItems) {
        operations.push(manual(context.stage, "ambiguousTargetAction", ref(source.id, sourceItem.id)));
      }
      continue;
    }

    const sourceItem = sourceItems[0];
    const targetItem = targetItems[0];
    const sourceTriggerKey = triggerKey(source, sourceItem.trigger);
    const targetTriggerKey = triggerKey(target, targetItem.trigger);

    if (sourceTriggerKey !== targetTriggerKey) {
      operations.push({
        id: createId("op"),
        kind: "replace",
        stage: context.stage,
        from: ref(source.id, sourceItem.id),
        to: ref(target.id, targetItem.id)
      });
    }
  }

  return {
    chainId: context.chainId,
    operations,
    warnings: [],
    guides: []
  };
}
