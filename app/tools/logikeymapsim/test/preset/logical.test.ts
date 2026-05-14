import { describe, expect, it } from "vitest";
import { presets } from "../../preset/logical";

describe("preset/logical", () => {
  it("has at least one preset", () => {
    expect(presets.length).toBeGreaterThan(0);
  });

  it("preset has required fields", () => {
    const p = presets[0];
    expect(p.id).toBeTruthy();
    expect(p.name).toBeTruthy();
    expect(p.physicalId).toBeTruthy();
    expect(p.layers.length).toBeGreaterThan(0);
    expect(p.bindings.length).toBeGreaterThan(0);
  });

  it("has exactly one base layer", () => {
    const p = presets[0];
    const baseCount = p.layers.filter((l) => l.kind === "base").length;
    expect(baseCount).toBe(1);
  });
});