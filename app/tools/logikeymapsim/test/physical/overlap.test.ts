import { describe, expect, it } from "vitest";
import { findOverlaps } from "../../physical/calc/overlap";
import type { PhysicalLayout } from "../../physical/model";

describe("physical overlap", () => {
  it("detects overlapping rectangles", () => {
    const layout: PhysicalLayout = {
      id: "phys_1",
      name: "l",
      keys: [
        { id: "A", x: 0, y: 0, w: 2, h: 1 },
        { id: "B", x: 1, y: 0, w: 2, h: 1 }
      ]
    };

    const issues = findOverlaps(layout);
    expect(issues).toHaveLength(1);
    expect(issues[0].code).toBe("physical.overlap");
  });

  it("does not detect touching rectangles as overlap", () => {
    const layout: PhysicalLayout = {
      id: "phys_1",
      name: "l",
      keys: [
        { id: "A", x: 0, y: 0, w: 1, h: 1 },
        { id: "B", x: 1, y: 0, w: 1, h: 1 }
      ]
    };

    expect(findOverlaps(layout)).toHaveLength(0);
  });

  it("does not detect separated rectangles", () => {
    const layout: PhysicalLayout = {
      id: "phys_1",
      name: "l",
      keys: [
        { id: "A", x: 0, y: 0, w: 1, h: 1 },
        { id: "B", x: 2, y: 0, w: 1, h: 1 }
      ]
    };

    expect(findOverlaps(layout)).toHaveLength(0);
  });
});
