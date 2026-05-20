"use client";

import { useMemo, useState } from "react";
import type { RuntimeState, WorkspaceAction } from "../../workspace/model";
import { findOverlaps } from "../calc/overlap";
import { PhysicalInspector } from "./inspector";
import { PhysicalKeyView } from "./key";
import { createGrid } from "../seed";
import { presets as physicalPresets } from "../../preset/physical";
import { createId } from "../../base/id";

type Props = {
  state: RuntimeState;
  dispatch: (action: WorkspaceAction) => void;
};

const UNIT = 48;

export function PhysicalEditor({ state, dispatch }: Props) {
  const layout = state.workspace.physicalLayouts[0];
  const [selectedKeyId, setSelectedKeyId] = useState<string | undefined>(undefined);

  const selectedKey = useMemo(() => layout?.keys.find((k) => k.id === selectedKeyId), [layout, selectedKeyId]);
  const overlaps = layout ? findOverlaps(layout) : [];

  if (!layout) return (
    <section className="p-4 border border-gray-300">
      <h2 className="text-lg font-bold mb-3">Physical</h2>
      <p className="text-sm text-gray-600 mb-3">No layout loaded.</p>
      <button
        type="button"
        onClick={() => {
          const preset = physicalPresets[0];
          dispatch({
            type: "physical/addLayout",
            payload: { layout: { id: preset.id, name: preset.name, keys: [...preset.keys] } }
          });
        }}
        className="text-sm px-3 py-1 border border-gray-400"
      >
        Load 60% Keyboard
      </button>
    </section>
  );

  const bounds = useMemo(() => {
    return layout.keys.reduce(
      (acc, key) => ({
        maxX: Math.max(acc.maxX, key.x + key.w),
        maxY: Math.max(acc.maxY, key.y + key.h)
      }),
      { maxX: 14, maxY: 5 }
    );
  }, [layout.keys]);

  const handleSelectKey = (keyId: string) => {
    setSelectedKeyId(keyId);
  };

  return (
    <section className="p-4 border border-gray-300">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold">Physical: {layout.name}</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              dispatch({ type: "physical/addLayout", payload: { layout: { id: createId("phys"), name: "New Layout", keys: [] } } });
            }}
            className="text-sm px-3 py-1 border border-gray-400"
          >
            New Layout
          </button>
          {state.workspace.physicalLayouts.length > 1 && (
            <select
              className="border border-gray-300 px-2 py-1 text-sm"
              value={layout.id}
              onChange={(e) => {
                // Switch layout
              }}
            >
              {state.workspace.physicalLayouts.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="mb-4 flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => {
            const newKeys = createGrid({ cols: 14, rows: 5, keyW: 1, keyH: 1, gap: 0 });
            for (const key of newKeys) {
              dispatch({ type: "physical/addKey", payload: { layoutId: layout.id, key } });
            }
          }}
          className="text-sm px-3 py-1 border border-gray-400"
        >
          Generate 14x5 Grid
        </button>
        <button
          type="button"
          onClick={() => {
            dispatch({ type: "physical/patchLayout", payload: { layoutId: layout.id, patch: { name: "60% Keyboard" } } });
            for (const key of physicalPresets[0].keys) {
              dispatch({ type: "physical/addKey", payload: { layoutId: layout.id, key } });
            }
          }}
          className="text-sm px-3 py-1 border border-gray-400"
        >
          Load 60%
        </button>
        {layout.keys.length > 0 && (
          <button
            type="button"
            onClick={() => {
              for (const key of [...layout.keys]) {
                dispatch({ type: "physical/removeKey", payload: { layoutId: layout.id, keyId: key.id } });
              }
            }}
            className="text-sm px-3 py-1 border border-gray-400 text-red-600"
          >
            Clear All
          </button>
        )}
      </div>

      {layout.keys.length === 0 ? (
        <div className="text-sm text-gray-500 p-4 border border-dashed border-gray-300">
          No keys. Click "Generate 14x5 Grid" or "Load 60%" to add keys.
        </div>
      ) : (
        <div
          className="relative bg-gray-50 border border-gray-300 overflow-auto"
          style={{
            width: `${bounds.maxX * UNIT}px`,
            height: `${bounds.maxY * UNIT}px`,
            minWidth: "672px",
            minHeight: "240px"
          }}
        >
          {layout.keys.map((key) => (
            <div
              key={key.id}
              onClick={() => handleSelectKey(key.id)}
              className={`absolute cursor-pointer ${selectedKeyId === key.id ? "ring-2 ring-blue-500 ring-inset" : ""}`}
              style={{ zIndex: selectedKeyId === key.id ? 10 : 1 }}
            >
              <PhysicalKeyView
                keyData={key}
                onPointerMove={(dx, dy) => {
                  dispatch({
                    type: "physical/patchKey",
                    payload: { layoutId: layout.id, keyId: key.id, patch: { x: key.x + dx, y: key.y + dy } }
                  });
                }}
              />
            </div>
          ))}
        </div>
      )}

      <div className="mt-4">
        <PhysicalInspector
          selected={selectedKey}
          onPatch={(patch) => {
            if (!selectedKey) return;
            dispatch({ type: "physical/patchKey", payload: { layoutId: layout.id, keyId: selectedKey.id, patch } });
          }}
        />
      </div>

      {overlaps.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold mb-1">Overlaps</h3>
          <ul className="text-sm text-orange-700">
            {overlaps.map((overlap) => (
              <li key={`${overlap.code}-${overlap.relatedIds.join("-")}`}>{overlap.message}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
