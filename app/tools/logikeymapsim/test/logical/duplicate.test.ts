import { describe, expect, it } from "vitest";
import { findDuplicates } from "../../logical/calc/duplicate";
import type { LogicalMap } from "../../logical/model";

const base: LogicalMap = {
  id: "map_1",
  name: "m",
  physicalId: "phys_1",
  layers: [
    { id: "layer_base", name: "base", kind: "base" },
    { id: "layer_cond", name: "nav", kind: "conditional", trigger: { type: "press", keyId: "key_a" } }
  ],
  bindings: []
};

describe("logical duplicate", () => {
  it("detects same action in same layer", () => {
    const map: LogicalMap = {
      ...base,
      bindings: [
        { id: "b1", trigger: { type: "press", keyId: "key_a" }, action: { type: "character", value: "A" } },
        { id: "b2", trigger: { type: "press", keyId: "key_b" }, action: { type: "character", value: "A" } }
      ]
    };

    const issues = findDuplicates(map);
    expect(issues.some((it) => it.code === "logical.duplicateAction")).toBe(true);
  });

  it("detects same trigger", () => {
    const map: LogicalMap = {
      ...base,
      bindings: [
        { id: "b1", trigger: { type: "press", keyId: "key_a" }, action: { type: "character", value: "A" } },
        { id: "b2", trigger: { type: "press", keyId: "key_a" }, action: { type: "character", value: "B" } }
      ]
    };

    const issues = findDuplicates(map);
    expect(issues.some((it) => it.code === "logical.duplicateTrigger")).toBe(true);
  });

  it("detects same action in different layers", () => {
    const map: LogicalMap = {
      ...base,
      bindings: [
        { id: "b1", trigger: { type: "press", keyId: "key_a" }, action: { type: "character", value: "A" } },
        { id: "b2", trigger: { type: "press", keyId: "key_b", layerId: "layer_cond" }, action: { type: "character", value: "A" } }
      ]
    };

    const issues = findDuplicates(map);
    expect(issues.some((it) => it.code === "logical.duplicateAction")).toBe(true);
  });

  it("does not detect different action", () => {
    const map: LogicalMap = {
      ...base,
      bindings: [
        { id: "b1", trigger: { type: "press", keyId: "key_a" }, action: { type: "character", value: "A" } },
        { id: "b2", trigger: { type: "press", keyId: "key_b" }, action: { type: "character", value: "B" } }
      ]
    };

    expect(findDuplicates(map).length).toBe(0);
  });
});
