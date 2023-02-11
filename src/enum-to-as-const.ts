import type { Transform } from "jscodeshift";

function assertAllPropertiesAreLiteral<T>(
  properties: (T | undefined)[]
): asserts properties is T[] {
  const areAllPropertiesLiteral = properties.every(
    (property) => property !== undefined
  );
  if (!areAllPropertiesLiteral) {
    throw new Error(`Not all properties are literal values`);
  }
}

const transform: Transform = (file, { j }) => {
  const modifiedSource: string = j(file.source)
    .find(j.TSEnumDeclaration)
    .forEach((path) => {
      const enumName = path.node.id.name;
      const objectProperties = path.node.members.map((member) => {
        const key = j.Identifier.check(member.id) ? member.id.name : undefined;
        const value = j.Literal.check(member.initializer)
          ? member.initializer.value
          : undefined;

        if (key === undefined || value === undefined) {
          return;
        }

        return j.property("init", j.identifier(key), j.literal(value));
      });

      try {
        assertAllPropertiesAreLiteral(objectProperties);
      } catch (err) {
        // Skip enums that have non-literal values
        return;
      }

      const variableDeclarationWithAsConst = j.variableDeclaration("const", [
        j.variableDeclarator(
          j.identifier(enumName),
          j.tsAsExpression(
            j.objectExpression(objectProperties),
            j.tsTypeReference(j.identifier("const"))
          )
        ),
      ]);

      j(path).replaceWith(variableDeclarationWithAsConst);
    })
    .toSource();

  return modifiedSource;
};

export = transform;
