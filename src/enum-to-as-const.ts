import type { Transform } from "jscodeshift";
import { registerMethod } from "./utils/methods/replace-with-variable-declaration-with-as-const";

const transform: Transform = (file, { jscodeshift: j }) => {
  registerMethod(j);

  const modifiedSource: string = j(file.source)
    .find(j.TSEnumDeclaration)
    .replaceWithVariableDeclarationWithAsConst()
    .toSource();

  return modifiedSource;
};

export default transform;
