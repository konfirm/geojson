# Contributing

Bug reports, feature requests, and pull requests are welcome.

## Getting started

```sh
git clone https://github.com/konfirm/geojson.git
cd geojson
npm ci
```

## Development commands

| Command | What it does |
|---|---|
| `npm test` | Unit + integration tests |
| `npm run test:coverage` | Tests with coverage report |
| `npm run test:geodesic` | Stream 500 000 GeodTest.dat cases against Karney (slow, not part of `npm test`) |
| `npm run check` | Lint + format check (Biome) |
| `npm run check:write` | Lint + format, applying fixes |
| `npm run build` | Compile to `dist/` |

CI runs `npm test` on Node 22 and 24, Ubuntu and macOS. A PR must pass all four matrix jobs.

## Commits

This repository uses [Conventional Commits](https://www.conventionalcommits.org/). Husky enforces the format on commit — `feat:`, `fix:`, `docs:`, `chore:`, `test:`, etc. Non-conforming commits are rejected locally.

## Test stack

Tests use Node's built-in [`node:test`](https://nodejs.org/api/test.html) runner with [`node:assert/strict`](https://nodejs.org/api/assert.html) — not Jest, Vitest, or any other framework. If you're used to `expect(...).toBe(...)`, the equivalent here is `assert.strictEqual(...)`. Coverage is measured by [`odz`](https://www.npmjs.com/package/one-double-zero) (one-double-zero), which wraps the native V8 coverage.

The choice is deliberate: no test framework in `devDependencies` means one fewer thing to update, audit, or break. The built-in runner does everything needed for this library.

## Pull requests

- One concern per PR. If you're fixing a bug and notice something else, open a separate issue.
- Tests are required for bug fixes (add a case that fails before your fix) and new features.
- Coverage is tracked — aim to keep it at 100% statements/branches/lines where achievable. For new code that has genuinely unreachable paths, follow the pattern already used in `Geodesic.ts`: comment out the branch with a note explaining why it's unreachable and how to restore it.
- Biome handles formatting. Run `npm run check:write` before pushing.

## Reporting a vulnerability

See [SECURITY.md](./SECURITY.md).
