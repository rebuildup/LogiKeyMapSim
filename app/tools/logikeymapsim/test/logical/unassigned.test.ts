import { describe, expect, it } from "vitest";
import { findUnassignedBaseKeys } from "../../logical/calc/unassigned";
import type { LogicalMap } from "../../logical/model";
import type { PhysicalLayout } from "../../physical/model";

const layout: PhysicalLayout = {
  id: "phys_1",
  name: "l",
  keys: [
    { id: "key_a", x: 0, y: 0, w: 1, h: 1 },
    { id: "key_b", x: 1, y: 0, w: 1, h: 1 }
  ]
};

const mapBase: LogicalMap = {
  id: "map_1",
  name: "m",
  physicalId: "phys_1",
  layers: [
    { id: "layer_base", name: "base", kind: "base" },
    { id: "layer_cond", name: "nav", kind: "conditional", trigger: { type: "press", keyId: "key_a" } }
  ],
  bindings: []
};

describe("logical unassigned", () => {
  it("returns guide for key without base layer binding", () => {
    const guides = findUnassignedBaseKeys(mapBase, layout);
    expect(guides.length).toBe(2);
  });

  it("returns no guide for assigned base key", () => {
    const map: LogicalMap = {
      ...mapBase,
      bindings: [{ id: "b1", trigger: { type: "press", keyId: "key_a" }, action: { type: "character", value: "A" } }]
    };

    const guides = findUnassignedBaseKeys(map, layout);
    expect(guides.some((g) => g.relatedIds.includes("key_a"))).toBe(false);
  });

  it("returns base guide when only conditional has binding", () => {
    const map: LogicalMap = {
      ...mapBase,
      bindings: [
        {
          id: "b1",
          trigger: { type: "press", keyId: "key_a", layerId: "layer_cond" },
          action: { type: "character", value: "A" }
        }
      ]
    };

    const guides = findUnassignedBaseKeys(map, layout);
    expect(guides.some((g) => g.relatedIds.includes("key_a"))).toBe(true);
  });
});
