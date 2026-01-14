import { createTransform } from "../lib/test-utils";
import nativeToShadcn from "./native-to-shadcn";

const transform = createTransform(nativeToShadcn, {}, "tsx");

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
});
