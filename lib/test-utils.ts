import type { Options, Transform } from "jscodeshift";
import { applyTransform } from "jscodeshift/dist/testUtils";

type TransformerFactory = (
  module: Transform,
  options?: Options,
  parser?: string,
) => (source: string) => { input: string; output: string };

const createTransform: TransformerFactory =
  (module, options = {}, parser = "ts") =>
  (source) => {
    jest.resetModules();

    const output = applyTransform(module, options, { source }, { parser });

    return { input: source, output };
  };

export { createTransform };
