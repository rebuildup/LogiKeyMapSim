import type { TransformOperation } from "../model";

export function collectManualOperations(operations: TransformOperation[]): TransformOperation[] {
  return operations.filter((op) => op.kind === "manual");
}
