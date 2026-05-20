# LogiKeyMapSim Implementation Gaps Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fill in the missing implementation pieces identified by comparing the architecture document with the current codebase.

**Architecture:** Follow the feature-ownership module structure from the architecture doc. Each gap is in a specific module.

**Tech Stack:** TypeScript, React 18, useReducer, Tailwind CSS v4, vitest

---

## Task 1: Implement physical/seed.ts

**Files:**
- Modify: `app/tools/logikeymapsim/physical/seed.ts`

**Step 1: Write the failing test**

```typescript
// app/tools/logikeymapsim/test/physical/seed.test.ts
import { describe, expect, it } from "vitest";
import { createGrid } from "../../physical/seed";

describe("physical seed", () => {
  it("creates a grid of keys", () => {
    const keys = createGrid({ cols: 3, rows: 2, keyW: 1, keyH: 1, gap: 0 });
    expect(keys).toHaveLength(6);
    expect(keys[0]).toMatchObject({ x: 0, y: 0, w: 1, h: 1 });
    expect(keys[1]).toMatchObject({ x: 1, y: 0, w: 1, h: 1 });
    expect(keys[2]).toMatchObject({ x: 2, y: 0, w: 1, h: 1 });
    expect(keys[3]).toMatchObject({ x: 0, y: 1, w: 1, h: 1 });
  });

  it("applies gap between keys", () => {
    const keys = createGrid({ cols: 2, rows: 1, keyW: 1, keyH: 1, gap: 0.25 });
    expect(keys[0].x).toBe(0);
    expect(keys[1].x).toBe(1.25);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run test/physical/seed.test.ts
```
Expected: FAIL - "Cannot find module"

**Step 3: Write implementation**

```typescript
// app/tools/logikeymapsim/physical/seed.ts
import { createId } from "../base/id";
import type { PhysicalKey } from "./model";

type GridOptions = {
  cols: number;
  rows: number;
  keyW: number;
  keyH: number;
  gap: number;
};

export function createGrid(options: GridOptions): PhysicalKey[] {
  const { cols, rows, keyW, keyH, gap } = options;
  const keys: PhysicalKey[] = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      keys.push({
        id: createId("key"),
        x: col * (keyW + gap),
        y: row * (keyH + gap),
        w: keyW,
        h: keyH
      });
    }
  }

  return keys;
}
```

**Step 4: Run test to verify it passes**

```bash
npx vitest run test/physical/seed.test.ts
```
Expected: PASS

**Step 5: Commit**

```bash
git add app/tools/logikeymapsim/physical/seed.ts app/tools/logikeymapsim/test/physical/seed.test.ts
git commit -m "feat: implement physical/seed grid generation"
```

---

## Task 2: Add preset physical keyboard data

**Files:**
- Modify: `app/tools/logikeymapsim/preset/physical.ts`

**Step 1: Write the failing test**

```typescript
// app/tools/logikeymapsim/test/preset/physical.test.ts
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
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run test/preset/physical.test.ts
```
Expected: FAIL - "presets is not defined"

**Step 3: Write implementation**

