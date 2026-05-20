"use client";

import type { RuntimeState, WorkspaceAction } from "../../workspace/model";
import { planChain } from "../calc/chain";

export function TransformEditor({ state, dispatch }: { state: RuntimeState; dispatch: (action: WorkspaceAction) => void }) {
  const chain = state.workspace.transformChains[0];

  return (
    <div className="p-4 border border-gray-300">
      <h2 className="text-lg font-bold mb-3">Transform</h2>
      <p className="text-sm mb-3">{chain ? chain.name : "No chain"}</p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={!chain}
          onClick={() => {
            if (!chain) return;
            const result = planChain(chain, state.workspace.logicalMaps, state.workspace.physicalLayouts);
            dispatch({ type: "transform/run", payload: { result } });
          }}
          className="text-sm px-3 py-1 border border-gray-400 disabled:opacity-50"
        >
          Run transform
        </button>
        <button type="button" onClick={() => dispatch({ type: "transform/clearResult" })} className="text-sm px-3 py-1 border border-gray-400">
          Clear result
        </button>
      </div>
    </div>
  );
}
