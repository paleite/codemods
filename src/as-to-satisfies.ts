import type { Transform } from "jscodeshift";

const unwrapExpression = (expression: any): any => {
  let current = expression;
  while (
    current != null &&
    (current.type === "ParenthesizedExpression" ||
      current.type === "TSParenthesizedExpression")
  ) {
    current = current.expression;
  }
  return current;
};

const isDisallowedTypeAnnotation = (typeAnnotation: any): boolean => {
  if (typeAnnotation == null) {
    return true;
  }

  return (
    typeAnnotation.type === "TSConstKeyword" ||
    typeAnnotation.type === "TSAnyKeyword" ||
    typeAnnotation.type === "TSUnknownKeyword" ||
    typeAnnotation.type === "TSNeverKeyword" ||
    (typeAnnotation.type === "TSTypeReference" &&
      typeAnnotation.typeName?.type === "Identifier" &&
      typeAnnotation.typeName.name === "const")
  );
};

const isDisallowedExpression = (expression: any): boolean => {
  const unwrapped = unwrapExpression(expression);
  if (unwrapped == null) {
    return true;
  }

  return unwrapped.type === "NewExpression";
};

const transform: Transform = (fileInfo, api) => {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  root
    .find(j.TSAsExpression)
    .filter((path) => path.parent?.node.type !== "TSSatisfiesExpression")
    .forEach((path) => {
      const { expression, typeAnnotation } = path.node;

      if (isDisallowedTypeAnnotation(typeAnnotation)) {
        return;
      }

      if (isDisallowedExpression(expression)) {
        return;
      }

      if (expression.type === "TSAsExpression") {
        return;
      }

      const satisfiesExpression = {
        type: "TSSatisfiesExpression",
        expression,
        typeAnnotation,
      };

      j(path).replaceWith(satisfiesExpression as any);
    });

  return root.toSource();
};

export default transform;

export const __test__ = {
  unwrapExpression,
  isDisallowedTypeAnnotation,
  isDisallowedExpression,
};
