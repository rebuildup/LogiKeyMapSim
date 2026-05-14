"use client";

import type { PhysicalKey } from "../model";

type Props = {
  keyData: PhysicalKey;
  onPointerMove?: (dx: number, dy: number) => void;
};

export function PhysicalKeyView({ keyData, onPointerMove }: Props) {
  return (
    <button
      type="button"
      aria-label={`physical-key-${keyData.id}`}
      className="absolute"
      style={{
        left: `${keyData.x * 48}px`,
        top: `${keyData.y * 48}px`,
        width: `${keyData.w * 48}px`,
        height: `${keyData.h * 48}px`
      }}
      onPointerDown={(event) => {
        const startX = event.clientX;
        const startY = event.clientY;

        const move = (next: PointerEvent) => {
          onPointerMove?.((next.clientX - startX) / 48, (next.clientY - startY) / 48);
        };

        const up = () => {
          window.removeEventListener("pointermove", move);
          window.removeEventListener("pointerup", up);
        };

        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);
      }}
    >
      {keyData.note ?? keyData.id}
    </button>
  );
}
