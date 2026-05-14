import { issue, type Issue } from "../../base/issue";
import type { PhysicalLayout } from "../../physical/model";
import type { LogicalMap } from "../model";

function isBaseLayer(map: LogicalMap, layerId?: string): boolean {
  if (layerId === undefined) return true;
  const layer = map.layers.find((it) => it.id === layerId);
  return layer?.kind === "base";
}

function bindingTouchesKey(logicalMap: LogicalMap, keyId: string): boolean {
  return logicalMap.bindings.some((binding) => {
    if (!isBaseLayer(logicalMap, binding.trigger.layerId)) return false;
    if (binding.trigger.type === "press" || binding.trigger.type === "hold") return binding.trigger.keyId === keyId;
    return binding.trigger.keyIds.includes(keyId);
  });
}

export function findUnassignedBaseKeys(logicalMap: LogicalMap, layout: PhysicalLayout): Issue[] {
  const guides: Issue[] = [];
  for (const key of layout.keys) {
    if (!bindingTouchesKey(logicalMap, key.id)) {
      guides.push(issue("guide", "logical.unassignedBaseKey", `Key has no BaseLayer binding: ${key.id}`, [key.id]));
    }
  }
  return guides;
}
