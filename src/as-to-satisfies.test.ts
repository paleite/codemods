import { createTransform } from "../lib/test-utils";
import asToSatisfies from "./as-to-satisfies";

const transform = createTransform(asToSatisfies, {}, "tsx");

describe("as-to-satisfies", () => {
  it("replaces literal object assertions with satisfies", () => {
    const { output } = transform(
      `const icons = { Foo } as Record<string, Foo>;`,
    );

    expect(output).toMatchInlineSnapshot(
      `"const icons = { Foo } satisfies Record<string, Foo>;"`,
    );
  });

  it("replaces literal array assertions with satisfies", () => {
    const { output } = transform(`const items = [1, 2, 3] as number[];`);

    expect(output).toMatchInlineSnapshot(
      `"const items = [1, 2, 3] satisfies number[];"`,
    );
  });

  it("skips as const", () => {
    const { output } = transform(
      `const alignClass = { left: "", right: "text-right" } as const;`,
    );

    expect(output).toMatchInlineSnapshot(
      `"const alignClass = { left: \"\", right: \"text-right\" } as const;"`,
    );
  });

  it("skips double assertions", () => {
    const { output } = transform(
      `inputElement as unknown as { showPicker?: () => void };`,
    );

    expect(output).toMatchInlineSnapshot(
      `"inputElement as unknown as { showPicker?: () => void };"`,
    );
  });

  it("skips any/unknown/never assertions", () => {
    const { output } = transform(
      `const node = (inputRef as any).current;\nconst value = foo as unknown;\nconst nope = bar as never;`,
    );

    expect(output).toMatchInlineSnapshot(
      `
      "const node = (inputRef as any).current;
      const value = foo as unknown;
      const nope = bar as never;"
    `,
    );
  });

  it("replaces non-literal assertions", () => {
    const { output } = transform(
      `const value = someValue as Foo;\nconst next = data.value as Bar;`,
    );

    expect(output).toMatchInlineSnapshot(
      `
      "const value = someValue satisfies Foo;
      const next = data.value satisfies Bar;"
    `,
    );
  });

  it("skips new expressions", () => {
    const { output } = transform(
      `const items = new Map() as Map<string, number>;`,
    );

    expect(output).toMatchInlineSnapshot(
      `"const items = new Map() as Map<string, number>;"`,
    );
  });

  it("skips as inside satisfies chains", () => {
    const { output } = transform(
      `const value = { a: 1 } as const satisfies { a: number };`,
    );

    expect(output).toMatchInlineSnapshot(
      `"const value = { a: 1 } as const satisfies { a: number };"`,
    );
  });
});
