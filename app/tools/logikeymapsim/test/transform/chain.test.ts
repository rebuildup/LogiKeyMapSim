import { describe, expect, it } from "vitest";
import { planChain } from "../../transform/calc/chain";
import type { LogicalMap } from "../../logical/model";
import type { TransformChain } from "../../transform/model";

function map(id: string, keyId: string): LogicalMap {
  return {
    id,
    name: id,
    physicalId: "phys_1",
    layers: [{ id: `${id}_base`, name: "base", kind: "base" }],
    bindings: [{ id: `${id}_bind`, trigger: { type: "press", keyId }, action: { type: "character", value: "A" } }]
  };
}

describe("transform chain", () => {
  it("runs two stage chain", () => {
    const chain: TransformChain = { id: "chain_1", name: "c", logicalMapIds: ["A", "B", "C"] };
    const result = planChain(chain, [map("A", "key_a"), map("B", "key_b"), map("C", "key_c")], []);
    const stages = new Set(result.operations.map((op) => op.stage.index));
    expect(stages.has(0)).toBe(true);
    expect(stages.has(1)).toBe(true);
  });

  it("keeps manual and replace across stages", () => {
    const chain: TransformChain = { id: "chain_1", name: "c", logicalMapIds: ["A", "B", "C"] };

    const mapA: LogicalMap = {
      id: "A",
      name: "A",
      physicalId: "phys_1",
      layers: [{ id: "A_base", name: "base", kind: "base" }],
      bindings: [{ id: "A_bind", trigger: { type: "press", keyId: "key_a" }, action: { type: "shortcut", keys: ["Ctrl", "A"] } }]
    };

    const mapB = map("B", "key_b");
    const mapC = map("C", "key_c");

    const result = planChain(chain, [mapA, mapB, mapC], []);
    expect(result.operations.some((op) => op.kind === "manual")).toBe(true);
    expect(result.operations.some((op) => op.kind === "replace")).toBe(true);
  });
});
