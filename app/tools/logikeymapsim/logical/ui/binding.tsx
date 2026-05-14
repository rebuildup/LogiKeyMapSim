"use client";

import type { Binding } from "../model";

function triggerText(binding: Binding): string {
  if (binding.trigger.type === "press") return `press:${binding.trigger.keyId}`;
  if (binding.trigger.type === "combo") return `combo:${binding.trigger.keyIds.join("+")}`;
  return `hold:${binding.trigger.keyId}:${binding.trigger.durationMs ?? "default"}`;
}

function actionText(binding: Binding): string {
  if (binding.action.type === "character") return binding.action.value;
  if (binding.action.type === "layer") return `${binding.action.mode}:${binding.action.targetLayerId}`;
  return binding.action.type;
}

export function BindingList({ bindings }: { bindings: Binding[] }) {
  return (
    <section>
      <h3>Bindings</h3>
      <ul>
        {bindings.map((binding) => (
          <li key={binding.id}>{triggerText(binding)} =&gt; {actionText(binding)}</li>
        ))}
      </ul>
    </section>
  );
}
