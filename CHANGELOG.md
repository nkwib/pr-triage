# Changelog

All notable changes to `@prcompass/pr-triage-filter` will be documented in
this file. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] — 2026-05-06

Initial public release.

### Added

- `classifyPrFiles(input)` — deterministic PR file-triage filter.
- Runtime input validation: clear `TypeError` for null/non-object input,
  non-array `files`, or non-object array elements (with index in message).

### Fixed

- Standalone build: `tsconfig.json` no longer extends a missing monorepo base
  file; strict TypeScript options are now inlined.
- `generatedHeader` rule no longer rebuilds the joined-content string inside the
  scan loop (was O(n²) string allocation on long files).
- Repository URL in `package.json` now points at `github.com/nkwib/pr-triage`.
- README license/Node-version/CI claims aligned with `package.json` and reality.
- Removed broken `lint` and `bench` scripts (no eslint config; no `*.bench.ts`
  files).
