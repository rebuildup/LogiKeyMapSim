import type { LogicalMap } from "../logical/model";
import type { PhysicalLayout } from "../physical/model";
import type { RuntimeState, WorkspaceAction } from "./model";
import { emptyWorkspace } from "./model";

function clearResult(state: RuntimeState): RuntimeState {
  return { ...state, activeResult: undefined };
}

function updateWorkspace(state: RuntimeState, workspace: RuntimeState["workspace"]): RuntimeState {
  return { workspace, activeResult: undefined };
}

function findLayout(workspace: RuntimeState["workspace"], layoutId: string): PhysicalLayout | undefined {
  return workspace.physicalLayouts.find((it) => it.id === layoutId);
}

function findMap(workspace: RuntimeState["workspace"], logicalMapId: string): LogicalMap | undefined {
  return workspace.logicalMaps.find((it) => it.id === logicalMapId);
}

function referencesLayout(workspace: RuntimeState["workspace"], layoutId: string): boolean {
  return workspace.logicalMaps.some((map) => map.physicalId === layoutId);
}

function keyIsReferenced(workspace: RuntimeState["workspace"], layoutId: string, keyId: string): boolean {
  const mapIds = workspace.logicalMaps.filter((it) => it.physicalId === layoutId).map((it) => it.id);
  const maps = workspace.logicalMaps.filter((it) => mapIds.includes(it.id));

  return maps.some((map) => {
    const bindingRef = map.bindings.some((binding) => {
      if (binding.trigger.type === "combo") return binding.trigger.keyIds.includes(keyId);
      return binding.trigger.keyId === keyId;
    });

    const layerRef = map.layers.some((layer) => {
      if (layer.kind !== "conditional") return false;
      if (layer.trigger.type === "combo") return layer.trigger.keyIds.includes(keyId);
      return layer.trigger.keyId === keyId;
    });

    return bindingRef || layerRef;
  });
}

function mapIsReferencedByChain(workspace: RuntimeState["workspace"], logicalMapId: string): boolean {
  return workspace.transformChains.some((chain) => chain.logicalMapIds.includes(logicalMapId));
}

function layerIsReferenced(map: LogicalMap, layerId: string): boolean {
  return map.bindings.some((binding) => {
    if (binding.trigger.layerId === layerId) return true;
    return binding.action.type === "layer" && binding.action.targetLayerId === layerId;
  }) || map.layers.some((layer) => layer.kind === "conditional" && layer.trigger.layerId === layerId);
}

function mapById(workspace: RuntimeState["workspace"], id: string, updater: (map: LogicalMap) => LogicalMap): RuntimeState["workspace"] {
  return {
    ...workspace,
    logicalMaps: workspace.logicalMaps.map((map) => (map.id === id ? updater(map) : map))
  };
}

