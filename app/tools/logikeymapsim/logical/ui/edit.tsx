"use client";

import { useState } from "react";
import type { Binding } from "../model";
import type { RuntimeState, WorkspaceAction } from "../../workspace/model";
import { findDuplicates } from "../calc/duplicate";
import { findUnassignedBaseKeys } from "../calc/unassigned";
import { BindingList } from "./binding";
import { LayerList } from "./layer";
import { presets as logicalPresets } from "../../preset/logical";
import { createId } from "../../base/id";

type Props = {
  state: RuntimeState;
  dispatch: (action: WorkspaceAction) => void;
};

export function LogicalEditor({ state, dispatch }: Props) {
  const [selectedMapId, setSelectedMapId] = useState<string | undefined>(
    state.workspace.logicalMaps[0]?.id
  );

  const map = state.workspace.logicalMaps.find(m => m.id === selectedMapId) ?? state.workspace.logicalMaps[0];
  const layout = map ? state.workspace.physicalLayouts.find(l => l.id === map.physicalId) : undefined;
  const duplicates = map ? findDuplicates(map) : [];
  const guides = map && layout ? findUnassignedBaseKeys(map, layout) : [];

  const handleAddBinding = (binding: Binding) => {
    if (!map) return;
    dispatch({ type: "logical/addBinding", payload: { logicalMapId: map.id, binding } });
  };

  const handleRemoveBinding = (bindingId: string) => {
    if (!map) return;
    dispatch({ type: "logical/removeBinding", payload: { logicalMapId: map.id, bindingId } });
  };

  if (!map) return (
    <section className="p-4 border border-gray-300">
      <h2 className="text-lg font-bold mb-3">Logical</h2>
      <p className="text-sm text-gray-600">No logical map. Create one to get started.</p>
      <button
        type="button"
        onClick={() => {
          const preset = logicalPresets[0];
          dispatch({
            type: "logical/addMap",
            payload: {
              map: {
                id: createId("map"),
                name: preset.name,
                physicalId: state.workspace.physicalLayouts[0]?.id ?? "",
                layers: [...preset.layers],
                bindings: []
              }
            }
          });
        }}
        className="mt-3 text-sm px-3 py-1 border border-gray-400"
      >
        Create QWERTY Map
      </button>
    </section>
  );

  return (
    <section className="p-4 border border-gray-300">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold">Logical: {map.name}</h2>
        <select
          className="border border-gray-300 px-2 py-1 text-sm"
          value={map.id}
          onChange={(e) => setSelectedMapId(e.target.value)}
        >
          {state.workspace.logicalMaps.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => {
            dispatch({
              type: "logical/addMap",
              payload: {
                map: {
                  id: createId("map"),
                  name: "New Map",
                  physicalId: layout?.id ?? "",
                  layers: [{ id: createId("layer"), name: "base", kind: "base" }],
                  bindings: []
                }
              }
            });
          }}
          className="text-sm px-3 py-1 border border-gray-400"
        >
          New Map
        </button>
        <button
          type="button"
          onClick={() => {
            const preset = logicalPresets[0];
            dispatch({
              type: "logical/addMap",
              payload: {
                map: {
                  id: createId("map"),
                  name: preset.name,
                  physicalId: layout?.id ?? "",
                  layers: [...preset.layers],
                  bindings: []
                }
              }
            });
          }}
          className="text-sm px-3 py-1 border border-gray-400"
        >
          Add QWERTY
        </button>
        {state.workspace.logicalMaps.length > 1 && (
          <button
            type="button"
            onClick={() => {
              dispatch({ type: "logical/removeMap", payload: { logicalMapId: map.id } });
              setSelectedMapId(state.workspace.logicalMaps.find(m => m.id !== map.id)?.id);
            }}
            className="text-sm px-3 py-1 border border-gray-400 text-red-600"
          >
            Delete
          </button>
        )}
      </div>

      {layout && (
        <div className="mb-4 p-3 bg-gray-50 border border-gray-200">
          <p className="text-xs text-gray-500 mb-2">Physical Layout: {layout.name}</p>
          <div className="flex flex-wrap gap-1">
            {layout.keys.map(key => {
              const binding = map.bindings.find(b =>
                b.trigger.type === "press" && b.trigger.keyId === key.id
              );
              return (
                <div
                  key={key.id}
                  className={`px-2 py-1 text-xs border ${
                    binding ? "bg-blue-100 border-blue-400" : "bg-gray-100 border-gray-300"
                  }`}
                  title={key.note ?? key.id}
                >
                  {key.note ?? key.id.slice(-4)}
                  {binding && <span className="ml-1 text-blue-600">→{binding.action.type === "character" ? binding.action.value : binding.action.type}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <LayerList layers={map.layers} />
      <BindingList bindings={map.bindings} layout={layout} onAddBinding={handleAddBinding} onRemoveBinding={handleRemoveBinding} />

      {duplicates.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold mb-1">Warnings</h3>
          <ul className="text-sm text-orange-700">{duplicates.map((d) => <li key={`${d.code}-${d.message}`}>{d.message}</li>)}</ul>
        </div>
      )}
      {guides.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold mb-1">Guides ({guides.length} unassigned)</h3>
          <ul className="text-sm text-gray-600">{guides.slice(0, 10).map((g) => <li key={`${g.code}-${g.relatedIds.join("-")}`}>{g.message}</li>)}</ul>
          {guides.length > 10 && <p className="text-xs text-gray-400">...and {guides.length - 10} more</p>}
        </div>
      )}
    </section>
  );
}
