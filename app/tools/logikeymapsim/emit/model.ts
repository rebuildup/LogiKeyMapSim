import type { LogicalMap } from "../logical/model";
import type { PhysicalLayout } from "../physical/model";
import type { TransformResult } from "../transform/model";

export type EmitContext = {
  result: TransformResult;
  logicalMaps: LogicalMap[];
  physicalLayouts: PhysicalLayout[];
};

export type PreviewOutput = {
  lines: string[];
};
