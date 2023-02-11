/// <reference types="jscodeshift" />

declare module "jscodeshift/dist/testUtils" {
  // applyTransform
  export function applyTransform(
    module: Transform,
    options: Options,
    input: FileInfo,
    testOptions = {}
  ): string;

  // defineInlineTest
  export function defineInlineTest(
    module: Transform,
    options: Options,
    input: string,
    expectedOutput: string,
    testName: string
  ): void;

  // defineSnapshotTest

  // defineSnapshotTestFromFixture

  // defineTest
  export function defineTest(
    dirName: string,
    transformName: string,
    options: Options | null,
    testFilePrefix?: string,
    testOptions: Options
  ): void;

  // runInlineTest
  export function runInlineTest(
    module: Transform,
    options: Options,
    input: FileInfo,
    expectedOutput: string,
    testOptions: Options
  ): void;

  // runSnapshotTest

  // runTest
}