```typescript
// app/tools/logikeymapsim/preset/physical.ts
import type { PhysicalLayout } from "../physical/model";

export const presets: PhysicalLayout[] = [
  {
    id: "preset_phys_60",
    name: "60% Keyboard",
    keys: [
      // Row 0
      { id: "preset_key_esc", x: 0, y: 0, w: 1, h: 1, note: "ESC" },
      { id: "preset_key_1", x: 1, y: 0, w: 1, h: 1, note: "1" },
      { id: "preset_key_2", x: 2, y: 0, w: 1, h: 1, note: "2" },
      { id: "preset_key_3", x: 3, y: 0, w: 1, h: 1, note: "3" },
      { id: "preset_key_4", x: 4, y: 0, w: 1, h: 1, note: "4" },
      { id: "preset_key_5", x: 5, y: 0, w: 1, h: 1, note: "5" },
      { id: "preset_key_6", x: 6, y: 0, w: 1, h: 1, note: "6" },
      { id: "preset_key_7", x: 7, y: 0, w: 1, h: 1, note: "7" },
      { id: "preset_key_8", x: 8, y: 0, w: 1, h: 1, note: "8" },
      { id: "preset_key_9", x: 9, y: 0, w: 1, h: 1, note: "9" },
      { id: "preset_key_0", x: 10, y: 0, w: 1, h: 1, note: "0" },
      { id: "preset_key_minus", x: 11, y: 0, w: 1, h: 1, note: "-" },
      { id: "preset_key_plus", x: 12, y: 0, w: 1, h: 1, note: "=" },
      { id: "preset_key_backspace", x: 13, y: 0, w: 2, h: 1, note: "Back" },
      // Row 1
      { id: "preset_key_tab", x: 0, y: 1, w: 1.5, h: 1, note: "Tab" },
      { id: "preset_key_q", x: 1.5, y: 1, w: 1, h: 1, note: "Q" },
      { id: "preset_key_w", x: 2.5, y: 1, w: 1, h: 1, note: "W" },
      { id: "preset_key_e", x: 3.5, y: 1, w: 1, h: 1, note: "E" },
      { id: "preset_key_r", x: 4.5, y: 1, w: 1, h: 1, note: "R" },
      { id: "preset_key_t", x: 5.5, y: 1, w: 1, h: 1, note: "T" },
      { id: "preset_key_y", x: 6.5, y: 1, w: 1, h: 1, note: "Y" },
      { id: "preset_key_u", x: 7.5, y: 1, w: 1, h: 1, note: "U" },
      { id: "preset_key_i", x: 8.5, y: 1, w: 1, h: 1, note: "I" },
      { id: "preset_key_o", x: 9.5, y: 1, w: 1, h: 1, note: "O" },
      { id: "preset_key_p", x: 10.5, y: 1, w: 1, h: 1, note: "P" },
      { id: "preset_key_lbracket", x: 11.5, y: 1, w: 1, h: 1, note: "[" },
      { id: "preset_key_rbracket", x: 12.5, y: 1, w: 1, h: 1, note: "]" },
      { id: "preset_key_backslash", x: 13.5, y: 1, w: 1.5, h: 1, note: "\\" },
      // Row 2
      { id: "preset_key_caps", x: 0, y: 2, w: 1.75, h: 1, note: "Caps" },
      { id: "preset_key_a", x: 1.75, y: 2, w: 1, h: 1, note: "A" },
      { id: "preset_key_s", x: 2.75, y: 2, w: 1, h: 1, note: "S" },
      { id: "preset_key_d", x: 3.75, y: 2, w: 1, h: 1, note: "D" },
      { id: "preset_key_f", x: 4.75, y: 2, w: 1, h: 1, note: "F" },
      { id: "preset_key_g", x: 5.75, y: 2, w: 1, h: 1, note: "G" },
      { id: "preset_key_h", x: 6.75, y: 2, w: 1, h: 1, note: "H" },
      { id: "preset_key_j", x: 7.75, y: 2, w: 1, h: 1, note: "J" },
      { id: "preset_key_k", x: 8.75, y: 2, w: 1, h: 1, note: "K" },
      { id: "preset_key_l", x: 9.75, y: 2, w: 1, h: 1, note: "L" },
      { id: "preset_key_semi", x: 10.75, y: 2, w: 1, h: 1, note: ";" },
      { id: "preset_key_quote", x: 11.75, y: 2, w: 1, h: 1, note: "'" },
      { id: "preset_key_enter", x: 12.75, y: 2, w: 2.25, h: 1, note: "Enter" },
      // Row 3
      { id: "preset_key_lshift", x: 0, y: 3, w: 2.25, h: 1, note: "Shift" },
      { id: "preset_key_z", x: 2.25, y: 3, w: 1, h: 1, note: "Z" },
      { id: "preset_key_x", x: 3.25, y: 3, w: 1, h: 1, note: "X" },
      { id: "preset_key_c", x: 4.25, y: 3, w: 1, h: 1, note: "C" },
      { id: "preset_key_v", x: 5.25, y: 3, w: 1, h: 1, note: "V" },
      { id: "preset_key_b", x: 6.25, y: 3, w: 1, h: 1, note: "B" },
      { id: "preset_key_n", x: 7.25, y: 3, w: 1, h: 1, note: "N" },
      { id: "preset_key_m", x: 8.25, y: 3, w: 1, h: 1, note: "M" },
      { id: "preset_key_comma", x: 9.25, y: 3, w: 1, h: 1, note: "," },
      { id: "preset_key_dot", x: 10.25, y: 3, w: 1, h: 1, note: "." },
      { id: "preset_key_slash", x: 11.25, y: 3, w: 1, h: 1, note: "/" },
      { id: "preset_key_rshift", x: 12.25, y: 3, w: 2.75, h: 1, note: "Shift" },
      // Row 4
      { id: "preset_key_lctrl", x: 0, y: 4, w: 1.25, h: 1, note: "Ctrl" },
      { id: "preset_key_lwin", x: 1.25, y: 4, w: 1.25, h: 1, note: "Win" },
      { id: "preset_key_lalt", x: 2.5, y: 4, w: 1.25, h: 1, note: "Alt" },
      { id: "preset_key_space", x: 3.75, y: 4, w: 6.25, h: 1, note: "Space" },
      { id: "preset_key_ralt", x: 10, y: 4, w: 1.25, h: 1, note: "Alt" },
      { id: "preset_key_rwin", x: 11.25, y: 4, w: 1.25, h: 1, note: "Win" },
      { id: "preset_key_menu", x: 12.5, y: 4, w: 1.25, h: 1, note: "Menu" },
      { id: "preset_key_rctrl", x: 13.75, y: 4, w: 1.25, h: 1, note: "Ctrl" }
    ]
  }
];
```

