import { createTransform } from "../lib/test-utils";
import { default as formSubscribeChildren } from "./form-subscribe-children";

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
});
