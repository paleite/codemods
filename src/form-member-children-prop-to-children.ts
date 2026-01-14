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

  const isTargetMemberName = (name: JSXElement["openingElement"]["name"]) =>
    name.type === "JSXMemberExpression" &&
    name.property.type === "JSXIdentifier" &&
    (name.property.name === "Subscribe" || name.property.name === "Field");

  const findChildrenAttributeIndex = (
    attributes: (JSXAttribute | JSXSpreadAttribute)[] = [],
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
    const value = attribute.value!;

    if (value.type === "StringLiteral") {
      return [j.jsxText(value.value)];
    }

    const expression =
      value.type === "JSXExpressionContainer" ? value.expression : value;

    return [j.jsxExpressionContainer(expression)];
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
      .filter((path) => isTargetMemberName(path.node.openingElement.name))
      .forEach((path) => {
        const openingElement = path.node.openingElement;
        const attributes = openingElement.attributes!;
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

  updateElements(root.find(j.JSXElement));

  return root.toSource();
};

export default transform;
