import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "../..");

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(full));
    } else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
      out.push(full);
    }
  }
  return out;
}

function readImports(file: string): string[] {
  const text = fs.readFileSync(file, "utf8");
  const matches = [...text.matchAll(/from\s+["']([^"']+)["']/g)];
  return matches.map((m) => m[1]);
}

function moduleOf(file: string): string {
  const rel = path.relative(root, file).replace(/\\/g, "/");
  return rel.split("/")[0] ?? "";
}

function normalizeTarget(file: string, importPath: string): string {
  if (!importPath.startsWith(".")) return "external";
  const abs = path.resolve(path.dirname(file), importPath);
  const rel = path.relative(root, abs).replace(/\\/g, "/");
  return rel.split("/")[0] ?? "";
}

describe("architecture import boundaries", () => {
  it("detects forbidden imports", () => {
    const files = walk(root).filter((f) => !f.includes("/test/"));
    const violations: string[] = [];

    for (const file of files) {
      const from = moduleOf(file);
      const imports = readImports(file);
      for (const imp of imports) {
        const to = normalizeTarget(file, imp);
        if (to === "external") continue;

        if (from === "physical" && ["logical", "transform", "emit"].includes(to)) violations.push(`${from}->${to}:${file}`);
        if (from === "logical" && ["transform", "emit"].includes(to)) violations.push(`${from}->${to}:${file}`);
        if (from === "transform" && ["emit", "file"].includes(to)) violations.push(`${from}->${to}:${file}`);
        if (from === "emit" && ["workspace", "file"].includes(to)) violations.push(`${from}->${to}:${file}`);
        if (from === "file" && ["workspace", "physical", "logical", "transform", "emit"].includes(to)) violations.push(`${from}->${to}:${file}`);
        if (from === "base" && ["workspace", "physical", "logical", "transform", "emit", "file", "preset"].includes(to)) violations.push(`${from}->${to}:${file}`);
      }
    }

    expect(violations).toEqual([]);
  });

  it("detects forbidden top-level directories and helper sink files", () => {
    const forbiddenDirs = ["ui", "domain", "calc"];
    for (const name of forbiddenDirs) {
      expect(fs.existsSync(path.join(root, name))).toBe(false);
    }

    const files = walk(root);
    const helperFiles = files.filter((file) => {
      const base = path.basename(file);
      return base === "utils.ts" || base === "types.ts" || base === "helpers.ts";
    });

    expect(helperFiles).toEqual([]);
  });
});
