import type { JSCodeshift } from "jscodeshift";

const createVariableDeclarationWithAsConst = (
  j: JSCodeshift,
  identifier: Parameters<typeof j.identifier>[0],
  objectProperties: Parameters<typeof j.objectExpression>[0]
) =>
  j.variableDeclaration("const", [
    j.variableDeclarator(
      j.identifier(identifier),
      j.tsAsExpression(
        j.objectExpression(objectProperties),
        j.tsTypeReference(j.identifier("const"))
      )
    ),
  ]);

export { createVariableDeclarationWithAsConst };
