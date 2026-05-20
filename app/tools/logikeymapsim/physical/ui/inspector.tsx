"use client";

import type { PhysicalKey, PhysicalKeyPatch } from "../model";

type Props = {
  selected?: PhysicalKey;
  onPatch: (patch: PhysicalKeyPatch) => void;
};

export function PhysicalInspector({ selected, onPatch }: Props) {
  if (!selected) return <p className="text-sm text-gray-600">Select a key to edit</p>;

  return (
    <div className="grid grid-cols-5 gap-2 text-sm">
      <label className="flex flex-col">
        <span className="text-xs text-gray-500 mb-1">X</span>
        <input type="number" value={selected.x} onChange={(e) => onPatch({ x: Number(e.target.value) })} className="border border-gray-300 px-2 py-1" />
      </label>
      <label className="flex flex-col">
        <span className="text-xs text-gray-500 mb-1">Y</span>
        <input type="number" value={selected.y} onChange={(e) => onPatch({ y: Number(e.target.value) })} className="border border-gray-300 px-2 py-1" />
      </label>
      <label className="flex flex-col">
        <span className="text-xs text-gray-500 mb-1">W</span>
        <input type="number" value={selected.w} onChange={(e) => onPatch({ w: Number(e.target.value) })} className="border border-gray-300 px-2 py-1" />
      </label>
      <label className="flex flex-col">
        <span className="text-xs text-gray-500 mb-1">H</span>
        <input type="number" value={selected.h} onChange={(e) => onPatch({ h: Number(e.target.value) })} className="border border-gray-300 px-2 py-1" />
      </label>
      <label className="flex flex-col col-span-1">
        <span className="text-xs text-gray-500 mb-1">Note</span>
        <input type="text" value={selected.note ?? ""} onChange={(e) => onPatch({ note: e.target.value })} className="border border-gray-300 px-2 py-1" />
      </label>
    </div>
  );
}
