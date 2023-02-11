# codemods

# `enum-to-as-const`

This codemod converts enums to `as const` assertions.

```sh
git ls-files -z "*.ts" "*.tsx" | xargs -0 node node_modules/.bin/jscodeshift -t src/enum-to-as-const.ts --parser=ts
```
