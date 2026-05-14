"use client";

import type { RuntimeState, WorkspaceAction } from "../../workspace/model";
import { planChain } from "../calc/chain";

export function TransformEditor({ state, dispatch }: { state: RuntimeState; dispatch: (action: WorkspaceAction) => void }) {
  const chain = state.workspace.transformChains[0];

  return (
    <section className="grid gap-2">
      <h2>Transform</h2>
      <p>{chain ? chain.name : "No chain"}</p>
      <button
        type="button"
        disabled={!chain}
        onClick={() => {
          if (!chain) return;
          const result = planChain(chain, state.workspace.logicalMaps, state.workspace.physicalLayouts);
          dispatch({ type: "transform/run", payload: { result } });
        }}
      >
        Run transform
      </button>
      <button type="button" onClick={() => dispatch({ type: "transform/clearResult" })}>Clear result</button>
    </section>
  );
}
