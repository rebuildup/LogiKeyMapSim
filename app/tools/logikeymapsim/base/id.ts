export type Id = string;
export type IdPrefix = "phys" | "key" | "map" | "layer" | "bind" | "chain" | "op";

export function createId(prefix: IdPrefix): Id {
  return `${prefix}_${crypto.randomUUID()}`;
}
