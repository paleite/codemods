import { createTransform } from "../lib/test-utils";
import { default as removePrefixes } from "./remove-prefixes";

const transform = createTransform(removePrefixes);

describe("removePrefixes", () => {
  it("removes prefixes from types", () => {
    const { output } =
      transform(`import { IReferencedGeneric as TReferencedGeneric } from "some-module";
    export type TabProps = ExtractProps<typeof TwTab>;
    export type TIsNotPrefixed = ExtractProps<typeof TwTab>;
    export type ITsPrefixed = ExtractProps<typeof TwTab>;
    type TRequestErrorElement = { field?: string; message: IMessage };
    type IMessage = { code: Ti18nKey; text?: string };
    interface IChainable { mount: typeof mount; }
    interface Interwebs { mount: typeof mount; }
    export type TQRCodeResponse = QRCodeResponse;
    const TRequestErrorElement: TRequestErrorElement = { TRequestErrorElement: "test", message: { code: "test" } };
    export const IMessage: IMessage = { code: "test" } as IMessage;
    export type TUseQueryOptions<TQueryFnData = unknown> = Omit<TUnreferencedGeneric<TReferencedGeneric<TQueryFnData>>, "queryKey">;`);

    expect(output).toMatchInlineSnapshot(`
      "import { ReferencedGeneric as ReferencedGeneric } from "some-module";
          export type TabProps = ExtractProps<typeof TwTab>;
          export type IsNotPrefixed = ExtractProps<typeof TwTab>;
          export type TsPrefixed = ExtractProps<typeof TwTab>;
          type RequestErrorElement = { field?: string; message: Message };
          type Message = { code: Ti18nKey; text?: string };
          interface Chainable { mount: typeof mount; }
          interface Interwebs { mount: typeof mount; }
          export type QRCodeResponse = QRCodeResponse;
          const TRequestErrorElement: RequestErrorElement = { TRequestErrorElement: "test", message: { code: "test" } };
          export const IMessage: Message = { code: "test" } as Message;
          export type UseQueryOptions<TQueryFnData = unknown> = Omit<TUnreferencedGeneric<ReferencedGeneric<TQueryFnData>>, "queryKey">;"
    `);
  });

  it("removes prefixes from interfaces", () => {
    const { output } = transform(`export type IRequestError = {};
    export interface IResponseError {};
    export class SomeClass extends Error implements IRequestError, IResponseError {}`);
    expect(output).toMatchInlineSnapshot(`
      "export type RequestError = {};
          export interface ResponseError {};
          export class SomeClass extends Error implements RequestError, ResponseError {}"
    `);
  });

  it("removes prefixes from exports", () => {
    const { output } = transform(`type IRequestError = {};
    export interface IResponseError {};
    export class SomeClass extends Error implements IRequestError, IResponseError {}
    export class SomeClass2 implements IRequestError, IResponseError {}

export { IRequestError as TRequestErrorConstructor }`);
    expect(output).toMatchInlineSnapshot(`
      "type RequestError = {};
          export interface ResponseError {};
          export class SomeClass extends Error implements RequestError, ResponseError {}
          export class SomeClass2 implements RequestError, ResponseError {}

      export { RequestError as RequestErrorConstructor }"
    `);
  });

  it("removes prefixes from imports", () => {
    const { output } =
      transform(`import type { TUseQueryOptions } from "../types";
    import type { IUseQueryOptions as TUseQueryOptions2 } from "../types";

    import { TUseQueryOptions3 } from "../types";
    import { IUseQueryOptions as TUseQueryOptions4 } from "../types";`);
    expect(output).toMatchInlineSnapshot(`
      "import type { UseQueryOptions } from "../types";
          import type { UseQueryOptions as UseQueryOptions2 } from "../types";

          import { UseQueryOptions3 } from "../types";
          import { UseQueryOptions as UseQueryOptions4 } from "../types";"
    `);
  });
});
