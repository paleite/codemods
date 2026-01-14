import type {
  ASTPath,
  JSXAttribute,
  JSXElement,
  JSXExpressionContainer,
  JSXFragment,
  JSXSpreadAttribute,
  JSXText,
  Transform,
} from "jscodeshift";

type JSXChildLike =
  | NonNullable<JSXElement["children"]>[number]
  | JSXExpressionContainer
  | JSXText
  | JSXFragment;

type ImportSpec = {
  importedName: string;
  localName: string;
  modulePath: string;
};

const componentImports: Record<string, string> = {
  Button: "@/components/ui/button",
  Checkbox: "@/components/ui/checkbox",
  FieldLabel: "@/components/ui/field",
  FieldLegend: "@/components/ui/field",
  FieldSet: "@/components/ui/field",
  Input: "@/components/ui/input",
  Kbd: "@/components/ui/kbd",
  RadioGroupItem: "@/components/ui/radio-group",
  Select: "@/components/ui/select",
  SelectContent: "@/components/ui/select",
  SelectItem: "@/components/ui/select",
  SelectTrigger: "@/components/ui/select",
  SelectValue: "@/components/ui/select",
  Separator: "@/components/ui/separator",
  Slider: "@/components/ui/slider",
  Table: "@/components/ui/table",
  TableBody: "@/components/ui/table",
  TableCaption: "@/components/ui/table",
  TableCell: "@/components/ui/table",
  TableFooter: "@/components/ui/table",
  TableHead: "@/components/ui/table",
  TableHeader: "@/components/ui/table",
  TableRow: "@/components/ui/table",
  Textarea: "@/components/ui/textarea",
};

const simpleTagMap: Record<string, string> = {
  button: "Button",
  caption: "TableCaption",
  fieldset: "FieldSet",
  hr: "Separator",
  kbd: "Kbd",
  label: "FieldLabel",
  legend: "FieldLegend",
  table: "Table",
  tbody: "TableBody",
  td: "TableCell",
  textarea: "Textarea",
  tfoot: "TableFooter",
  th: "TableHead",
  thead: "TableHeader",
  tr: "TableRow",
};

const inputTypeMap: Record<string, string> = {
  checkbox: "Checkbox",
  radio: "RadioGroupItem",
  range: "Slider",
};

const RADIO_TODO = "TODO: wrap radio siblings in <RadioGroup>";

