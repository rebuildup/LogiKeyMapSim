import { describe, expect, it } from "vitest";
import { createGrid } from "../../physical/seed";

describe("physical seed", () => {
  it("creates a grid of keys", () => {
    const keys = createGrid({ cols: 3, rows: 2, keyW: 1, keyH: 1, gap: 0 });
    expect(keys).toHaveLength(6);
    expect(keys[0]).toMatchObject({ x: 0, y: 0, w: 1, h: 1 });
    expect(keys[1]).toMatchObject({ x: 1, y: 0, w: 1, h: 1 });
    expect(keys[2]).toMatchObject({ x: 2, y: 0, w: 1, h: 1 });
    expect(keys[3]).toMatchObject({ x: 0, y: 1, w: 1, h: 1 });
  });

  it("applies gap between keys", () => {
    const keys = createGrid({ cols: 2, rows: 1, keyW: 1, keyH: 1, gap: 0.25 });
    expect(keys[0].x).toBe(0);
    expect(keys[1].x).toBe(1.25);
  });
});