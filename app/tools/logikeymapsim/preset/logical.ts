import type { LogicalMap } from "../logical/model";

export const presets: LogicalMap[] = [
  {
    id: "preset_logical_qwerty",
    name: "QWERTY",
    physicalId: "preset_phys_60",
    layers: [{ id: "preset_layer_base", name: "base", kind: "base" }],
    bindings: [
      {
        id: "preset_bind_esc",
        trigger: { type: "press", keyId: "preset_key_esc" },
        action: { type: "character", value: "ESC" }
      },
      {
        id: "preset_bind_1",
        trigger: { type: "press", keyId: "preset_key_1" },
        action: { type: "character", value: "1" }
      },
      {
        id: "preset_bind_2",
        trigger: { type: "press", keyId: "preset_key_2" },
        action: { type: "character", value: "2" }
      },
      {
        id: "preset_bind_q",
        trigger: { type: "press", keyId: "preset_key_q" },
        action: { type: "character", value: "q" }
      },
      {
        id: "preset_bind_w",
        trigger: { type: "press", keyId: "preset_key_w" },
        action: { type: "character", value: "w" }
      },
      {
        id: "preset_bind_e",
        trigger: { type: "press", keyId: "preset_key_e" },
        action: { type: "character", value: "e" }
      }
    ]
  }
];