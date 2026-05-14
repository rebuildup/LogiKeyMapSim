import { issue, type Issue } from "../../base/issue";
import type { PhysicalLayout } from "../model";

function isOverlapped(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function findOverlaps(layout: PhysicalLayout): Issue[] {
  const issues: Issue[] = [];
  for (let i = 0; i < layout.keys.length; i += 1) {
    for (let j = i + 1; j < layout.keys.length; j += 1) {
      const a = layout.keys[i];
      const b = layout.keys[j];
      if (isOverlapped(a, b)) {
        issues.push(issue("warning", "physical.overlap", `Physical keys overlap: ${a.id} and ${b.id}`, [a.id, b.id]));
      }
    }
  }
  return issues;
}
