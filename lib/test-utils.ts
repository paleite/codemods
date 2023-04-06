import type { Options, Transform } from "jscodeshift";
import { applyTransform } from "jscodeshift/dist/testUtils";

type TransformerFactory = (
  module: Transform,
  options?: Options
) => (source: string) => { input: string; output: string };

const createTransform: TransformerFactory =
  (module, options = {}) =>
  (source) => {
    jest.resetModules();

    const output = applyTransform(
      module,
      options,
      { source },
      { parser: "ts" }
    );

    return { input: source, output };
  };

export { createTransform };
