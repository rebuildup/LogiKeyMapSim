import type { Id } from "../base/id";
import type { Issue } from "../base/issue";

export type TransformChain = {
  id: Id;
  name: string;
  logicalMapIds: Id[];
};

export type TransformChainPatch = Partial<Pick<TransformChain, "name" | "logicalMapIds">>;

export type BindingRef = {
  logicalMapId: Id;
  bindingId: Id;
};

export type TransformStage = {
  index: number;
  fromLogicalMapId: Id;
  toLogicalMapId: Id;
};

export type ManualReason =
  | "missingSourceAction"
  | "missingTargetAction"
  | "ambiguousSourceAction"
  | "ambiguousTargetAction"
  | "unsupportedAction"
  | "invalidReference";

export type TransformOperation = {
  id: Id;
  kind: "replace" | "manual";
  stage: TransformStage;
  from?: BindingRef;
  to?: BindingRef;
  reason?: ManualReason;
  note?: string;
};

export type TransformResult = {
  chainId: Id;
  operations: TransformOperation[];
  warnings: Issue[];
  guides: Issue[];
};
