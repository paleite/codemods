import { createTransform } from "../lib/test-utils";
import { default as removePrefixes } from "./removePrefixes";

const transform = createTransform(removePrefixes);

describe("removePrefixes", () => {
  it("transforms enums to as const when all values are literals", () => {
    const { output } =
      transform(`export type TabProps = ExtractProps<typeof TwTab>;
    type TRequestErrorElement = { field?: string; message: IMessage };
    type IMessage = { code: Ti18nKey; text?: string };
    interface IChainable { mount: typeof mount; }
    export type TQRCodeResponse = QRCodeResponse;
    const TRequestErrorElement: TRequestErrorElement = { TRequestErrorElement: "test", message: { code: "test" } };
    export const IMessage: IMessage = { code: "test" } as IMessage;
    export type TUseQueryOptions<TQueryFnData = unknown> = Omit<TUnreferencedGeneric<TQueryFnData>, "queryKey">;`);

    expect(output).toMatchInlineSnapshot(`
      "export type TabProps = ExtractProps<typeof TwTab>;
          type RequestErrorElement = { field?: string; message: Message };
          type Message = { code: Ti18nKey; text?: string };
          interface Chainable { mount: typeof mount; }
          export type QRCodeResponse = QRCodeResponse;
          const TRequestErrorElement: RequestErrorElement = { TRequestErrorElement: "test", message: { code: "test" } };
          export const IMessage: Message = { code: "test" } as Message;
          export type UseQueryOptions<TQueryFnData = unknown> = Omit<TUnreferencedGeneric<TQueryFnData>, "queryKey">;"
    `);
  });
});
