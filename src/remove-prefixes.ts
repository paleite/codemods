import type {
  Identifier,
  TSInterfaceDeclaration,
  Transform,
} from "jscodeshift";

const transform: Transform = (fileInfo, api) => {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);
  const prefixPatterns = ["T", "I"];

  function assertIdentifier(
    id?: TSInterfaceDeclaration["id"] | null,
  ): asserts id is Identifier {
    j.Identifier.assert(id ?? undefined);
  }

  const removePrefix = (name: string) => {
    for (const prefix of prefixPatterns) {
      const isPrefixed =
        name.startsWith(prefix) &&
        name.length > 1 &&
        name[1]?.toUpperCase() === name[1];

      if (!isPrefixed) {
        continue;
      }

      return name.slice(1);
    }

    return name;
  };

  // Collect all the types and interfaces to be renamed
  const typesToRename: Map<string, string> = new Map();

  root.find(j.TSTypeAliasDeclaration).forEach((path) => {
    if (typeof path.node.id.name !== "string") {
      throw TypeError("Expected type alias name to be a string");
    }
    const newName = removePrefix(path.node.id.name);
    if (newName === path.node.id.name) {
      return;
    }

    typesToRename.set(path.node.id.name, newName);
    path.node.id.name = newName;
  });

  root
    .find(j.TSInterfaceDeclaration, { id: { type: "Identifier" } })
    .forEach((path) => {
      assertIdentifier(path.node.id);

      const newName = removePrefix(path.node.id.name);
      if (newName === path.node.id.name) {
        return;
      }

      typesToRename.set(path.node.id.name, newName);
      path.node.id.name = newName;
    });

  root.find(j.TSExpressionWithTypeArguments).forEach((path) => {
    assertIdentifier(path.node.expression);

    const newName = removePrefix(path.node.expression.name);
    if (newName === path.node.expression.name) {
      return;
    }

    typesToRename.set(path.node.expression.name, newName);
    path.node.expression.name = newName;
  });

  root
    .find(j.ExportSpecifier, { local: { type: "Identifier" } })
    .forEach((path) => {
      assertIdentifier(path.node.local);

      const newName = removePrefix(path.node.local.name);
      if (newName === path.node.local.name) {
        return;
      }

      typesToRename.set(path.node.local.name, newName);
      path.node.local.name = newName;
    });

  root
    .find(j.ExportSpecifier, { exported: { type: "Identifier" } })
    .forEach((path) => {
      assertIdentifier(path.node.exported);

      const newName = removePrefix(path.node.exported.name);
      if (newName === path.node.exported.name) {
        return;
      }

      typesToRename.set(path.node.exported.name, newName);
      path.node.exported.name = newName;
    });

  root
    .find(j.ImportSpecifier, { local: { type: "Identifier" } })
    .forEach((path) => {
      assertIdentifier(path.node.local);

      const newName = removePrefix(path.node.local.name);
      if (newName === path.node.local.name) {
        return;
      }

      typesToRename.set(path.node.local.name, newName);
      path.node.local.name = newName;
    });

  root
    .find(j.ImportSpecifier, { imported: { type: "Identifier" } })
    .forEach((path) => {
      assertIdentifier(path.node.imported);

      const newName = removePrefix(path.node.imported.name);
      if (newName === path.node.imported.name) {
        return;
      }

      typesToRename.set(path.node.imported.name, newName);
      path.node.imported.name = newName;
    });

  // Rename the collected types in type references
  root
    .find(j.TSTypeReference, { typeName: { type: "Identifier" } })
    .forEach((path) => {
      assertIdentifier(path.node.typeName);

      const newName = typesToRename.get(path.node.typeName.name);
      if (newName === undefined) {
        return;
      }

      path.node.typeName.name = newName;
    });

  const modifiedSource = root.toSource();

  return modifiedSource;
};

export default transform;
