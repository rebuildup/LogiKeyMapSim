"use client";

import { downloadTextFile } from "../../file/browser";
import { stringifyJson } from "../../file/json";
import { encodeWorkspace } from "../codec";
import type { RuntimeState } from "../model";

export function WorkspaceSave({ state }: { state: RuntimeState }) {
  return (
    <button
      type="button"
      onClick={() => {
        const value = encodeWorkspace(state.workspace);
        downloadTextFile("logikeymapsim-workspace.json", stringifyJson(value));
      }}
      className="text-sm px-3 py-1 border border-gray-400"
    >
      Save JSON
    </button>
  );
}