**Step 4: Run test to verify it passes**

```bash
npx vitest run test/preset/physical.test.ts
```
Expected: PASS

**Step 5: Commit**

```bash
git add app/tools/logikeymapsim/preset/physical.ts app/tools/logikeymapsim/test/preset/physical.test.ts
git commit -m "feat: add preset physical keyboard data"
```

---

## Task 3: Add preset logical keyboard data

**Files:**
- Modify: `app/tools/logikeymapsim/preset/logical.ts`

**Step 1: Write the failing test**

```typescript
// app/tools/logikeymapsim/test/preset/logical.test.ts
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
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run test/preset/logical.test.ts
```
Expected: FAIL - "presets is not defined"

**Step 3: Write implementation**

```typescript
// app/tools/logikeymapsim/preset/logical.ts
import type { LogicalMap } from "../logical/model";

export const presets: LogicalMap[] = [
  {
    id: "preset_logical_qwerty",
    name: "QWERTY",
    physicalId: "preset_phys_60",
    layers: [{ id: "preset_layer_base", name: "base", kind: "base" }],
    bindings: [
      {
        id: "preset_bind_esc",
        trigger: { type: "press", keyId: "preset_key_esc" },
        action: { type: "character", value: "ESC" }
      },
      {
        id: "preset_bind_1",
        trigger: { type: "press", keyId: "preset_key_1" },
        action: { type: "character", value: "1" }
      },
      {
        id: "preset_bind_2",
        trigger: { type: "press", keyId: "preset_key_2" },
        action: { type: "character", value: "2" }
      },
      {
        id: "preset_bind_q",
        trigger: { type: "press", keyId: "preset_key_q" },
        action: { type: "character", value: "q" }
      },
      {
        id: "preset_bind_w",
        trigger: { type: "press", keyId: "preset_key_w" },
        action: { type: "character", value: "w" }
      },
      {
        id: "preset_bind_e",
        trigger: { type: "press", keyId: "preset_key_e" },
        action: { type: "character", value: "e" }
      }
    ]
  }
];
```

**Step 4: Run test to verify it passes**

```bash
npx vitest run test/preset/logical.test.ts
```
Expected: PASS

