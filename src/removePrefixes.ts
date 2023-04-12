import type { Transform } from "jscodeshift";

const removePrefixes: Transform = (fileInfo, api) => {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  const prefixPatterns = ["T", "I"];

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
    const newName = removePrefix(path.node.id.name);
    if (newName === path.node.id.name) {
      return;
    }

    typesToRename.set(path.node.id.name, newName);
    path.node.id.name = newName;
  });

  root.find(j.TSInterfaceDeclaration).forEach((path) => {
    if (!("name" in path.node.id)) {
      return;
    }

    const newName = removePrefix(path.node.id.name);
    if (newName === path.node.id.name) {
      return;
    }

    typesToRename.set(path.node.id.name, newName);
    path.node.id.name = newName;
  });

  // Rename the collected types in type references
  root.find(j.TSTypeReference).forEach((path) => {
    if (path.node.typeName.type !== "Identifier") {
      return;
    }

    const newName = typesToRename.get(path.node.typeName.name);
    if (newName === undefined) {
      return;
    }

    path.node.typeName.name = newName;
  });

  return root.toSource();
};

export default removePrefixes;
