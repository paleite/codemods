# codemods

A set of jscodeshift transforms for common refactors.

## Running codemods

Run a transform against a directory:

```sh
pnpm exec jscodeshift --parser=tsx --extensions=tsx,ts \
  --transform ./src/form-member-children-prop-to-children.ts \
  /path/to/example-project/apps/web/src/
```

Run a transform across tracked files:

```sh
git ls-files -z "*.ts" "*.tsx" | xargs -0 pnpm exec jscodeshift \
  --parser=tsx --extensions=tsx,ts \
  --transform ./src/form-member-children-prop-to-children.ts
```

## Codemods

### `enum-to-as-const`

Converts enums to `as const` assertions.

```sh
git ls-files -z "*.ts" "*.tsx" | xargs -0 pnpm exec jscodeshift \
  --parser=ts --extensions=ts \
  --transform ./src/enum-to-as-const.ts
```

### `remove-prefixes`

Removes prefixes from types and interfaces that start with `I` or `T`.

```sh
git ls-files -z "*.ts" "*.tsx" | xargs -0 pnpm exec jscodeshift \
  --parser=ts --extensions=ts,tsx \
  --transform ./src/remove-prefixes.ts
```

### `form-member-children-prop-to-children`

Moves a `children` prop into real JSX children for any JSX member expression
ending in `.Field` or `.Subscribe`.

```sh
git ls-files -z "*.ts" "*.tsx" | xargs -0 pnpm exec jscodeshift \
  --parser=tsx --extensions=tsx,ts \
  --transform ./src/form-member-children-prop-to-children.ts
```