const transform: Transform = (fileInfo, api) => {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  const filePath = typeof fileInfo.path === "string" ? fileInfo.path : "";
  if (
    filePath.includes("/src/components/ui/") ||
    filePath.startsWith("src/components/ui/")
  ) {
    return fileInfo.source;
  }

  const usedNames = new Set<string>();
  root.find(j.Identifier).forEach((path) => {
    usedNames.add(path.node.name);
  });
  root.find(j.JSXIdentifier).forEach((path) => {
    usedNames.add(path.node.name);
  });

  const plannedImports = new Map<string, ImportSpec>();

  const ensureImport = (importedName: string): string => {
    const modulePath = componentImports[importedName];
    if (modulePath == null) {
      return importedName;
    }

    const existing = root
      .find(j.ImportDeclaration)
      .filter((path) => path.node.source.value === modulePath);

    if (existing.size() > 0) {
      const existingSpecifier = existing
        .find(j.ImportSpecifier)
        .filter((path) => {
          const imported = path.node.imported;
          return (
            imported != null &&
            imported.type === "Identifier" &&
            imported.name === importedName
          );
        })
        .nodes()[0];

      if (existingSpecifier != null) {
        const local = existingSpecifier.local;
        if (local?.type === "Identifier") {
          return local.name;
        }

        const imported = existingSpecifier.imported;
        if (imported.type === "Identifier") {
          return imported.name;
        }

        return importedName;
      }
    }

    const existingPlanned = plannedImports.get(importedName);
    if (existingPlanned != null) {
      return existingPlanned.localName;
    }

    let localName = importedName;
    if (usedNames.has(localName)) {
      let suffix = 0;
      let candidate = `Shadcn${importedName}`;
      while (usedNames.has(candidate)) {
        suffix += 1;
        candidate = `Shadcn${importedName}${suffix}`;
      }
      localName = candidate;
    }

    plannedImports.set(importedName, {
      importedName,
      localName,
      modulePath,
    });
    usedNames.add(localName);
    return localName;
  };

  const isOnlyWhitespaceText = (child: JSXChildLike) =>
    child.type === "JSXText" && child.value.trim().length === 0;

  const getAttributeByName = (
    attributes: (JSXAttribute | JSXSpreadAttribute)[] = [],
    name: string,
  ) =>
    attributes.find(
      (attribute) =>
        attribute.type === "JSXAttribute" &&
        attribute.name.type === "JSXIdentifier" &&
        attribute.name.name === name,
    ) ?? null;

  const removeAttributeByName = (
    attributes: (JSXAttribute | JSXSpreadAttribute)[] = [],
    name: string,
  ) =>
    attributes.filter(
      (attribute) =>
        !(
          attribute.type === "JSXAttribute" &&
          attribute.name.type === "JSXIdentifier" &&
          attribute.name.name === name
        ),
    );

  const getTextFromChildren = (children: JSXChildLike[]) => {
    if (children.every((child) => child.type === "JSXText")) {
      const combined = children
        .map((child) => (child as JSXText).value)
        .join("");
      const trimmed = combined.trim();
      return trimmed.length > 0 ? trimmed : null;
    }

    const expressionNode = children.find(
      (child): child is JSXExpressionContainer =>
        child.type === "JSXExpressionContainer",
    );
    if (expressionNode != null && children.length === 1) {
      const expression = expressionNode.expression;
      if (
        expression.type === "StringLiteral" ||
        (expression.type === "Literal" && typeof expression.value === "string")
      ) {
        return String(expression.value);
      }
    }

    return null;
  };

  const createComment = (message: string) =>
    j.jsxExpressionContainer(
      Object.assign(j.jsxEmptyExpression(), {
        comments: [j.commentBlock(message)],
      }),
    );

  const insertTodoBefore = (path: ASTPath<JSXElement>) => {
    const parent = path.parent.node;
    if (
      parent == null ||
      (parent.type !== "JSXElement" && parent.type !== "JSXFragment")
    ) {
      return;
    }

    const siblings = parent.children as JSXElement["children"];
    if (siblings == null) {
      return;
    }
    const index = siblings.indexOf(path.node);
    if (index < 0) {
      return;
    }

    let previousIndex = index - 1;
    while (previousIndex >= 0) {
      const sibling = siblings[previousIndex];
      if (sibling?.type === "JSXText" && sibling.value.trim().length === 0) {
        previousIndex -= 1;
        continue;
      }

      if (
        sibling?.type === "JSXExpressionContainer" &&
        sibling.expression.type === "JSXEmptyExpression" &&
        sibling.expression.comments?.some(
          (comment: { value: string }) => comment.value === RADIO_TODO,
        )
      ) {
        return;
      }

      if (sibling?.type === "JSXElement") {
        const siblingName = sibling.openingElement.name;
        if (
          siblingName.type === "JSXIdentifier" &&
          siblingName.name === "RadioGroupItem"
        ) {
          previousIndex -= 1;
          continue;
        }
      }

      break;
    }

    siblings.splice(index, 0, createComment(RADIO_TODO), j.jsxText("\n"));
  };

  const renameElement = (element: JSXElement, newName: string): JSXElement => {
    const localName = ensureImport(newName);
    const identifier = j.jsxIdentifier(localName);
    element.openingElement.name = identifier;
    if (element.closingElement) {
      element.closingElement.name = identifier;
    }
    return element;
  };

  const shouldSkipSelect = (
    element: JSXElement,
    attributes: (JSXAttribute | JSXSpreadAttribute)[],
  ) => {
    const hasMultiple = getAttributeByName(attributes, "multiple");
    const hasSize = getAttributeByName(attributes, "size");
    if (hasMultiple || hasSize) {
      return true;
    }

    const children = (element.children ?? []) as JSXChildLike[];

    return children
      .filter((child) => !isOnlyWhitespaceText(child))
      .some((child) => {
        if (child.type !== "JSXElement") {
          return true;
        }
        const name = child.openingElement.name;
        return !(name.type === "JSXIdentifier" && name.name === "option");
      });
  };

  const buildSelectReplacement = (
    element: JSXElement,
    attributes: (JSXAttribute | JSXSpreadAttribute)[],
  ) => {
    const selectName = ensureImport("Select");
    const selectTriggerName = ensureImport("SelectTrigger");
    const selectValueName = ensureImport("SelectValue");
    const selectContentName = ensureImport("SelectContent");
    const selectItemName = ensureImport("SelectItem");

    const selectProps: (JSXAttribute | JSXSpreadAttribute)[] = [];
    const triggerProps: (JSXAttribute | JSXSpreadAttribute)[] = [];

    for (const attribute of attributes) {
      if (attribute.type === "JSXSpreadAttribute") {
        selectProps.push(attribute);
        continue;
      }

      if (attribute.name.type !== "JSXIdentifier") {
        continue;
      }

      const name = attribute.name.name;
      if (name === "onChange") {
        if (attribute.value != null) {
          selectProps.push(
            j.jsxAttribute(j.jsxIdentifier("onValueChange"), attribute.value),
          );
        }
        continue;
      }

      if (
        name === "value" ||
        name === "defaultValue" ||
        name === "name" ||
        name === "required" ||
        name === "disabled" ||
        name === "dir"
      ) {
        selectProps.push(attribute);
        continue;
      }

      triggerProps.push(attribute);
    }

    const options = (element.children ?? []).filter(
      (child): child is JSXElement =>
        child.type === "JSXElement" &&
        child.openingElement.name.type === "JSXIdentifier" &&
        child.openingElement.name.name === "option",
    );

    let placeholderText: string | null = null;
    const items: JSXElement[] = [];

    options.forEach((option) => {
      const optionAttributes = option.openingElement.attributes ?? [];
      const valueAttribute = getAttributeByName(optionAttributes, "value");
      const disabledAttribute = getAttributeByName(
        optionAttributes,
        "disabled",
      );
      const selectedAttribute = getAttributeByName(
        optionAttributes,
        "selected",
      );

      let valueExpression: JSXAttribute["value"] | null = null;
      if (
        valueAttribute?.type === "JSXAttribute" &&
        valueAttribute.value != null
      ) {
        valueExpression = valueAttribute.value;
        if (
          (valueAttribute.value.type === "StringLiteral" &&
            valueAttribute.value.value === "") ||
          (valueAttribute.value.type === "Literal" &&
            valueAttribute.value.value === "")
        ) {
          if (placeholderText == null) {
            placeholderText = getTextFromChildren(
              option.children as JSXChildLike[],
            );
          }
          return;
        }
      } else {
        const derivedValue = getTextFromChildren(
          option.children as JSXChildLike[],
        );
        if (derivedValue != null) {
          valueExpression = j.stringLiteral(derivedValue);
        }
      }

      const selectItemAttributes: (JSXAttribute | JSXSpreadAttribute)[] = [];

      if (valueExpression != null) {
        selectItemAttributes.push(
          j.jsxAttribute(j.jsxIdentifier("value"), valueExpression),
        );
      }

      if (disabledAttribute != null) {
        selectItemAttributes.push(disabledAttribute);
      }

      if (selectedAttribute != null) {
        // Drop selected; Select is controlled via value/defaultValue.
      }

      const selectItem = j.jsxElement(
        j.jsxOpeningElement(
          j.jsxIdentifier(selectItemName),
          selectItemAttributes,
          false,
        ),
        j.jsxClosingElement(j.jsxIdentifier(selectItemName)),
        option.children,
      );
      items.push(selectItem);
    });

    const selectValueAttributes: JSXAttribute[] = [];
    if (placeholderText != null) {
      selectValueAttributes.push(
        j.jsxAttribute(
          j.jsxIdentifier("placeholder"),
          j.stringLiteral(placeholderText),
        ),
      );
    }

    const selectValue = j.jsxElement(
      j.jsxOpeningElement(
        j.jsxIdentifier(selectValueName),
        selectValueAttributes,
        true,
      ),
      null,
      [],
    );

    const selectTrigger = j.jsxElement(
      j.jsxOpeningElement(
        j.jsxIdentifier(selectTriggerName),
        triggerProps,
        false,
      ),
      j.jsxClosingElement(j.jsxIdentifier(selectTriggerName)),
      [selectValue],
    );

    const selectContent = j.jsxElement(
      j.jsxOpeningElement(j.jsxIdentifier(selectContentName), [], false),
      j.jsxClosingElement(j.jsxIdentifier(selectContentName)),
      items,
    );

    return j.jsxElement(
      j.jsxOpeningElement(j.jsxIdentifier(selectName), selectProps, false),
      j.jsxClosingElement(j.jsxIdentifier(selectName)),
      [selectTrigger, selectContent],
    );
  };

  root.find(j.JSXElement).forEach((path) => {
    const openingElement = path.node.openingElement;
    const elementName = openingElement.name;
    if (elementName.type !== "JSXIdentifier") {
      return;
    }

    const name = elementName.name;
    const attributes = openingElement.attributes ?? [];

    if (name === "input") {
      const typeAttribute = getAttributeByName(attributes, "type");
      const typeValue =
        typeAttribute?.type === "JSXAttribute" &&
        typeAttribute.value != null &&
        (typeAttribute.value.type === "StringLiteral" ||
          (typeAttribute.value.type === "Literal" &&
            typeof typeAttribute.value.value === "string"))
          ? String(typeAttribute.value.value)
          : null;

      const replacementComponent =
        typeValue != null ? inputTypeMap[typeValue] ?? "Input" : "Input";
      const renamed = renameElement(path.node, replacementComponent);

      if (replacementComponent !== "Input") {
        renamed.openingElement.attributes = removeAttributeByName(
          attributes,
          "type",
        );
      }

      if (replacementComponent === "RadioGroupItem") {
        insertTodoBefore(path);
      }

      return;
    }

    if (name === "select") {
      if (shouldSkipSelect(path.node, attributes)) {
        return;
      }

      const replacement = buildSelectReplacement(path.node, attributes);
      j(path).replaceWith(replacement);
      return;
    }

    const replacementName = simpleTagMap[name];
    if (replacementName != null) {
      renameElement(path.node, replacementName);
    }
  });

  const addPlannedImports = () => {
    if (plannedImports.size === 0) {
      return;
    }

    const importsByModule = new Map<string, ImportSpec[]>();
    plannedImports.forEach((spec) => {
      const group = importsByModule.get(spec.modulePath) ?? [];
      group.push(spec);
      importsByModule.set(spec.modulePath, group);
    });

    const importDeclarations = root.find(j.ImportDeclaration);
    const newImports: ReturnType<typeof j.importDeclaration>[] = [];

    importsByModule.forEach((specs, modulePath) => {
      const existing = importDeclarations
        .filter((path) => path.node.source.value === modulePath)
        .nodes()[0];

      const importSpecifiers = specs
        .slice()
        .sort((a, b) => a.importedName.localeCompare(b.importedName))
        .map((spec) =>
          j.importSpecifier(
            j.identifier(spec.importedName),
            spec.importedName === spec.localName
              ? null
              : j.identifier(spec.localName),
          ),
        );

      if (existing) {
        existing.specifiers = existing.specifiers ?? [];
        existing.specifiers.push(...importSpecifiers);
        return;
      }

      newImports.push(
        j.importDeclaration(importSpecifiers, j.literal(modulePath)),
      );
    });

    if (newImports.length === 0) {
      return;
    }

    const body = root.get().node.program.body;
    let lastImportIndex = -1;
    for (let index = 0; index < body.length; index += 1) {
      if (body[index]?.type === "ImportDeclaration") {
        lastImportIndex = index;
      } else {
        break;
      }
    }

    body.splice(lastImportIndex + 1, 0, ...newImports);
  };

  addPlannedImports();

  return root.toSource();
};

export default transform;
