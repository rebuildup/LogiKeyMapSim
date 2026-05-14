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
  if (!result) return <section><h2>Emit</h2><p>No active result</p></section>;

  const json = emitJson({
    result,
    logicalMaps,
    physicalLayouts
  });

  return (
    <section>
      <h2>Emit</h2>
      <textarea readOnly value={json} className="h-60 w-full" />
    </section>
  );
}
