import type { Id } from "../base/id";

export type PressTrigger = {
  type: "press";
  keyId: Id;
  layerId?: Id;
};

export type ComboTrigger = {
  type: "combo";
  keyIds: Id[];
  layerId?: Id;
};

export type HoldTrigger = {
  type: "hold";
  keyId: Id;
  layerId?: Id;
  durationMs?: number;
};

export type InputTrigger = PressTrigger | ComboTrigger | HoldTrigger;

export type CharacterAction = {
  type: "character";
  value: string;
};

export type LayerAction = {
  type: "layer";
  targetLayerId: Id;
  mode: "whileHeld" | "toggle";
};

export type ShortcutAction = {
  type: "shortcut";
  keys: string[];
};

export type MacroStep = {
  action: Action;
  delayMs?: number;
  note?: string;
};

export type MacroAction = {
  type: "macro";
  steps: MacroStep[];
};

export type ImeAction = {
  type: "ime";
  value: string;
};

export type Action = CharacterAction | LayerAction | ShortcutAction | MacroAction | ImeAction;

export type BaseLayer = {
  id: Id;
  name: string;
  kind: "base";
};

export type ConditionalLayer = {
  id: Id;
  name: string;
  kind: "conditional";
  trigger: InputTrigger;
};

export type Layer = BaseLayer | ConditionalLayer;

export type Binding = {
  id: Id;
  trigger: InputTrigger;
  action: Action;
};

export type LogicalMap = {
  id: Id;
  name: string;
  physicalId: Id;
  bindings: Binding[];
  layers: Layer[];
};

export type LogicalMapPatch = Partial<Pick<LogicalMap, "name">>;
export type BaseLayerPatch = Partial<Pick<BaseLayer, "name">>;
export type ConditionalLayerPatch = Partial<Pick<ConditionalLayer, "name" | "trigger">>;
export type BindingTriggerPatch = Pick<Binding, "trigger">;
export type BindingActionPatch = Pick<Binding, "action">;
