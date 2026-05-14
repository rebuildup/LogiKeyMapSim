import type { LogicalMap } from "../logical/model";
import type { Action, InputTrigger } from "../logical/model";
import type { PhysicalLayout } from "../physical/model";
import type { ManualReason, TransformResult, TransformStage } from "../transform/model";
import type { Id } from "../base/id";
import type { Issue } from "../base/issue";

export type EmitContext = {
  result: TransformResult;
  logicalMaps: LogicalMap[];
  physicalLayouts: PhysicalLayout[];
};

export type PreviewOutput = {
  lines: string[];
};

export type ResolvedBinding = {
  logicalMapId: Id;
  bindingId: Id;
  trigger: InputTrigger;
  action: Action;
  keyNames: string[];
  layerName: string;
};

export type ResolvedTransformOperation = {
  id: Id;
  kind: "replace" | "manual";
  stage: TransformStage;
  from?: ResolvedBinding;
  to?: ResolvedBinding;
  reason?: ManualReason;
  note?: string;
};

export type ResolvedTransformResultJson = {
  kind: "resolved-transform-result";
  chainId: Id;
  operations: ResolvedTransformOperation[];
  warnings: Issue[];
  guides: Issue[];
};
