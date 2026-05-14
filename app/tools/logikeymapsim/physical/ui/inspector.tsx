"use client";

import type { PhysicalKey, PhysicalKeyPatch } from "../model";

type Props = {
  selected?: PhysicalKey;
  onPatch: (patch: PhysicalKeyPatch) => void;
};

export function PhysicalInspector({ selected, onPatch }: Props) {
  if (!selected) return <p>No key selected</p>;

  return (
    <section className="grid gap-2">
      <label>
        x
        <input type="number" value={selected.x} onChange={(e) => onPatch({ x: Number(e.target.value) })} />
      </label>
      <label>
        y
        <input type="number" value={selected.y} onChange={(e) => onPatch({ y: Number(e.target.value) })} />
      </label>
      <label>
        w
        <input type="number" value={selected.w} onChange={(e) => onPatch({ w: Number(e.target.value) })} />
      </label>
      <label>
        h
        <input type="number" value={selected.h} onChange={(e) => onPatch({ h: Number(e.target.value) })} />
      </label>
      <label>
        note
        <input type="text" value={selected.note ?? ""} onChange={(e) => onPatch({ note: e.target.value })} />
      </label>
    </section>
  );
}