export function reduceWorkspace(state: RuntimeState, action: WorkspaceAction): RuntimeState {
  const ws = state.workspace;

  switch (action.type) {
    case "workspace/load":
      return updateWorkspace(state, action.payload.workspace);
    case "workspace/reset":
      return updateWorkspace(state, emptyWorkspace);

    case "physical/addLayout":
      return updateWorkspace(state, { ...ws, physicalLayouts: [...ws.physicalLayouts, action.payload.layout] });

    case "physical/removeLayout": {
      if (referencesLayout(ws, action.payload.layoutId)) return state;
      return updateWorkspace(state, { ...ws, physicalLayouts: ws.physicalLayouts.filter((it) => it.id !== action.payload.layoutId) });
    }

    case "physical/patchLayout":
      return updateWorkspace(state, {
        ...ws,
        physicalLayouts: ws.physicalLayouts.map((layout) =>
          layout.id === action.payload.layoutId ? { ...layout, ...action.payload.patch } : layout
        )
      });

    case "physical/addKey":
      return updateWorkspace(state, {
        ...ws,
        physicalLayouts: ws.physicalLayouts.map((layout) =>
          layout.id === action.payload.layoutId ? { ...layout, keys: [...layout.keys, action.payload.key] } : layout
        )
      });

    case "physical/patchKey":
      return updateWorkspace(state, {
        ...ws,
        physicalLayouts: ws.physicalLayouts.map((layout) =>
          layout.id === action.payload.layoutId
            ? {
                ...layout,
                keys: layout.keys.map((key) => (key.id === action.payload.keyId ? { ...key, ...action.payload.patch } : key))
              }
            : layout
        )
      });

    case "physical/removeKey": {
      const layout = findLayout(ws, action.payload.layoutId);
      if (!layout) return state;
      if (keyIsReferenced(ws, layout.id, action.payload.keyId)) return state;
      return updateWorkspace(state, {
        ...ws,
        physicalLayouts: ws.physicalLayouts.map((it) =>
          it.id === layout.id ? { ...it, keys: it.keys.filter((key) => key.id !== action.payload.keyId) } : it
        )
      });
    }

    case "logical/addMap":
      return updateWorkspace(state, { ...ws, logicalMaps: [...ws.logicalMaps, action.payload.map] });

    case "logical/removeMap": {
      if (mapIsReferencedByChain(ws, action.payload.logicalMapId)) return state;
      return updateWorkspace(state, { ...ws, logicalMaps: ws.logicalMaps.filter((it) => it.id !== action.payload.logicalMapId) });
    }

    case "logical/patchMap":
      return updateWorkspace(state, {
        ...ws,
        logicalMaps: ws.logicalMaps.map((map) =>
          map.id === action.payload.logicalMapId ? { ...map, ...action.payload.patch } : map
        )
      });

    case "logical/addLayer":
      return updateWorkspace(state, mapById(ws, action.payload.logicalMapId, (map) => ({ ...map, layers: [...map.layers, action.payload.layer] })));

    case "logical/patchBaseLayer":
      return updateWorkspace(state, mapById(ws, action.payload.logicalMapId, (map) => ({
        ...map,
        layers: map.layers.map((layer) =>
          layer.id === action.payload.layerId && layer.kind === "base"
            ? { ...layer, ...action.payload.patch }
            : layer
        )
      })));

    case "logical/patchConditionalLayer":
      return updateWorkspace(state, mapById(ws, action.payload.logicalMapId, (map) => ({
        ...map,
        layers: map.layers.map((layer) =>
          layer.id === action.payload.layerId && layer.kind === "conditional"
            ? { ...layer, ...action.payload.patch }
            : layer
        )
      })));

    case "logical/removeLayer": {
      const map = findMap(ws, action.payload.logicalMapId);
      if (!map) return state;
      const layer = map.layers.find((it) => it.id === action.payload.layerId);
      if (!layer || layer.kind === "base") return state;
      if (layerIsReferenced(map, layer.id)) return state;

      return updateWorkspace(state, mapById(ws, map.id, (current) => ({
        ...current,
        layers: current.layers.filter((it) => it.id !== layer.id)
      })));
    }

    case "logical/addBinding":
      return updateWorkspace(state, mapById(ws, action.payload.logicalMapId, (map) => ({ ...map, bindings: [...map.bindings, action.payload.binding] })));

    case "logical/patchBindingTrigger":
      return updateWorkspace(state, mapById(ws, action.payload.logicalMapId, (map) => ({
        ...map,
        bindings: map.bindings.map((binding) =>
          binding.id === action.payload.bindingId
            ? { ...binding, trigger: action.payload.patch.trigger }
            : binding
        )
      })));

    case "logical/patchBindingAction":
      return updateWorkspace(state, mapById(ws, action.payload.logicalMapId, (map) => ({
        ...map,
        bindings: map.bindings.map((binding) =>
          binding.id === action.payload.bindingId
            ? { ...binding, action: action.payload.patch.action }
            : binding
        )
      })));

    case "logical/removeBinding":
      return updateWorkspace(state, mapById(ws, action.payload.logicalMapId, (map) => ({
        ...map,
        bindings: map.bindings.filter((binding) => binding.id !== action.payload.bindingId)
      })));

    case "transform/addChain":
      return updateWorkspace(state, { ...ws, transformChains: [...ws.transformChains, action.payload.chain] });

    case "transform/removeChain":
      return updateWorkspace(state, { ...ws, transformChains: ws.transformChains.filter((chain) => chain.id !== action.payload.chainId) });

    case "transform/patchChain":
      return updateWorkspace(state, {
        ...ws,
        transformChains: ws.transformChains.map((chain) =>
          chain.id === action.payload.chainId ? { ...chain, ...action.payload.patch } : chain
        )
      });

    case "transform/run":
      return { ...state, activeResult: action.payload.result };

    case "transform/clearResult":
      return clearResult(state);

    default:
      return state;
  }
}
