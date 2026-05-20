"use client";

import { useState } from "react";
import type { Binding, PressTrigger, CharacterAction } from "../model";
import type { PhysicalLayout } from "../../physical/model";
import { createId } from "../../base/id";

type Props = {
  bindings: Binding[];
  layout?: PhysicalLayout;
  onAddBinding?: (binding: Binding) => void;
  onRemoveBinding?: (bindingId: string) => void;
};

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

export function BindingList({ bindings, layout, onAddBinding, onRemoveBinding }: Props) {
  const [showForm, setShowForm] = useState(false);

  return (
    <section>
      <div className="flex items-center justify-between">
        <h3>Bindings ({bindings.length})</h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="text-xs px-2 py-1 border border-gray-400"
          >
            {showForm ? "Cancel" : "+ Add"}
          </button>
        </div>
      </div>

      {showForm && layout && onAddBinding && (
        <AddBindingForm
          layout={layout}
          existingKeyIds={bindings.map(b => b.trigger.type === "press" ? b.trigger.keyId : null).filter((id): id is string => id !== null)}
          onAdd={(binding) => { onAddBinding(binding); setShowForm(false); }}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="mt-2 space-y-1">
        {bindings.map((binding) => (
          <div key={binding.id} className="flex items-center justify-between text-sm py-1 border-b border-gray-100">
            <span className="font-mono">
              {layout?.keys.find(k => k.id === (binding.trigger.type === "press" ? binding.trigger.keyId : null))?.note ?? binding.trigger.type}
              {" → "}
              {actionText(binding)}
            </span>
            {onRemoveBinding && (
              <button
                type="button"
                onClick={() => onRemoveBinding(binding.id)}
                className="text-xs text-red-500 hover:text-red-700"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function AddBindingForm({
  layout,
  existingKeyIds,
  onAdd,
  onCancel
}: {
  layout: PhysicalLayout;
  existingKeyIds: string[];
  onAdd: (binding: Binding) => void;
  onCancel: () => void;
}) {
  const [selectedKeyId, setSelectedKeyId] = useState("");
  const [actionValue, setActionValue] = useState("");

  const availableKeys = layout.keys.filter(k => !existingKeyIds.includes(k.id));

  return (
    <div className="mt-3 p-3 bg-gray-50 border border-gray-200">
      <div className="flex gap-2 items-end">
        <label className="flex flex-col text-xs">
          <span className="mb-1">Key</span>
          <select
            className="border border-gray-300 px-2 py-1"
            value={selectedKeyId}
            onChange={(e) => setSelectedKeyId(e.target.value)}
          >
            <option value="">Select key...</option>
            {availableKeys.map((key) => (
              <option key={key.id} value={key.id}>
                {key.note ?? key.id}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col text-xs">
          <span className="mb-1">Action</span>
          <input
            type="text"
            placeholder="character"
            className="border border-gray-300 px-2 py-1 w-32"
            value={actionValue}
            onChange={(e) => setActionValue(e.target.value)}
          />
        </label>
        <button
          type="button"
          onClick={() => {
            if (!selectedKeyId || !actionValue) return;
            const trigger: PressTrigger = { type: "press", keyId: selectedKeyId };
            const action: CharacterAction = { type: "character", value: actionValue };
            onAdd({ id: createId("bind"), trigger, action });
            setActionValue("");
          }}
          className="text-sm px-3 py-1 bg-blue-600 text-white"
        >
          Add
        </button>
        <button type="button" onClick={onCancel} className="text-sm px-3 py-1 border border-gray-400">
          Cancel
        </button>
      </div>
      {availableKeys.length === 0 && (
        <p className="text-xs text-gray-500 mt-2">All keys are already bound.</p>
      )}
    </div>
  );
}
