import type { LogicalMap } from "../../logical/model";
import type { PhysicalLayout } from "../../physical/model";
import type { TransformChain, TransformResult } from "../model";
import { diff } from "./diff";

export function planChain(chain: TransformChain, maps: LogicalMap[], layouts: PhysicalLayout[]): TransformResult {
  const operations: TransformResult["operations"] = [];
  const warnings: TransformResult["warnings"] = [];
  const guides: TransformResult["guides"] = [];

  for (let index = 0; index < chain.logicalMapIds.length - 1; index += 1) {
    const fromId = chain.logicalMapIds[index];
    const toId = chain.logicalMapIds[index + 1];
    const fromMap = maps.find((it) => it.id === fromId);
    const toMap = maps.find((it) => it.id === toId);
    if (!fromMap || !toMap) continue;

    const result = diff(fromMap, toMap, {
      chainId: chain.id,
      physicalLayouts: layouts,
      stage: {
        index,
        fromLogicalMapId: fromId,
        toLogicalMapId: toId
      }
    });

    operations.push(...result.operations);
    warnings.push(...result.warnings);
    guides.push(...result.guides);
  }

  return {
    chainId: chain.id,
    operations,
    warnings,
    guides
  };
}
