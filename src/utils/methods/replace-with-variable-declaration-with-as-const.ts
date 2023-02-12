import type {
  ASTPath,
  Collection,
  JSCodeshift,
  TSEnumDeclaration,
  TSEnumMember,
} from "jscodeshift";
import { isArrayDefined } from "../assertion-functions";
import { createVariableDeclarationWithAsConst } from "../create";

const createReplaceWithVariableDeclarationWithAsConst = (j: JSCodeshift) => {
  const getObjectProperty = ({ id, initializer }: TSEnumMember) =>
    j.Expression.check(initializer)
      ? j.property("init", id, initializer)
      : undefined;
  const getObjectProperties = (path: ASTPath<TSEnumDeclaration>) => {
    const objectProperties = path.node.members.map(getObjectProperty);

    if (!isArrayDefined(objectProperties)) {
      return undefined;
    }

    return objectProperties;
  };

  const replaceWithVariableDeclarationWithAsConst = function (
    this: Collection<TSEnumDeclaration>
  ): Collection<TSEnumDeclaration> {
    return this.forEach((path) => {
      const enumName = path.node.id.name;
      const literalObjectProperties = getObjectProperties(path);

      if (literalObjectProperties === undefined) {
        return;
      }

      const variableDeclarationWithAsConst =
        createVariableDeclarationWithAsConst(
          j,
          enumName,
          literalObjectProperties
        );

      j(path).replaceWith(variableDeclarationWithAsConst);
    });
  };

  return replaceWithVariableDeclarationWithAsConst;
};

declare module "jscodeshift/src/Collection" {
  interface Collection<N> {
    replaceWithVariableDeclarationWithAsConst: ReturnType<
      typeof createReplaceWithVariableDeclarationWithAsConst
    >;
  }
}

const registerMethod = (j: JSCodeshift) => {
  j.registerMethods(
    {
      replaceWithVariableDeclarationWithAsConst:
        createReplaceWithVariableDeclarationWithAsConst(j),
    },
    j.TSEnumDeclaration
  );
};

export { registerMethod };
