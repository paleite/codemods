import { createTransform } from "../lib/test-utils";
import nativeToShadcn from "./native-to-shadcn";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const jscodeshift = require("jscodeshift");

const transform = createTransform(nativeToShadcn, {}, "tsx");
const runWithPath = (source: string, path = "src/app.tsx") => {
  const api = {
    jscodeshift,
    j: jscodeshift,
    stats: () => undefined,
    report: () => undefined,
  };

  return nativeToShadcn(
    { source, path } as { source: string; path: string },
    api as typeof api,
    {},
  ) as string;
};

describe("native-to-shadcn", () => {
  it("replaces simple tags and adds imports", () => {
    const { output } = transform(`
      const Demo = () => (
        <div>
          <button>Save</button>
          <label htmlFor="name">Name</label>
          <input id="name" />
          <fieldset>
            <legend>Profile</legend>
          </fieldset>
          <hr />
          <kbd>CMD</kbd>
          <table>
            <thead>
              <tr>
                <th>Title</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Row</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td>Footer</td>
              </tr>
            </tfoot>
            <caption>Table</caption>
          </table>
        </div>
      );
    `);

    expect(output).toMatchInlineSnapshot(`
      "import { Button } from "@/components/ui/button";
            import { FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
            import { Input } from "@/components/ui/input";
            import { Separator } from "@/components/ui/separator";
            import { Kbd } from "@/components/ui/kbd";

            import {
              Table,
              TableBody,
              TableCaption,
              TableCell,
              TableFooter,
              TableHead,
              TableHeader,
              TableRow,
            } from "@/components/ui/table";

            const Demo = () => (
              <div>
                <Button>Save</Button>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input id="name" />
                <FieldSet>
                  <FieldLegend>Profile</FieldLegend>
                </FieldSet>
                <Separator />
                <Kbd>CMD</Kbd>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Row</TableCell>
                    </TableRow>
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell>Footer</TableCell>
                    </TableRow>
                  </TableFooter>
                  <TableCaption>Table</TableCaption>
                </Table>
              </div>
            );"
    `);
  });

  it("maps input types and adds radio TODO", () => {
    const { output } = transform(`
      const Demo = () => (
        <div>
          <input type="text" />
          <input type="checkbox" checked />
          <input type="radio" name="size" value="sm" />
          <input type="range" min={0} max={100} />
        </div>
      );
    `);

    expect(output).toMatchInlineSnapshot(`
      "import { Input } from "@/components/ui/input";
            import { Checkbox } from "@/components/ui/checkbox";
            import { RadioGroupItem } from "@/components/ui/radio-group";
            import { Slider } from "@/components/ui/slider";
            const Demo = () => (
              <div>
                <Input type="text" />
                <Checkbox checked />
                {/*TODO: wrap radio siblings in <RadioGroup>*/
                }
                <RadioGroupItem name="size" value="sm" />
                <Slider min={0} max={100} />
              </div>
            );"
    `);
  });

  it("transforms simple select with placeholder options", () => {
    const { output } = transform(`
      const Demo = () => (
        <select className="w-full" value={value} onChange={handleChange}>
          <option value="">Pick one</option>
          <option value="a">Option A</option>
          <option>Option B</option>
        </select>
      );
    `);

    expect(output).toMatchInlineSnapshot(`
      "import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
            const Demo = () => (
              <Select value={value} onValueChange={handleChange}><SelectTrigger className="w-full"><SelectValue placeholder="Pick one" /></SelectTrigger><SelectContent><SelectItem value="a">Option A</SelectItem><SelectItem value="Option B">Option B</SelectItem></SelectContent></Select>
            );"
    `);
  });

  it("skips complex select structures", () => {
    const { output } = transform(`
      const Demo = () => (
        <select>
          <option value="a">A</option>
          <optgroup label="Group">
            <option value="b">B</option>
          </optgroup>
        </select>
      );
    `);

    expect(output).toMatchInlineSnapshot(`
      "const Demo = () => (
              <select>
                <option value="a">A</option>
                <optgroup label="Group">
                  <option value="b">B</option>
                </optgroup>
              </select>
            );"
    `);
  });

  it("aliases conflicting component names", () => {
    const { output } = transform(`
      import { Button } from "@radix-ui/react-button";

      const Demo = () => <button>Save</button>;
    `);

    expect(output).toMatchInlineSnapshot(`
      "import { Button } from "@radix-ui/react-button";

            import { Button as ShadcnButton } from "@/components/ui/button";

            const Demo = () => <ShadcnButton>Save</ShadcnButton>;"
    `);
  });

  it("skips transforms for ui component files", () => {
    const source = `<button>Keep</button>`;
    const output = runWithPath(source, "src/components/ui/button.tsx");

    expect(output).toBe(source);
  });

  it("reuses existing imports when present", () => {
    const output = runWithPath(`
      import { Button as LocalButton } from "@/components/ui/button";

      const Demo = () => <button>Save</button>;
    `);

    expect(output).toContain(
      'import { Button as LocalButton } from "@/components/ui/button";',
    );
    expect(output).toContain("<LocalButton>Save</LocalButton>");
    expect(output.split("@/components/ui/button").length - 1).toBe(1);
  });

  it("aliases when Button and ShadcnButton already exist", () => {
    const output = runWithPath(`
      const Button = () => null;
      const ShadcnButton = () => null;

      const Demo = () => <button>Save</button>;
    `);

    expect(output).toContain(
      'import { Button as ShadcnButton1 } from "@/components/ui/button";',
    );
    expect(output).toContain("<ShadcnButton1>Save</ShadcnButton1>");
  });

  it("keeps non-string input types on Input", () => {
    const output = runWithPath(`
      const Demo = () => <input type={inputType} />;
    `);

    expect(output).toContain("<Input type={inputType} />");
  });

  it("skips select with complex children or size/multiple", () => {
    const output = runWithPath(`
      const Demo = () => (
        <>
          <select size={2}>
            <option value="a">A</option>
          </select>
          <select multiple>
            <option value="b">B</option>
          </select>
          <select>
            <option value="c">C</option>
            {extra}
          </select>
        </>
      );
    `);

    expect(output).toContain("<select size={2}>");
    expect(output).toContain("<select multiple>");
    expect(output).toContain("{extra}");
  });

  it("preserves table imports when adding more table parts", () => {
    const output = runWithPath(`
      import { Table } from "@/components/ui/table";

      const Demo = () => (
        <table>
          <tbody>
            <tr>
              <td>Row</td>
            </tr>
          </tbody>
        </table>
      );
    `);

    expect(output).toContain("import { Table");
    expect(output).toContain("TableBody");
    expect(output).toContain("TableRow");
    expect(output).toContain("TableCell");
    expect(output.split("@/components/ui/table").length - 1).toBe(1);
  });

  it("ignores member expression elements", () => {
    const output = runWithPath(`
      const Demo = () => (
        <Foo.Bar>
          <button>Save</button>
        </Foo.Bar>
      );
    `);

    expect(output).toContain("<Foo.Bar>");
  });

  it("handles options without plain text", () => {
    const output = runWithPath(`
      const Demo = () => (
        <select>
          <option><span>Nested</span></option>
        </select>
      );
    `);

    expect(output).toContain("<SelectItem>");
    expect(output).not.toContain("value=");
  });

  it("keeps spread props on Select", () => {
    const output = runWithPath(`
      const Demo = () => (
        <select {...props}>
          <option value="a">A</option>
        </select>
      );
    `);

    expect(output).toContain("{...props}");
  });

  it("handles select options with placeholder, disabled, and selected", () => {
    const output = runWithPath(`
      const Demo = () => (
        <select defaultValue="a" onChange={handleChange}>
          <option value="">{"Pick one"}</option>
          <option value="a" disabled selected>
            Option A
          </option>
        </select>
      );
    `);

    expect(output).toContain('placeholder="Pick one"');
    expect(output).toContain('<SelectItem value="a" disabled>');
    expect(output).not.toContain("selected");
    expect(output).toContain("onValueChange={handleChange}");
  });

  it("adds a single radio TODO for adjacent radios", () => {
    const output = runWithPath(`
      const Demo = () => (
        <>
          <input type="radio" name="group" value="a" />
          <input type="radio" name="group" value="b" />
        </>
      );
    `);

    expect(output.match(/wrap radio siblings/g)?.length ?? 0).toBe(1);
  });
});
