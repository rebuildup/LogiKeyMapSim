"use client";

import { readTextFile } from "../../file/browser";
import { parseJson } from "../../file/json";
import { decodeWorkspace } from "../codec";
import type { WorkspaceAction } from "../model";

export function WorkspaceLoad({ dispatch }: { dispatch: (action: WorkspaceAction) => void }) {
  return (
    <label>
      Load workspace JSON
      <input
        type="file"
        accept="application/json"
        onChange={async (event) => {
          const input = event.currentTarget;
          try {
            const file = input.files?.[0];
            if (!file) return;
            const text = await readTextFile(file);
            const parsed = parseJson(text);
            if (!parsed.ok) return;
            const decoded = decodeWorkspace(parsed.value);
            if (!decoded.ok) return;
            dispatch({ type: "workspace/load", payload: { workspace: decoded.workspace } });
          } finally {
            input.value = "";
          }
        }}
      />
    </label>
  );
}
