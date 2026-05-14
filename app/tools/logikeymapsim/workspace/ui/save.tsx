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
    >
      Save workspace JSON
    </button>
  );
}
