import type {
  JSCodeshift,
  ASTPath,
  TSEnumDeclaration,
  TSEnumMember,
  Transform,
} from "jscodeshift";
import { isArrayDefined } from "./utils/assertion-functions";

const createLiteralObjectPropertyGetter =
  (j: JSCodeshift) =>
  ({ id, initializer }: TSEnumMember) =>
    j.Expression.check(initializer)
      ? j.property("init", id, initializer)
      : undefined;

const createObjectPropertiesGetter = (j: JSCodeshift) => {
  const getLiteralObjectProperty = createLiteralObjectPropertyGetter(j);

  return (path: ASTPath<TSEnumDeclaration>) => {
    const literalObjectProperties = path.node.members.map(
      getLiteralObjectProperty
    );

    if (!isArrayDefined(literalObjectProperties)) {
      return undefined;
    }

    return literalObjectProperties;
  };
};

const createVariableDeclarationWithAsConst = (
  j: JSCodeshift,
  enumName: Parameters<typeof j.identifier>[0],
  objectProperties: Parameters<typeof j.objectExpression>[0]
) =>
  j.variableDeclaration("const", [
    j.variableDeclarator(
      j.identifier(enumName),
      j.tsAsExpression(
        j.objectExpression(objectProperties),
        j.tsTypeReference(j.identifier("const"))
      )
    ),
  ]);

const transform: Transform = (file, { jscodeshift: j }) => {
  const getObjectProperties = createObjectPropertiesGetter(j);

  const modifiedSource: string = j(file.source)
    .find(j.TSEnumDeclaration)
    .forEach((path) => {
      const enumName = path.node.id.name;
      const objectProperties = getObjectProperties(path);

      if (objectProperties === undefined) {
        return;
      }

      const variableDeclarationWithAsConst =
        createVariableDeclarationWithAsConst(j, enumName, objectProperties);

      j(path).replaceWith(variableDeclarationWithAsConst);
    })
    .toSource();

  return modifiedSource;
};

export default transform;
