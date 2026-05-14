import type { Binding, Layer, LogicalMap } from "../logical/model";
import type { EmitContext, ResolvedBinding, ResolvedTransformResultJson } from "./model";
import type { PhysicalLayout } from "../physical/model";

function getLayerName(layer: Layer | undefined): string {
  if (!layer) return "base";
  return layer.name;
}

function resolveBinding(
  logicalMap: LogicalMap | undefined,
  bindingId: string,
  layouts: PhysicalLayout[]
): ResolvedBinding | null {
  if (!logicalMap) return null;
  const binding: Binding | undefined = logicalMap.bindings.find((it) => it.id === bindingId);
  if (!binding) return null;

  const layerId = binding.trigger.layerId;
  const layer = layerId
    ? logicalMap.layers.find((it) => it.id === layerId)
    : logicalMap.layers.find((it) => it.kind === "base");

  const layout = layouts.find((l) => l.id === logicalMap.physicalId);

  let keyIds: string[] = [];
  if (binding.trigger.type === "combo") {
    keyIds = binding.trigger.keyIds;
  } else if (binding.trigger.type === "press" || binding.trigger.type === "hold") {
    keyIds = [binding.trigger.keyId];
  }

  const keyNames = keyIds.map((keyId) => {
    const key = layout?.keys.find((k) => k.id === keyId);
    return key?.note ?? keyId;
  });

  return {
    logicalMapId: logicalMap.id,
    bindingId: binding.id,
    trigger: binding.trigger,
    action: binding.action,
    keyNames,
    layerName: getLayerName(layer)
  };
}

export function emitJson(context: EmitContext): string {
  const resolved: ResolvedTransformResultJson = {
    kind: "resolved-transform-result",
    chainId: context.result.chainId,
    operations: context.result.operations.map((op) => {
      const fromMap = context.logicalMaps.find((it) => it.id === op.from?.logicalMapId);
      const toMap = context.logicalMaps.find((it) => it.id === op.to?.logicalMapId);
      const from = op.from ? resolveBinding(fromMap, op.from.bindingId, context.physicalLayouts) : undefined;
      const to = op.to ? resolveBinding(toMap, op.to.bindingId, context.physicalLayouts) : undefined;

      if ((op.from && !from) || (op.to && !to)) {
        return {
          id: op.id,
          kind: "manual" as const,
          stage: op.stage,
          from: from ?? undefined,
          to: to ?? undefined,
          reason: "invalidReference" as const,
          note: op.note
        };
      }

      return {
        id: op.id,
        kind: op.kind,
        stage: op.stage,
        from: from ?? undefined,
        to: to ?? undefined,
        reason: op.reason,
        note: op.note
      };
    }),
    warnings: context.result.warnings,
    guides: context.result.guides
  };

  return JSON.stringify(resolved, null, 2);
}