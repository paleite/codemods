module.exports = {
  root: true,
  extends: ["@paleite"],
  parserOptions: {
    project: ["./tsconfig.json", "./tsconfig.eslint.json"],
    tsconfigRootDir: __dirname,
  },
  rules: {
    "import/no-unused-modules": [
      "error",
      {
        unusedExports: true,
        missingExports: false,
        src: ["src/**/*.ts"],
        ignoreExports: ["src/*.ts"],
      },
    ],
  },
};
