"use client";

import { useMemo, useState } from "react";
import type { RuntimeState, WorkspaceAction } from "../../workspace/model";
import { findOverlaps } from "../calc/overlap";
import { PhysicalInspector } from "./inspector";
import { PhysicalKeyView } from "./key";

type Props = {
  state: RuntimeState;
  dispatch: (action: WorkspaceAction) => void;
};

export function PhysicalEditor({ state, dispatch }: Props) {
  const layout = state.workspace.physicalLayouts[0];
  const [selectedKeyId, setSelectedKeyId] = useState<string | undefined>(undefined);

  const selectedKey = useMemo(() => layout?.keys.find((k) => k.id === selectedKeyId), [layout, selectedKeyId]);
  const overlaps = layout ? findOverlaps(layout) : [];

  if (!layout) return <section><h2>Physical</h2><p>No layout</p></section>;

  return (
    <section className="grid gap-3">
      <h2>Physical: {layout.name}</h2>
      <div className="relative h-[320px] w-[640px]">
        {layout.keys.map((key) => (
          <div key={key.id} onClick={() => setSelectedKeyId(key.id)}>
            <PhysicalKeyView
              keyData={key}
              onPointerMove={(dx, dy) => {
                dispatch({
                  type: "physical/patchKey",
                  payload: {
                    layoutId: layout.id,
                    keyId: key.id,
                    patch: { x: Math.round((key.x + dx) * 100) / 100, y: Math.round((key.y + dy) * 100) / 100 }
                  }
                });
              }}
            />
          </div>
        ))}
      </div>

      <PhysicalInspector
        selected={selectedKey}
        onPatch={(patch) => {
          if (!selectedKey) return;
          dispatch({
            type: "physical/patchKey",
            payload: { layoutId: layout.id, keyId: selectedKey.id, patch }
          });
        }}
      />

      <section>
        <h3>Overlaps</h3>
        <ul>
          {overlaps.map((overlap) => (
            <li key={`${overlap.code}-${overlap.relatedIds.join("-")}`}>{overlap.message}</li>
          ))}
        </ul>
      </section>
    </section>
  );
}
