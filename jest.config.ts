import { base } from "@paleite/jest-config";

export = {
  automock: false,
  clearMocks: true,
  coverageProvider: "v8",
  coverageReporters: ["text", "json-summary"],
  ...base,
};
