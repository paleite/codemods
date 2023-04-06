import { createTransform } from "../lib/test-utils";
import { default as enumToAsConst } from "./enum-to-as-const";

const transform = createTransform(enumToAsConst);

describe("enum-to-as-const", () => {
  it("transforms enums to as const when all values are literals", () => {
    const { output } = transform('enum Foo { Bar = "bar", Baz = "baz" }');

    expect(output).toMatchInlineSnapshot(`
      "const Foo = {
        Bar: "bar",
        Baz: "baz"
      } as const;"
    `);
  });

  it("supports string literal identifiers", () => {
    const { output } = transform(
      'enum Foo { "Foo-Bar" = "foo-bar", Baz = "baz" };'
    );

    expect(output).toMatchInlineSnapshot(`
      "const Foo = {
        "Foo-Bar": "foo-bar",
        Baz: "baz"
      } as const;"
    `);
  });

  it("doesn't transform enums when a value is not literal", () => {
    const { output } = transform('enum Foo { MissingLiteral, Baz = "baz" }');

    expect(output).toMatchInlineSnapshot(
      '"enum Foo { MissingLiteral, Baz = "baz" }"'
    );
  });
});
