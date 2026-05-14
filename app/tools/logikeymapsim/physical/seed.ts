import { createId } from "../base/id";
import type { PhysicalKey } from "./model";

type GridOptions = {
  cols: number;
  rows: number;
  keyW: number;
  keyH: number;
  gap: number;
};

export function createGrid(options: GridOptions): PhysicalKey[] {
  const { cols, rows, keyW, keyH, gap } = options;
  const keys: PhysicalKey[] = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      keys.push({
        id: createId("key"),
        x: col * (keyW + gap),
        y: row * (keyH + gap),
        w: keyW,
        h: keyH
      });
    }
  }

  return keys;
}