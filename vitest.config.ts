import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["app/tools/logikeymapsim/test/**/*.test.ts", "app/tools/logikeymapsim/test/**/*.test.tsx"],
    environment: "node"
  }
});
