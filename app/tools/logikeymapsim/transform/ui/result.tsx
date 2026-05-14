"use client";

import type { RuntimeState } from "../../workspace/model";
import { emitPreview } from "../../emit/preview";

export function TransformResultView({ state }: { state: RuntimeState }) {
  if (!state.activeResult) return <section><h2>Result</h2><p>No result</p></section>;

  const lines = emitPreview({
    result: state.activeResult,
    logicalMaps: state.workspace.logicalMaps,
    physicalLayouts: state.workspace.physicalLayouts
  }).lines;

  return (
    <section>
      <h2>Result</h2>
      <ol>
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ol>
    </section>
  );
}
