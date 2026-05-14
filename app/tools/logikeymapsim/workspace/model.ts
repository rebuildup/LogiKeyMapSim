import type { Id } from "../base/id";
import type { BaseLayerPatch, Binding, BindingActionPatch, BindingTriggerPatch, ConditionalLayerPatch, Layer, LogicalMap, LogicalMapPatch } from "../logical/model";
import type { PhysicalKey, PhysicalKeyPatch, PhysicalLayout, PhysicalLayoutPatch } from "../physical/model";
import type { TransformChain, TransformChainPatch, TransformResult } from "../transform/model";

export type Workspace = {
  physicalLayouts: PhysicalLayout[];
  logicalMaps: LogicalMap[];
  transformChains: TransformChain[];
};

export type RuntimeState = {
  workspace: Workspace;
  activeResult?: TransformResult;
};

export type WorkspaceAction =
  | { type: "workspace/load"; payload: { workspace: Workspace } }
  | { type: "workspace/reset" }
  | { type: "physical/addLayout"; payload: { layout: PhysicalLayout } }
  | { type: "physical/removeLayout"; payload: { layoutId: Id } }
  | { type: "physical/patchLayout"; payload: { layoutId: Id; patch: PhysicalLayoutPatch } }
  | { type: "physical/addKey"; payload: { layoutId: Id; key: PhysicalKey } }
  | { type: "physical/patchKey"; payload: { layoutId: Id; keyId: Id; patch: PhysicalKeyPatch } }
  | { type: "physical/removeKey"; payload: { layoutId: Id; keyId: Id } }
  | { type: "logical/addMap"; payload: { map: LogicalMap } }
  | { type: "logical/removeMap"; payload: { logicalMapId: Id } }
  | { type: "logical/patchMap"; payload: { logicalMapId: Id; patch: LogicalMapPatch } }
  | { type: "logical/addLayer"; payload: { logicalMapId: Id; layer: Layer } }
  | { type: "logical/patchBaseLayer"; payload: { logicalMapId: Id; layerId: Id; patch: BaseLayerPatch } }
  | { type: "logical/patchConditionalLayer"; payload: { logicalMapId: Id; layerId: Id; patch: ConditionalLayerPatch } }
  | { type: "logical/removeLayer"; payload: { logicalMapId: Id; layerId: Id } }
  | { type: "logical/addBinding"; payload: { logicalMapId: Id; binding: Binding } }
  | { type: "logical/patchBindingTrigger"; payload: { logicalMapId: Id; bindingId: Id; patch: BindingTriggerPatch } }
  | { type: "logical/patchBindingAction"; payload: { logicalMapId: Id; bindingId: Id; patch: BindingActionPatch } }
  | { type: "logical/removeBinding"; payload: { logicalMapId: Id; bindingId: Id } }
  | { type: "transform/addChain"; payload: { chain: TransformChain } }
  | { type: "transform/removeChain"; payload: { chainId: Id } }
  | { type: "transform/patchChain"; payload: { chainId: Id; patch: TransformChainPatch } }
  | { type: "transform/run"; payload: { result: TransformResult } }
  | { type: "transform/clearResult" };

export const emptyWorkspace: Workspace = {
  physicalLayouts: [],
  logicalMaps: [],
  transformChains: []
};

export const emptyRuntimeState: RuntimeState = {
  workspace: emptyWorkspace,
  activeResult: undefined
};
