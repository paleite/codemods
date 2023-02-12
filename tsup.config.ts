import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/*.ts", "!src/*.test.ts"],
  tsconfig: "./tsconfig.build.json",
  splitting: false,
  sourcemap: false,
  clean: true,
});
