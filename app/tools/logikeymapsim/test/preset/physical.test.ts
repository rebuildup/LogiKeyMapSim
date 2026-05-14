import { describe, expect, it } from "vitest";
import { presets } from "../../preset/physical";

describe("preset/physical", () => {
  it("has at least one preset", () => {
    expect(presets.length).toBeGreaterThan(0);
  });

  it("preset has required fields", () => {
    const p = presets[0];
    expect(p.id).toBeTruthy();
    expect(p.name).toBeTruthy();
    expect(p.keys.length).toBeGreaterThan(0);
  });

  it("preset keys have valid coordinates", () => {
    const p = presets[0];
    for (const key of p.keys) {
      expect(key.x).toBeGreaterThanOrEqual(0);
      expect(key.y).toBeGreaterThanOrEqual(0);
      expect(key.w).toBeGreaterThan(0);
      expect(key.h).toBeGreaterThan(0);
    }
  });
});