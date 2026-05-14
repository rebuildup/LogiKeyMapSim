import type { Id } from "../base/id";
import type { Unit } from "../base/unit";

export type PhysicalKey = {
  id: Id;
  x: Unit;
  y: Unit;
  w: Unit;
  h: Unit;
  finger?: string;
  groups?: string[];
  note?: string;
};

export type PhysicalLayout = {
  id: Id;
  name: string;
  keys: PhysicalKey[];
};

export type PhysicalKeyPatch = Partial<Pick<PhysicalKey, "x" | "y" | "w" | "h" | "finger" | "groups" | "note">>;
export type PhysicalLayoutPatch = Partial<Pick<PhysicalLayout, "name">>;
