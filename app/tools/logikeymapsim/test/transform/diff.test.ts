import { describe, expect, it } from "vitest";
import { diff } from "../../transform/calc/diff";
import type { LogicalMap } from "../../logical/model";
import type { TransformStage } from "../../transform/model";

const stage: TransformStage = { index: 0, fromLogicalMapId: "src", toLogicalMapId: "tgt" };

function baseMap(id: string): LogicalMap {
  return {
    id,
    name: id,
    physicalId: "phys_1",
    layers: [
      { id: `${id}_base`, name: "base", kind: "base" },
      { id: `${id}_nav`, name: "nav", kind: "conditional", trigger: { type: "press", keyId: "key_a" } }
    ],
    bindings: []
  };
}

describe("transform diff", () => {
  it("character replace", () => {
    const source = baseMap("src");
    source.bindings = [{ id: "s1", trigger: { type: "press", keyId: "key_a" }, action: { type: "character", value: "A" } }];
    const target = baseMap("tgt");
    target.bindings = [{ id: "t1", trigger: { type: "press", keyId: "key_b" }, action: { type: "character", value: "A" } }];

    const result = diff(source, target, { chainId: "chain_test", physicalLayouts: [], stage });
    expect(result.operations).toHaveLength(1);
    expect(result.operations[0].kind).toBe("replace");
  });

  it("same trigger and action no operation", () => {
    const source = baseMap("src");
    source.bindings = [{ id: "s1", trigger: { type: "press", keyId: "key_a" }, action: { type: "character", value: "A" } }];
    const target = baseMap("tgt");
    target.bindings = [{ id: "t1", trigger: { type: "press", keyId: "key_a" }, action: { type: "character", value: "A" } }];

    const result = diff(source, target, { chainId: "chain_test", physicalLayouts: [], stage });
    expect(result.operations).toHaveLength(0);
  });

  it("missing source action", () => {
    const source = baseMap("src");
    const target = baseMap("tgt");
    target.bindings = [{ id: "t1", trigger: { type: "press", keyId: "key_b" }, action: { type: "character", value: "A" } }];

    const result = diff(source, target, { chainId: "chain_test", physicalLayouts: [], stage });
    expect(result.operations[0].reason).toBe("missingSourceAction");
  });

  it("missing target action", () => {
    const source = baseMap("src");
    source.bindings = [{ id: "s1", trigger: { type: "press", keyId: "key_a" }, action: { type: "character", value: "A" } }];
    const target = baseMap("tgt");

    const result = diff(source, target, { chainId: "chain_test", physicalLayouts: [], stage });
    expect(result.operations[0].reason).toBe("missingTargetAction");
  });

  it("ambiguous source", () => {
    const source = baseMap("src");
    source.bindings = [
      { id: "s1", trigger: { type: "press", keyId: "key_a" }, action: { type: "character", value: "A" } },
      { id: "s2", trigger: { type: "press", keyId: "key_b" }, action: { type: "character", value: "A" } }
    ];
    const target = baseMap("tgt");
    target.bindings = [{ id: "t1", trigger: { type: "press", keyId: "key_c" }, action: { type: "character", value: "A" } }];

    const result = diff(source, target, { chainId: "chain_test", physicalLayouts: [], stage });
    expect(result.operations[0].reason).toBe("ambiguousSourceAction");
  });

  it("combo order treated same", () => {
    const source = baseMap("src");
    source.bindings = [{ id: "s1", trigger: { type: "combo", keyIds: ["key_a", "key_b"] }, action: { type: "character", value: "X" } }];
    const target = baseMap("tgt");
    target.bindings = [{ id: "t1", trigger: { type: "combo", keyIds: ["key_b", "key_a"] }, action: { type: "character", value: "X" } }];

    const result = diff(source, target, { chainId: "chain_test", physicalLayouts: [], stage });
    expect(result.operations).toHaveLength(0);
  });

  it("combo difference becomes replace", () => {
    const source = baseMap("src");
    source.bindings = [{ id: "s1", trigger: { type: "combo", keyIds: ["key_a", "key_b"] }, action: { type: "character", value: "X" } }];
    const target = baseMap("tgt");
    target.bindings = [{ id: "t1", trigger: { type: "combo", keyIds: ["key_a", "key_c"] }, action: { type: "character", value: "X" } }];

    const result = diff(source, target, { chainId: "chain_test", physicalLayouts: [], stage });
    expect(result.operations[0].kind).toBe("replace");
  });

  it("hold same default no operation", () => {
    const source = baseMap("src");
    source.bindings = [{ id: "s1", trigger: { type: "hold", keyId: "key_a" }, action: { type: "character", value: "X" } }];
    const target = baseMap("tgt");
    target.bindings = [{ id: "t1", trigger: { type: "hold", keyId: "key_a" }, action: { type: "character", value: "X" } }];

    const result = diff(source, target, { chainId: "chain_test", physicalLayouts: [], stage });
    expect(result.operations).toHaveLength(0);
  });

  it("hold duration difference becomes replace", () => {
    const source = baseMap("src");
    source.bindings = [{ id: "s1", trigger: { type: "hold", keyId: "key_a" }, action: { type: "character", value: "X" } }];
    const target = baseMap("tgt");
    target.bindings = [{ id: "t1", trigger: { type: "hold", keyId: "key_a", durationMs: 300 }, action: { type: "character", value: "X" } }];

    const result = diff(source, target, { chainId: "chain_test", physicalLayouts: [], stage });
    expect(result.operations[0].kind).toBe("replace");
  });

  it("base layer undefined and explicit id are same", () => {
    const source = baseMap("src");
    source.bindings = [{ id: "s1", trigger: { type: "press", keyId: "key_a" }, action: { type: "character", value: "X" } }];
    const target = baseMap("tgt");
    target.bindings = [{ id: "t1", trigger: { type: "press", keyId: "key_a", layerId: "tgt_base" }, action: { type: "character", value: "X" } }];

    const result = diff(source, target, { chainId: "chain_test", physicalLayouts: [], stage });
    expect(result.operations).toHaveLength(0);
  });

  it("layer action compared by layer name", () => {
    const source = baseMap("src");
    source.bindings = [{ id: "s1", trigger: { type: "press", keyId: "key_a" }, action: { type: "layer", mode: "toggle", targetLayerId: "src_nav" } }];
    const target = baseMap("tgt");
    target.bindings = [{ id: "t1", trigger: { type: "press", keyId: "key_a" }, action: { type: "layer", mode: "toggle", targetLayerId: "tgt_nav" } }];

    const result = diff(source, target, { chainId: "chain_test", physicalLayouts: [], stage });
    expect(result.operations).toHaveLength(0);
  });

  it("unsupported action becomes manual", () => {
    const source = baseMap("src");
    source.bindings = [{ id: "s1", trigger: { type: "press", keyId: "key_a" }, action: { type: "shortcut", keys: ["Ctrl", "A"] } }];
    const target = baseMap("tgt");

    const result = diff(source, target, { chainId: "chain_test", physicalLayouts: [], stage });
    expect(result.operations[0].reason).toBe("unsupportedAction");
  });
});
