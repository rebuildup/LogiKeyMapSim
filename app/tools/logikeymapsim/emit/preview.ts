import type { PreviewOutput, EmitContext } from "./model";

export function emitPreview(context: EmitContext): PreviewOutput {
  return {
    lines: context.result.operations.map((op) => {
      if (op.kind === "replace") {
        return `stage:${op.stage.index} replace ${op.from?.bindingId ?? "?"} -> ${op.to?.bindingId ?? "?"}`;
      }
      return `stage:${op.stage.index} manual ${op.reason ?? "unknown"}`;
    })
  };
}
