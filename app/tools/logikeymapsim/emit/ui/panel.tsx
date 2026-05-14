"use client";

import { emitJson } from "../json";
import type { RuntimeState } from "../../workspace/model";

export function EmitPanel({ state }: { state: RuntimeState }) {
  if (!state.activeResult) return <section><h2>Emit</h2><p>No active result</p></section>;

  const json = emitJson({
    result: state.activeResult,
    logicalMaps: state.workspace.logicalMaps,
    physicalLayouts: state.workspace.physicalLayouts
  });

  return (
    <section>
      <h2>Emit</h2>
      <textarea readOnly value={json} className="h-60 w-full" />
    </section>
  );
}
