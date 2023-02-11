// import * as prettier from "prettier";
import { default as enumToAsConst } from "./enum-to-as-const";
import { transform } from "../lib/test-utils";

describe("enum-to-as-const", () => {
  it("transforms enums to as const when all values are literals", () => {
    expect(transform(enumToAsConst, `enum Foo { Bar = "bar", Baz = "baz" }`))
      .toMatchInlineSnapshot(`
      "const Foo = {
        Bar: "bar",
        Baz: "baz"
      } as const;"
    `);
  });

  it("doesn't transform enums when a value is not literal", () => {
    expect(
      transform(enumToAsConst, `enum Foo { MissingLiteral, Baz = "baz" }`)
    ).toMatchInlineSnapshot(`"enum Foo { MissingLiteral, Baz = "baz" }"`);
  });
});
