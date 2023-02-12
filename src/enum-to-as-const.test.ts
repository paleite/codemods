import { transform } from "../lib/test-utils";
import { default as enumToAsConst } from "./enum-to-as-const";

describe("enum-to-as-const", () => {
  it("transforms enums to as const when all values are literals", () => {
    expect(transform(enumToAsConst, 'enum Foo { Bar = "bar", Baz = "baz" }'))
      .toMatchInlineSnapshot(`
      "const Foo = {
        Bar: "bar",
        Baz: "baz"
      } as const;"
    `);

    expect(
      transform(
        enumToAsConst,
        'enum Foo { "Foo-Bar" = "foo-bar", Baz = "baz" };'
      )
    ).toMatchInlineSnapshot(`
      "const Foo = {
        "Foo-Bar": "foo-bar",
        Baz: "baz"
      } as const;"
    `);
  });

  it("doesn't transform enums when a value is not literal", () => {
    expect(
      transform(enumToAsConst, 'enum Foo { MissingLiteral, Baz = "baz" }')
    ).toMatchInlineSnapshot('"enum Foo { MissingLiteral, Baz = "baz" }"');
  });
});
