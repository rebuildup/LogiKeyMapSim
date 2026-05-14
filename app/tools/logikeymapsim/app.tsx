"use client";

import { useReducer } from "react";
import { createId } from "./base/id";
import type { RuntimeState } from "./workspace/model";
import { reduceWorkspace } from "./workspace/state";
import { PhysicalEditor } from "./physical/ui/edit";
import { LogicalEditor } from "./logical/ui/edit";
import { TransformEditor } from "./transform/ui/edit";
import { TransformResultView } from "./transform/ui/result";
import { WorkspaceLoad } from "./workspace/ui/load";
import { WorkspaceSave } from "./workspace/ui/save";
import { EmitPanel } from "./emit/ui/panel";
import { emitPreview } from "./emit/preview";

const initialState: RuntimeState = {
  workspace: {
    physicalLayouts: [
      {
        id: "phys_default",
        name: "Default",
        keys: [
          { id: "key_a", x: 0, y: 0, w: 1, h: 1, note: "A" },
          { id: "key_b", x: 1, y: 0, w: 1, h: 1, note: "B" }
        ]
      }
    ],
    logicalMaps: [
      {
        id: "map_source",
        name: "Source",
        physicalId: "phys_default",
        layers: [{ id: "layer_base_src", name: "base", kind: "base" }],
        bindings: [
          {
            id: "bind_src_a",
            trigger: { type: "press", keyId: "key_a" },
            action: { type: "character", value: "A" }
          }
        ]
      },
      {
        id: "map_target",
        name: "Target",
        physicalId: "phys_default",
        layers: [{ id: "layer_base_tgt", name: "base", kind: "base" }],
        bindings: [
          {
            id: "bind_tgt_a",
            trigger: { type: "press", keyId: "key_b" },
            action: { type: "character", value: "A" }
          }
        ]
      }
    ],
    transformChains: [
      {
        id: "chain_default",
        name: "Default chain",
        logicalMapIds: ["map_source", "map_target"]
      }
    ]
  },
  activeResult: undefined
};

export function App() {
  const [state, dispatch] = useReducer(reduceWorkspace, initialState);
  const previewLines = state.activeResult
    ? emitPreview({
        result: state.activeResult,
        logicalMaps: state.workspace.logicalMaps,
        physicalLayouts: state.workspace.physicalLayouts
      }).lines
    : [];

  return (
    <main className="grid gap-8 p-4">
      <h1>LogiKeyMapSim</h1>
      <section className="flex gap-3">
        <WorkspaceLoad dispatch={dispatch} />
        <WorkspaceSave state={state} />
        <button
          type="button"
          onClick={() => {
            dispatch({
              type: "physical/addKey",
              payload: {
                layoutId: state.workspace.physicalLayouts[0]?.id ?? "",
                key: { id: createId("key"), x: 2, y: 0, w: 1, h: 1, note: "new" }
              }
            });
          }}
          disabled={!state.workspace.physicalLayouts[0]}
        >
          Add key
        </button>
      </section>

      <PhysicalEditor state={state} dispatch={dispatch} />
      <LogicalEditor state={state} />
      <TransformEditor state={state} dispatch={dispatch} />
      <TransformResultView lines={previewLines} />
      <EmitPanel
        result={state.activeResult}
        logicalMaps={state.workspace.logicalMaps}
        physicalLayouts={state.workspace.physicalLayouts}
      />
    </main>
  );
}
