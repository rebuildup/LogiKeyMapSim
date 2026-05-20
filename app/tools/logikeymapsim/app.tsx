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
import { presets as physicalPresets } from "./preset/physical";
import { presets as logicalPresets } from "./preset/logical";

function createInitialState(): RuntimeState {
  const physPreset = physicalPresets[0];
  const mapPreset = logicalPresets[0];
  return {
    workspace: {
      physicalLayouts: [physPreset],
      logicalMaps: [mapPreset],
      transformChains: [
        {
          id: createId("chain"),
          name: "Transform",
          logicalMapIds: [mapPreset.id]
        }
      ]
    },
    activeResult: undefined
  };
}

export function App() {
  const [state, dispatch] = useReducer(reduceWorkspace, createInitialState());
  const previewLines = state.activeResult
    ? emitPreview({
        result: state.activeResult,
        logicalMaps: state.workspace.logicalMaps,
        physicalLayouts: state.workspace.physicalLayouts
      }).lines
    : [];

  return (
    <main className="min-h-screen bg-white text-black p-6">
      <header className="mb-6">
        <h1 className="text-xl font-bold">LogiKeyMapSim</h1>
        <p className="text-sm text-gray-600 mt-1">Logical Key Mapping Simulator</p>
      </header>

      <div className="flex gap-4 mb-6">
        <WorkspaceLoad dispatch={dispatch} />
        <WorkspaceSave state={state} />
        <button
          type="button"
          onClick={() => {
            dispatch({
              type: "physical/addKey",
              payload: {
                layoutId: state.workspace.physicalLayouts[0]?.id ?? "",
                key: { id: createId("key"), x: 0, y: 5, w: 1, h: 1, note: "?" }
              }
            });
          }}
          disabled={!state.workspace.physicalLayouts[0]}
        >
          Add key
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PhysicalEditor state={state} dispatch={dispatch} />
        <LogicalEditor state={state} dispatch={dispatch} />
      </div>

      <div className="mt-6">
        <TransformEditor state={state} dispatch={dispatch} />
      </div>

      {previewLines.length > 0 && (
        <div className="mt-6">
          <TransformResultView lines={previewLines} />
        </div>
      )}

      <div className="mt-6">
        <EmitPanel
          result={state.activeResult}
          logicalMaps={state.workspace.logicalMaps}
          physicalLayouts={state.workspace.physicalLayouts}
        />
      </div>
    </main>
  );
}
