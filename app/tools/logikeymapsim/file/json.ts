import { issue, type Issue } from "../base/issue";

export type JsonParseResult =
  | { ok: true; value: unknown }
  | { ok: false; issues: Issue[] };

export function parseJson(text: string): JsonParseResult {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false, issues: [issue("error", "json.syntax", "Invalid JSON syntax")] };
  }
}

export function stringifyJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}
