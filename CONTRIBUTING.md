# Contributing to FlipReel

Thanks for helping. This guide covers how to report problems, propose changes and get a pull
request merged.

## Ways to help

- **Report a bug** with the [bug form](https://github.com/Flipatic/flip-reel/issues/new?template=bug_report.yml).
  A minimal feed and the browser/device you used save a lot of back-and-forth.
- **Ask a question or share an integration** in
  [Discussions](https://github.com/Flipatic/flip-reel/discussions), not in issues.
- **Pick up an issue** labelled
  [`good first issue`](https://github.com/Flipatic/flip-reel/labels/good%20first%20issue) or
  [`help wanted`](https://github.com/Flipatic/flip-reel/labels/help%20wanted). Comment on it
  first so two people do not work on the same thing.
- **Write an adapter** for your ad server, feed source or state store. Adapters can live in
  your own package; you do not need permission. Tell us in Discussions and we will link it.

For larger changes (new options, new events, changes to adapter contracts) open an issue or a
discussion before writing code. Adapter contracts, events, attributes and widget dimensions are
public API and follow semver.

## Setup

Requirements: Node 20+ and pnpm 10 (`corepack enable` installs the pinned version).

```bash
pnpm install
pnpm build
pnpm --filter @flipatic/flip-reel-demo dev
```

The repo is a pnpm + Turborepo monorepo:

| Path                   | What lives there                                       |
| ---------------------- | ------------------------------------------------------ |
| `packages/core`        | Headless engine, pure TypeScript, no DOM               |
| `packages/reels`       | Lit web components and the published bundles           |
| `packages/ad-gpt`      | Google Ad Manager reference adapter                    |
| `packages/react`       | React bindings (not published yet)                     |
| `packages/demo-shared` | Demo feed and house ad shared by the demo apps         |
| `apps/*`               | Demo pages for plain HTML, React, Vue, Nuxt and Svelte |

Read [docs/architecture.md](docs/architecture.md) before changing playback, ads or the media
scheduler.

## Code style

- TypeScript, formatted with Prettier (`pnpm format`).
- No comments in source files: names and structure carry the meaning. Public API is documented
  with TSDoc on exports.
- English only in code.
- Target 100-200 lines per file; refactor files above 300 lines. Functions under 50 lines.
- Name units by role (`PlayerController`, `FeedLoader`), never `Helper`, `Utils` or `Manager`.
- Never render feed data with `innerHTML`; let Lit escape it.
- Keep the widget bundle under the 30 KB gzip budget. A new runtime dependency needs a strong
  reason in the PR description.

## Before you push

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

CI runs the same commands. A change is not done while any of them fails.

## Branches, commits and pull requests

- Short-lived `feat/*`, `fix/*` or `docs/*` branches off `main`.
- [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`,
  `chore:`, `test:`, `build:`.
- Fill in the pull request template. Add tests for behavior changes in `core`.
- If the change is user-visible, add a line under `## Unreleased` in
  [CHANGELOG.md](CHANGELOG.md).
- Maintainers squash-merge once CI is green and one maintainer has approved.

## Releasing (maintainers)

Rename `## Unreleased` in [CHANGELOG.md](CHANGELOG.md) to `## x.y.z`, then run:

```bash
pnpm release patch   # or minor, major, x.y.z
```

`scripts/release.mjs` bumps every workspace version, the runtime version constant and the README
install snippet, runs lint, typecheck, tests and build, and creates the `chore: release x.y.z`
commit with a `vx.y.z` tag. It never pushes. Review, then
`git push origin main && git push origin vx.y.z`. The tag push triggers the release workflow,
which publishes the public packages to npm through trusted publishing with provenance. Create a
GitHub Release for the tag with the changelog section as notes.

## Code of Conduct

This project follows the [Contributor Covenant 2.1](CODE_OF_CONDUCT.md). By participating you
agree to uphold it.

## License

By contributing you agree that your contributions are licensed under the
[Apache License 2.0](LICENSE).
