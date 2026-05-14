import { describe, expect, it } from "vitest";
import { emitJson } from "../../emit/json";

const mockLayout = {
  id: "phys_1",
  name: "layout",
  keys: [
    { id: "key_a", x: 0, y: 0, w: 1, h: 1, note: "Key A" },
    { id: "key_b", x: 1, y: 0, w: 1, h: 1, note: "Key B" }
  ]
};

const mockResult = {
  chainId: "chain_1",
  operations: [
    {
      id: "op_1",
      kind: "replace" as const,
      stage: { index: 0, fromLogicalMapId: "map_1", toLogicalMapId: "map_2" },
      from: { logicalMapId: "map_1", bindingId: "bind_1" },
      to: { logicalMapId: "map_2", bindingId: "bind_2" }
    }
  ],
  warnings: [],
  guides: []
};

describe("emit/json", () => {
  it("resolves keyNames from physical layout notes", () => {
    const map = {
      id: "map_1",
      name: "map",
      physicalId: "phys_1",
      layers: [{ id: "layer_base", name: "base", kind: "base" as const }],
      bindings: [
        {
          id: "bind_1",
          trigger: { type: "press", keyId: "key_a" },
          action: { type: "character", value: "A" }
        }
      ]
    };
    const output = emitJson({
      result: mockResult,
      logicalMaps: [map],
      physicalLayouts: [mockLayout]
    });
    const parsed = JSON.parse(output);
    expect(parsed.kind).toBe("resolved-transform-result");
    expect(parsed.operations[0].from?.keyNames).toContain("Key A");
  });

  it("falls back to keyId when note is missing", () => {
    const map = {
      id: "map_1",
      name: "map",
      physicalId: "phys_1",
      layers: [{ id: "layer_base", name: "base", kind: "base" as const }],
      bindings: [
        {
          id: "bind_1",
          trigger: { type: "press", keyId: "key_unknown" },
          action: { type: "character", value: "A" }
        }
      ]
    };
    const output = emitJson({
      result: mockResult,
      logicalMaps: [map],
      physicalLayouts: [mockLayout]
    });
    const parsed = JSON.parse(output);
    expect(parsed.operations[0].from?.keyNames).toContain("key_unknown");
  });
});