"use client";

import type { Layer } from "../model";

export function LayerList({ layers }: { layers: Layer[] }) {
  return (
    <section>
      <h3>Layers</h3>
      <ul>
        {layers.map((layer) => (
          <li key={layer.id}>{layer.name} ({layer.kind})</li>
        ))}
      </ul>
    </section>
  );
}
