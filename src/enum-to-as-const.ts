import type {
  ASTPath,
  JSCodeshift,
  TSEnumDeclaration,
  TSEnumMember,
  Transform,
} from "jscodeshift";
import { isArrayDefined } from "./utils/assertion-functions";
import { createVariableDeclarationWithAsConst } from "./utils/create";

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
