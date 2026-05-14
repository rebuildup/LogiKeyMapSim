"use client";

import type { RuntimeState } from "../../workspace/model";
import { findDuplicates } from "../calc/duplicate";
import { findUnassignedBaseKeys } from "../calc/unassigned";
import { BindingList } from "./binding";
import { LayerList } from "./layer";

export function LogicalEditor({ state }: { state: RuntimeState }) {
  const map = state.workspace.logicalMaps[0];
  if (!map) return <section><h2>Logical</h2><p>No map</p></section>;

  const layout = state.workspace.physicalLayouts.find((it) => it.id === map.physicalId);
  const duplicates = findDuplicates(map);
  const guides = layout ? findUnassignedBaseKeys(map, layout) : [];

  return (
    <section className="grid gap-3">
      <h2>Logical: {map.name}</h2>
      <LayerList layers={map.layers} />
      <BindingList bindings={map.bindings} />
      <section>
        <h3>Warnings</h3>
        <ul>{duplicates.map((d) => <li key={`${d.code}-${d.message}`}>{d.message}</li>)}</ul>
      </section>
      <section>
        <h3>Guides</h3>
        <ul>{guides.map((g) => <li key={`${g.code}-${g.relatedIds.join("-")}`}>{g.message}</li>)}</ul>
      </section>
    </section>
  );
}
