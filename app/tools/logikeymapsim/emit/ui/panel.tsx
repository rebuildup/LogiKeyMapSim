"use client";

import { emitJson } from "../json";
import type { LogicalMap } from "../../logical/model";
import type { PhysicalLayout } from "../../physical/model";
import type { TransformResult } from "../../transform/model";

type Props = {
  result?: TransformResult;
  logicalMaps: LogicalMap[];
  physicalLayouts: PhysicalLayout[];
};

export function EmitPanel({ result, logicalMaps, physicalLayouts }: Props) {
  if (!result) return <div className="p-4 border border-gray-300"><h2 className="text-lg font-bold mb-3">Emit</h2><p className="text-sm text-gray-600">No active result</p></div>;

  const json = emitJson({
    result,
    logicalMaps,
    physicalLayouts
  });

  return (
    <div className="p-4 border border-gray-300">
      <h2 className="text-lg font-bold mb-3">Emit (Resolved TransformResult JSON)</h2>
      <textarea readOnly value={json} className="w-full h-60 text-xs p-2 border border-gray-300 font-mono" />
    </div>
  );
}
