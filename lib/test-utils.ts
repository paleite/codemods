import type { Transform } from "jscodeshift";
import { applyTransform } from "jscodeshift/dist/testUtils";

const transform: (module: Transform, source: string) => string = (
  module,
  source
) => applyTransform(module, {}, { source }, { parser: "ts" });

export { transform };
