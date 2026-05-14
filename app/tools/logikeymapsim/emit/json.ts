import type { Binding, Layer, LogicalMap } from "../logical/model";
import type { ResolvedBinding, ResolvedTransformResultJson } from "../workspace/model";
import type { EmitContext } from "./model";

function getLayerName(layer: Layer | undefined): string {
  if (!layer) return "base";
  return layer.name;
}

function resolveBinding(logicalMap: LogicalMap | undefined, bindingId: string): ResolvedBinding | null {
  if (!logicalMap) return null;
  const binding: Binding | undefined = logicalMap.bindings.find((it) => it.id === bindingId);
  if (!binding) return null;

  const layerId = binding.trigger.layerId;
  const layer = layerId ? logicalMap.layers.find((it) => it.id === layerId) : logicalMap.layers.find((it) => it.kind === "base");

  const layoutKeyNames = (() => {
    if (binding.trigger.type === "combo") return [...binding.trigger.keyIds];
    return [binding.trigger.keyId];
  })();

  return {
    logicalMapId: logicalMap.id,
    bindingId: binding.id,
    trigger: binding.trigger,
    action: binding.action,
    keyNames: layoutKeyNames,
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
      const from = op.from ? resolveBinding(fromMap, op.from.bindingId) : undefined;
      const to = op.to ? resolveBinding(toMap, op.to.bindingId) : undefined;

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
        from,
        to,
        reason: op.reason,
        note: op.note
      };
    }),
    warnings: context.result.warnings,
    guides: context.result.guides
  };

  return JSON.stringify(resolved, null, 2);
}
