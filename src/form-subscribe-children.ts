import type {
  Collection,
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

const transform: Transform = (fileInfo, api) => {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  const isFormSubscribeName = (name: JSXElement["openingElement"]["name"]) =>
    name.type === "JSXMemberExpression" &&
    name.object.type === "JSXIdentifier" &&
    name.object.name === "form" &&
    name.property.type === "JSXIdentifier" &&
    name.property.name === "Subscribe";

  const findChildrenAttributeIndex = (
    attributes: Array<JSXAttribute | JSXSpreadAttribute> = [],
  ) =>
    attributes.findIndex(
      (attribute) =>
        attribute.type === "JSXAttribute" &&
        attribute.name.type === "JSXIdentifier" &&
        attribute.name.name === "children",
    );

  const buildChildrenFromAttribute = (
    attribute: JSXAttribute,
  ): JSXChildLike[] => {
    if (attribute.value == null) {
      return [];
    }

    if (attribute.value.type === "JSXExpressionContainer") {
      if (attribute.value.expression.type === "JSXEmptyExpression") {
        return [];
      }

      return [j.jsxExpressionContainer(attribute.value.expression)];
    }

    if (attribute.value.type === "StringLiteral") {
      return [j.jsxText(attribute.value.value)];
    }

    if (
      attribute.value.type === "Literal" &&
      typeof attribute.value.value === "string"
    ) {
      return [j.jsxText(attribute.value.value)];
    }

    if (
      attribute.value.type === "JSXElement" ||
      attribute.value.type === "JSXFragment"
    ) {
      return [attribute.value];
    }

    return [j.jsxExpressionContainer(attribute.value)];
  };

  const hasMeaningfulChildren = (children: JSXChildLike[] = []) =>
    children.some((child) => {
      if (child.type === "JSXText") {
        return child.value.trim().length > 0;
      }

      return true;
    });

  const updateElements = (collection: Collection<JSXElement>) =>
    collection
      .filter((path) => isFormSubscribeName(path.node.openingElement.name))
      .forEach((path) => {
        const openingElement = path.node.openingElement;
        const attributes = openingElement.attributes ?? [];
        const childrenIndex = findChildrenAttributeIndex(attributes);

        if (childrenIndex === -1) {
          return;
        }

        if (hasMeaningfulChildren(path.node.children)) {
          return;
        }

        const childrenAttribute = attributes[childrenIndex];
        if (
          childrenAttribute == null ||
          childrenAttribute.type !== "JSXAttribute" ||
          childrenAttribute.value == null
        ) {
          return;
        }

        const newAttributes = attributes.slice();
        newAttributes.splice(childrenIndex, 1);
        openingElement.attributes = newAttributes;
        path.node.children = buildChildrenFromAttribute(childrenAttribute);

        if (openingElement.selfClosing || path.node.closingElement == null) {
          openingElement.selfClosing = false;
          path.node.closingElement = j.jsxClosingElement(openingElement.name);
        }
      });

  updateElements(root.find(j["JSXElement"]));

  return root.toSource();
};

export default transform;
