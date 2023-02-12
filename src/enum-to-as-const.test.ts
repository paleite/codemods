import type { TransformFunction } from "../lib/test-utils";
import { default as enumToAsConst } from "./enum-to-as-const";

describe("enum-to-as-const", () => {
  let transform: TransformFunction;

  beforeEach(async () => {
    transform = (await import("../lib/test-utils")).transform;
    jest.resetModules();
  });

  it("transforms enums to as const when all values are literals", () => {
    expect(transform(enumToAsConst, 'enum Foo { Bar = "bar", Baz = "baz" }'))
      .toMatchInlineSnapshot(`
    "const Foo = {
      Bar: "bar",
      Baz: "baz"
    } as const;"
    `);
  });

  it("supports string literal identifiers", () => {
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
