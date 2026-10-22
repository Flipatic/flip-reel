# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/), and the project adheres to [SemVer](https://semver.org/).

## Unreleased

### Changed

- README rewritten; added Code of Conduct, support policy, issue forms, pull request
  template, Dependabot and OpenSSF Scorecard configuration.
- Package metadata: `author` and `keywords` updated.

## 0.2.1

### Changed

- Repository moved to [Flipatic/flip-reel](https://github.com/Flipatic/flip-reel); package
  `repository`, `homepage` and `bugs` links updated.

## 0.2.0

### Added

- Per-package READMEs: purpose, installation, minimal example.
- `llms.txt` and a ready-made Claude Code skill (`.claude/skills/flip-reel`) for AI-assisted
  integration.
- TSDoc on the entire public API of every package.
- API reference in `docs/reference`: options, events, elements, theming, adapters, feed
  format, core API.
- Typed DOM events: `addEventListener('flip-reel:*')` now infers `CustomEvent` details via a
  global `HTMLElementEventMap` augmentation; new `FlipReelEvent` and `FlipReelErrorScope` types.
- React binding: typed `event.detail` on all event props; new `onPlay`, `onPause`,
  `onAdRequested`, `onAdSkipped`, `onAdEmpty` props.

### Changed

- React binding: `onError` prop renamed to `onReelsError` — it clashed with React's native
  `onError` handler.

### Fixed

- `event.preventDefault()` on `flip-reel:readmore` (React: `onReadMore`) cancels opening the
  story link.

## 0.1.2

### Fixed

- Mouse wheel scrolls the player continuously, like a trackpad (including macOS-accelerated
  and high-resolution wheels).
- Active category pill fills the capsule ends when the category bar is scrolled.

### Added

- Source maps in published bundles.
- `pnpm release` script.

## 0.1.1

### Added

- Live demo link and an installation guide in the README.

### Changed

- Releases are published from CI via npm trusted publishing (OIDC) with provenance — no
  long-lived tokens.
- Toolchain: pnpm 10.

## 0.1.0

First public release.

### Added

- `@flipatic/flip-reel-core` — headless engine: config resolver, feed loading/normalization,
  player state machine, page-global `MediaScheduler`, state store.
- `@flipatic/flip-reel` — Lit web components (`flip-reel`, `flip-reel-rail`,
  `flip-reel-player`) with open Shadow DOM, design tokens, and `pl`/`en` i18n.
- `@flipatic/flip-reel-ad-gpt` — reference Google Ad Manager ad adapter.
- Ads run as a view-gated pre-roll overlay pulled out of the feed — an ad occupies every Nth
  viewed slide, counting from the opening story — with an `AdAdapter` contract for arbitrary
  ad code.
- Drop-in (`<flip-reel>`) and programmatic (`mount`) integration; framework demos for HTML,
  React, Vue, Nuxt, and Svelte.
