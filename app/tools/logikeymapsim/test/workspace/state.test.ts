import { describe, expect, it } from "vitest";
import { reduceWorkspace } from "../../workspace/state";
import type { RuntimeState } from "../../workspace/model";

function initialState(): RuntimeState {
  return {
    workspace: {
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
            { id: "bind_2", trigger: { type: "press", keyId: "key_b", layerId: "layer_nav" }, action: { type: "layer", targetLayerId: "layer_nav", mode: "toggle" } }
          ]
        }
      ],
      transformChains: [{ id: "chain_1", name: "chain", logicalMapIds: ["map_1", "map_1"] }]
    },
    activeResult: undefined
  };
}

describe("workspace state", () => {
  it("run transform sets activeResult", () => {
    const state = reduceWorkspace(initialState(), {
      type: "transform/run",
      payload: { result: { chainId: "chain_1", operations: [], warnings: [], guides: [] } }
    });
    expect(state.activeResult).toBeDefined();
  });

  it("update physical key clears activeResult", () => {
    const withResult = reduceWorkspace(initialState(), {
      type: "transform/run",
      payload: { result: { chainId: "chain_1", operations: [], warnings: [], guides: [] } }
    });
    const next = reduceWorkspace(withResult, {
      type: "physical/patchKey",
      payload: { layoutId: "phys_1", keyId: "key_a", patch: { x: 1 } }
    });
    expect(next.activeResult).toBeUndefined();
  });

  it("update binding clears activeResult", () => {
    const withResult = reduceWorkspace(initialState(), {
      type: "transform/run",
      payload: { result: { chainId: "chain_1", operations: [], warnings: [], guides: [] } }
    });
    const next = reduceWorkspace(withResult, {
      type: "logical/patchBindingAction",
      payload: { logicalMapId: "map_1", bindingId: "bind_1", patch: { action: { type: "character", value: "B" } } }
    });
    expect(next.activeResult).toBeUndefined();
  });

  it("patch transform chain clears activeResult", () => {
    const withResult = reduceWorkspace(initialState(), {
      type: "transform/run",
      payload: { result: { chainId: "chain_1", operations: [], warnings: [], guides: [] } }
    });
    const next = reduceWorkspace(withResult, {
      type: "transform/patchChain",
      payload: { chainId: "chain_1", patch: { name: "updated" } }
    });
    expect(next.activeResult).toBeUndefined();
  });

  it("reject referenced key delete keeps state", () => {
    const withResult = reduceWorkspace(initialState(), {
      type: "transform/run",
      payload: { result: { chainId: "chain_1", operations: [], warnings: [], guides: [] } }
    });
    const next = reduceWorkspace(withResult, {
      type: "physical/removeKey",
      payload: { layoutId: "phys_1", keyId: "key_a" }
    });
    expect(next).toBe(withResult);
  });

  it("reject referenced layer delete keeps state", () => {
    const withResult = reduceWorkspace(initialState(), {
      type: "transform/run",
      payload: { result: { chainId: "chain_1", operations: [], warnings: [], guides: [] } }
    });
    const next = reduceWorkspace(withResult, {
      type: "logical/removeLayer",
      payload: { logicalMapId: "map_1", layerId: "layer_nav" }
    });
    expect(next).toBe(withResult);
  });

  it("clear result clears activeResult", () => {
    const withResult = reduceWorkspace(initialState(), {
      type: "transform/run",
      payload: { result: { chainId: "chain_1", operations: [], warnings: [], guides: [] } }
    });
    const next = reduceWorkspace(withResult, { type: "transform/clearResult" });
    expect(next.activeResult).toBeUndefined();
  });

  it("load workspace replaces workspace and clears activeResult", () => {
    const withResult = reduceWorkspace(initialState(), {
      type: "transform/run",
      payload: { result: { chainId: "chain_1", operations: [], warnings: [], guides: [] } }
    });
    const next = reduceWorkspace(withResult, {
      type: "workspace/load",
      payload: {
        workspace: {
          physicalLayouts: [],
          logicalMaps: [],
          transformChains: []
        }
      }
    });
    expect(next.workspace.physicalLayouts).toHaveLength(0);
    expect(next.activeResult).toBeUndefined();
  });
});
