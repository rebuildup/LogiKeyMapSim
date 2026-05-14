import { createId } from "../base/id";
import type { PhysicalKey, PhysicalLayout } from "./model";

export function seedGridLayout(name: string, cols = 12, rows = 4): PhysicalLayout {
  const keys: PhysicalKey[] = [];
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      keys.push({
        id: createId("key"),
        x,
        y,
        w: 1,
        h: 1,
        note: `K${y}-${x}`
      });
    }
  }
  return {
    id: createId("phys"),
    name,
    keys
  };
}
