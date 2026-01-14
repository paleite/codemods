import { base } from "@paleite/jest-config";

export = {
  automock: false,
  clearMocks: true,
  coverageProvider: "v8",
  coverageReporters: [
    "text",
    "json-summary",
    // "html"
  ],
  ...base,
  coveragePathIgnorePatterns: ["<rootDir>/lib/test-utils.ts"],
};
