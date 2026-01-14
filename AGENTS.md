# Repository Guidelines

## Project Structure & Module Organization

- `src/` contains the codemods and their tests (e.g. `src/enum-to-as-const.ts`, `src/enum-to-as-const.test.ts`).
- `lib/` holds shared helpers such as test utilities (`lib/test-utils.ts`).
- `dist/` is the build output from `tsup` and is what `node dist` runs.
- `coverage/` stores Jest coverage artifacts.

## Build, Test, and Development Commands

- `pnpm run build` builds TypeScript into `dist/` via `tsup`.
- `pnpm run test` runs Jest with coverage.
- `pnpm run test:ci` runs CI-flavored tests and writes `coverage.txt`.
- `pnpm run lint` runs ESLint for `.js/.ts/.tsx`.
- `pnpm run format` formats the repo with Prettier.
- `pnpm run typecheck` runs `tsc` against `tsconfig.json`.
- Example codemod run:
  ```sh
  git ls-files -z "*.ts" "*.tsx" | xargs -0 node node_modules/.bin/jscodeshift -t src/enum-to-as-const.ts --parser=ts
  ```

## Coding Style & Naming Conventions

- Use TypeScript throughout; keep codemod names kebab-case (e.g. `remove-prefixes.ts`).
- Formatting is enforced by Prettier via `@paleite/prettier-config`.
- Linting uses ESLint with shared `@paleite/*` configs; run `pnpm run lint`.
- For staged files, `lint-staged` runs Prettier and `pnpm run typecheck`.

## Testing Guidelines

- Tests live alongside codemods in `src/` as `*.test.ts`.
- Jest is the test runner; coverage is required (`pnpm run test`).
- Prefer focused unit tests that validate input/output transformations.

## Commit & Pull Request Guidelines

- Recent history shows short, imperative commit subjects (e.g. “Support imports”).
- Keep commits scoped to one codemod or tooling change.
- PRs should include a summary, test command results, and example input/output when changing codemods.

## Security & Configuration Tips

- Codemods can be destructive; run them on a clean branch and review diffs.
- Node engine support is `^14.17.0 || >= 16.0.0` and the package manager is `pnpm@7.29.1`.