**Step 5: Commit**

```bash
git add app/tools/logikeymapsim/preset/logical.ts app/tools/logikeymapsim/test/preset/logical.test.ts
git commit -m "feat: add preset logical keyboard data"
```

---

## Task 4: Fix emit/json.ts to resolve keyNames from PhysicalLayout

**Files:**
- Modify: `app/tools/logikeymapsim/emit/json.ts`

**Step 1: Write the failing test**

```typescript
// app/tools/logikeymapsim/test/emit/json.test.ts
import { describe, expect, it } from "vitest";
import { emitJson } from "../../emit/json";
import { createId } from "../../base/id";

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
  it("resolves keyNames from physical layout", () => {
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
    expect(parsed.operations[0].from?.keyNames).toContain("key_a");
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run test/emit/json.test.ts
```
Expected: FAIL - "keyNames is empty array"

**Step 3: Write implementation**

Update `emit/json.ts` to resolve key names from the physical layout:

```typescript
import type { Binding, Layer, LogicalMap } from "../logical/model";
import type { EmitContext, ResolvedBinding, ResolvedTransformResultJson } from "./model";
import type { PhysicalLayout } from "../physical/model";

function getLayerName(layer: Layer | undefined): string {
  if (!layer) return "base";
  return layer.name;
}

function resolveBinding(
  logicalMap: LogicalMap | undefined,
  bindingId: string,
  layouts: PhysicalLayout[]
): ResolvedBinding | null {
  if (!logicalMap) return null;
  const binding: Binding | undefined = logicalMap.bindings.find((it) => it.id === bindingId);
  if (!binding) return null;

  const layerId = binding.trigger.layerId;
  const layer = layerId
    ? logicalMap.layers.find((it) => it.id === layerId)
    : logicalMap.layers.find((it) => it.kind === "base");

  const layout = layouts.find((l) => l.id === logicalMap.physicalId);

  let keyNames: string[] = [];
  if (binding.trigger.type === "combo") {
    keyNames = binding.trigger.keyIds;
  } else if (binding.trigger.type === "press" || binding.trigger.type === "hold") {
    keyNames = [binding.trigger.keyId];
  }

  // resolve key names from physical layout notes
  const resolvedNames = keyNames.map((keyId) => {
    const key = layout?.keys.find((k) => k.id === keyId);
    return key?.note ?? keyId;
  });

  return {
    logicalMapId: logicalMap.id,
    bindingId: binding.id,
    trigger: binding.trigger,
    action: binding.action,
    keyNames: resolvedNames,
    layerName: getLayerName(layer)
  };
}

export function emitJson(context: EmitContext): string {
  const resolved: ResolvedTransformResultJson = {
    kind: "resolved-transform-result",
    chainId: context.result.chainId,
    operations: context.result.operations.map((op) => {
      const fromMap = context.logicalMaps.find((it) => it.id === op.from?.logicalMapId);
      const toMap = context.logicalMaps.find((it) => it.id === op.to?.logicalMapId);
      const from = op.from ? resolveBinding(fromMap, op.from.bindingId, context.physicalLayouts) : undefined;
      const to = op.to ? resolveBinding(toMap, op.to.bindingId, context.physicalLayouts) : undefined;

      if ((op.from && !from) || (op.to && !to)) {
        return {
          id: op.id,
          kind: "manual" as const,
          stage: op.stage,
          from: from ?? undefined,
          to: to ?? undefined,
          reason: "invalidReference" as const,
          note: op.note
        };
      }

      return {
        id: op.id,
        kind: op.kind,
        stage: op.stage,
        from: from ?? undefined,
        to: to ?? undefined,
        reason: op.reason,
        note: op.note
      };
    }),
    warnings: context.result.warnings,
    guides: context.result.guides
  };

  return JSON.stringify(resolved, null, 2);
}
```

**Step 4: Run test to verify it passes**

```bash
npx vitest run test/emit/json.test.ts
```
Expected: PASS

**Step 5: Commit**

