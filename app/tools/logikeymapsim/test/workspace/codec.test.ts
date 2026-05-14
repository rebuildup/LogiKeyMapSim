import { describe, expect, it } from "vitest";
import { decodeWorkspace } from "../../workspace/codec";

function validWorkspace() {
  return {
    physicalLayouts: [
      {
        id: "phys_1",
        name: "layout",
        keys: [
          { id: "key_a", x: 0, y: 0, w: 1, h: 1 },
          { id: "key_b", x: 1, y: 0, w: 1, h: 1 }
        ]
      }
    ],
    logicalMaps: [
      {
        id: "map_1",
        name: "map",
        physicalId: "phys_1",
        layers: [
          { id: "layer_base", name: "base", kind: "base" },
          { id: "layer_nav", name: "nav", kind: "conditional", trigger: { type: "press", keyId: "key_a" } }
        ],
        bindings: [
          { id: "bind_1", trigger: { type: "press", keyId: "key_a" }, action: { type: "character", value: "A" } },
          { id: "bind_2", trigger: { type: "press", keyId: "key_b" }, action: { type: "layer", targetLayerId: "layer_nav", mode: "toggle" } }
        ]
      }
    ],
    transformChains: [{ id: "chain_1", name: "c", logicalMapIds: ["map_1", "map_1"] }]
  };
}

describe("workspace codec", () => {
  it("accepts valid workspace", () => {
    const result = decodeWorkspace(validWorkspace());
    expect(result.ok).toBe(true);
  });

  it("detects missing physical layout", () => {
    const input = validWorkspace();
    input.logicalMaps[0].physicalId = "unknown";
    const result = decodeWorkspace(input);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((it) => it.code === "logical.missingPhysicalLayout")).toBe(true);
    }
  });

  it("detects missing key", () => {
    const input = validWorkspace();
    input.logicalMaps[0].bindings[0].trigger = { type: "press", keyId: "missing" };
    const result = decodeWorkspace(input);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((it) => it.code === "binding.missingKey")).toBe(true);
    }
  });

  it("detects missing target layer", () => {
    const input = validWorkspace();
    input.logicalMaps[0].bindings[1].action = { type: "layer", targetLayerId: "missing", mode: "toggle" };
    const result = decodeWorkspace(input);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((it) => it.code === "action.missingTargetLayer")).toBe(true);
    }
  });

  it("detects no base layer", () => {
    const input = validWorkspace();
    input.logicalMaps[0].layers = [{ id: "layer_nav", name: "nav", kind: "conditional", trigger: { type: "press", keyId: "key_a" } }];
    const result = decodeWorkspace(input);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((it) => it.code === "layer.invalidBaseLayerCount")).toBe(true);
    }
  });

  it("detects multiple base layers", () => {
    const input = validWorkspace();
    input.logicalMaps[0].layers = [
      { id: "base1", name: "base", kind: "base" },
      { id: "base2", name: "base2", kind: "base" }
    ];
    const result = decodeWorkspace(input);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((it) => it.code === "layer.invalidBaseLayerCount")).toBe(true);
    }
  });

  it("detects duplicate layer names", () => {
    const input = validWorkspace();
    input.logicalMaps[0].layers[1].name = "base";
    const result = decodeWorkspace(input);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((it) => it.code === "layer.duplicateLayerName")).toBe(true);
    }
  });

  it("detects unknown field", () => {
    const input = validWorkspace() as Record<string, unknown>;
    input.extra = true;
    const result = decodeWorkspace(input);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((it) => it.code === "codec.unknownField")).toBe(true);
    }
  });

  it("detects invalid combo", () => {
    const input = validWorkspace();
    input.logicalMaps[0].bindings[0].trigger = { type: "combo", keyIds: ["key_a"] };
    const result = decodeWorkspace(input);
    expect(result.ok).toBe(false);
  });
});
