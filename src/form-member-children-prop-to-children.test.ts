import { createTransform } from "../lib/test-utils";
import { default as formSubscribeChildren } from "./form-member-children-prop-to-children";

const transform = createTransform(formSubscribeChildren, {}, "tsx");

describe("form-subscribe-children", () => {
  it("moves children prop to JSX children for self-closing elements", () => {
    const { output } = transform(`
      const Example = () => (
        <form.Subscribe
          children={(value) => <div>{value}</div>}
          selector={(state) => state}
        />
      );
    `);

    expect(output).toMatchInlineSnapshot(`
      "const Example = () => (
              <form.Subscribe selector={(state) => state}>{(value) => <div>{value}</div>}</form.Subscribe>
            );"
    `);
  });

  it("moves children prop for form.Field elements", () => {
    const { output } = transform(`
      const Example = () => (
        <form.Field
          children={(value) => <div>{value}</div>}
          name="email"
        />
      );
    `);

    expect(output).toMatchInlineSnapshot(`
      "const Example = () => (
              <form.Field name="email">{(value) => <div>{value}</div>}</form.Field>
            );"
    `);
  });

  it("moves children prop for any .Subscribe member", () => {
    const { output } = transform(`
      const Example = () => (
        <other.Subscribe children={(value) => <div>{value}</div>} />
      );
    `);

    expect(output).toMatchInlineSnapshot(`
      "const Example = () => (
              <other.Subscribe>{(value) => <div>{value}</div>}</other.Subscribe>
            );"
    `);
  });

  it("moves children prop to JSX children for non-self-closing elements", () => {
    const { output } = transform(`
      const Example = () => (
        <form.Subscribe
          selector={(state) => state}
          children={(value) => <div>{value}</div>}
        ></form.Subscribe>
      );
    `);

    expect(output).toMatchInlineSnapshot(`
      "const Example = () => (
              <form.Subscribe selector={(state) => state}>{(value) => <div>{value}</div>}</form.Subscribe>
            );"
    `);
  });

  it("leaves existing children intact", () => {
    const { output } = transform(`
      const Example = () => (
        <form.Subscribe children={(value) => <div>{value}</div>}>
          <span>Keep me</span>
        </form.Subscribe>
      );
    `);

    expect(output).toMatchInlineSnapshot(`
      "const Example = () => (
              <form.Subscribe children={(value) => <div>{value}</div>}>
                <span>Keep me</span>
              </form.Subscribe>
            );"
    `);
  });

  it("keeps elements without a children prop unchanged", () => {
    const { output } = transform(`
      const Example = () => (
        <form.Subscribe selector={(state) => state} />
      );
    `);

    expect(output).toMatchInlineSnapshot(`
      "const Example = () => (
              <form.Subscribe selector={(state) => state} />
            );"
    `);
  });

  it("keeps boolean children props unchanged", () => {
    const { output } = transform(`
      const Example = () => (
        <form.Subscribe children />
      );
    `);

    expect(output).toMatchInlineSnapshot(`
      "const Example = () => (
              <form.Subscribe children />
            );"
    `);
  });

  it("moves string literal children to JSX text", () => {
    const { output } = transform(`
      const Example = () => (
        <form.Subscribe children="Hello" />
      );
    `);

    expect(output).toMatchInlineSnapshot(`
      "const Example = () => (
              <form.Subscribe>Hello</form.Subscribe>
            );"
    `);
  });

  it("moves JSX element children to real children", () => {
    const { output } = transform(`
      const Example = () => (
        <form.Subscribe children={<span>Hi</span>} />
      );
    `);

    expect(output).toMatchInlineSnapshot(`
      "const Example = () => (
              <form.Subscribe>{<span>Hi</span>}</form.Subscribe>
            );"
    `);
  });

  it("handles JSX element attribute values without braces", () => {
    const { output } = transform(`
      const Example = () => (
        <form.Subscribe children=<span>Hi</span> />
      );
    `);

    expect(output).toMatchInlineSnapshot(`
      "const Example = () => (
              <form.Subscribe>{<span>Hi</span>}</form.Subscribe>
            );"
    `);
  });

  it("moves JSX fragment children to real children", () => {
    const { output } = transform(`
      const Example = () => (
        <form.Subscribe children={<></>} />
      );
    `);

    expect(output).toMatchInlineSnapshot(`
      "const Example = () => (
              <form.Subscribe>{<></>}</form.Subscribe>
            );"
    `);
  });

  it("treats whitespace-only children as non-meaningful", () => {
    const { output } = transform(`
      const Example = () => (
        <form.Subscribe children={(value) => <div>{value}</div>}> </form.Subscribe>
      );
    `);

    expect(output).toMatchInlineSnapshot(`
      "const Example = () => (
              <form.Subscribe>{(value) => <div>{value}</div>}</form.Subscribe>
            );"
    `);
  });
});