```bash
git add app/tools/logikeymapsim/emit/json.ts app/tools/logikeymapsim/test/emit/json.test.ts
git commit -m "fix: emit/json resolves keyNames from physical layout"
```

---

## Task 5: Implement logical/calc/unassigned.ts findUnassignedBaseKeys

**Files:**
- Modify: `app/tools/logikeymapsim/logical/calc/unassigned.ts`

**Step 1: Write the failing test**

```typescript
// app/tools/logikeymapsim/test/logical/unassigned.test.ts (add tests)
import { describe, expect, it } from "vitest";
import { findUnassignedBaseKeys } from "../../logical/calc/unassigned";
import type { LogicalMap } from "../../logical/model";
import type { PhysicalLayout } from "../../physical/model";

describe("logical unassigned", () => {
  // ... existing tests remain ...

  it("returns guide for key without base layer binding", () => {
    const layout: PhysicalLayout = {
      id: "phys_1",
      name: "layout",
      keys: [{ id: "key_a", x: 0, y: 0, w: 1, h: 1 }]
    };
    const map: LogicalMap = {
      id: "map_1",
      name: "map",
      physicalId: "phys_1",
      layers: [{ id: "layer_base", name: "base", kind: "base" }],
      bindings: []
    };
    const guides = findUnassignedBaseKeys(map, layout);
    expect(guides.length).toBe(1);
    expect(guides[0].code).toBe("logical.unassignedKey");
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run test/logical/unassigned.test.ts
```
Expected: FAIL - "findUnassignedBaseKeys is not a function"

**Step 3: Write implementation**

```typescript
// app/tools/logikeymapsim/logical/calc/unassigned.ts
import { issue, type Issue } from "../../base/issue";
import type { LogicalMap } from "../model";
import type { PhysicalLayout } from "../../physical/model";

export function findUnassignedBaseKeys(map: LogicalMap, layout: PhysicalLayout): Issue[] {
  const baseLayer = map.layers.find((l) => l.kind === "base");
  if (!baseLayer) return [];

  const assignedKeyIds = new Set(
    map.bindings
      .filter((b) => b.trigger.layerId === undefined || b.trigger.layerId === baseLayer.id)
      .map((b) => {
        if (b.trigger.type === "combo") return b.trigger.keyIds;
        return [b.trigger.keyId];
      })
      .flat()
  );

  const guides: Issue[] = [];
  for (const key of layout.keys) {
    if (!assignedKeyIds.has(key.id)) {
      guides.push(
        issue("guide", "logical.unassignedKey", `Key ${key.note ?? key.id} has no base layer binding`, [key.id])
      );
    }
  }

  return guides;
}
```

**Step 4: Run test to verify it passes**

```bash
npx vitest run test/logical/unassigned.test.ts
```
Expected: PASS

**Step 5: Commit**

```bash
git add app/tools/logikeymapsim/logical/calc/unassigned.ts
git commit -m "feat: implement findUnassignedBaseKeys"
```

---

## Task 6: Verify all tests pass and run import boundaries

**Step 1: Run all tests**

```bash
npx vitest run --reporter=verbose
```
Expected: All tests pass

**Step 2: Run architecture tests**

```bash
npx vitest run test/architecture/import-boundaries.test.ts
```
Expected: PASS - no forbidden imports detected

**Step 3: Commit remaining changes and verify Definition of Done**

Check Definition of Done items from Section 14.8:
- All suggested file structure files exist
- No forbidden import violations
- `test/architecture/import-boundaries.test.ts` detects forbidden imports and files
- `workspace/codec.test.ts` validates validation rules
- `transform/diff.test.ts` validates action key / trigger key cases
- `workspace/state.test.ts` validates reference integrity and activeResult clearing
- Workspace JSON import failure preserves existing state
- Workspace edit always clears activeResult
- Rejected delete actions preserve both workspace and activeResult
- TransformResult JSON and Workspace JSON output responsibilities are separate
- No empty tests or snapshot-only tests
- UI implementation stays within CSS allowlist