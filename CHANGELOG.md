# Changelog

All notable changes to `@prcompass/pr-triage-filter` will be documented in
this file. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-06-10

Classifier accuracy pass. Some files that previous versions demoted to
`skip`/`skim` are now correctly surfaced as `review-candidate`, so verdicts
can change for existing inputs — hence a minor version bump.

### Fixed

- **`docs` rule no longer demotes real source files with a doc-like stem.** The
  rule previously stripped any extension to a stem and matched it against the
  document filenames (`security`, `license`, `notice`, `authors`, …), so
  `src/security.ts`, `src/license.ts`, `src/notice.ts`, and `src/authors.ts`
  were wrongly classified as `skim (docs)`. The stem match now fires only for
  extensionless files (`LICENSE`, `AUTHORS`) and prose-text extensions
  (`.md`, `.mdx`, `.markdown`, `.txt`, `.rst`, `.adoc`). Source files now
  correctly escalate to `review-candidate`.
- **`generated-path` no longer skips real source under collision-prone
  directory names.** The collision-prone names `target` and `out` previously
  matched as any path segment, silently skipping `packages/target/src/index.ts`
  and `src/out/index.ts`. They now match **only at the repository root**, so
  Rust's `target/` and a top-level build `out/` are still skipped while nested
  source files are not. Distinctive names (`dist/`, `build/`, `coverage/`,
  `.next/`, …) keep matching anywhere. See "Accepted false positives" in the
  README for the trade-off.
- **`generated-header` no longer fires on unchanged context lines.** The rule
  buffered both added (`+`) and context (` `) lines, so a real hand-written
  edit to a file carrying an unchanged "do not edit" banner was misclassified
  as `skip (generated-header)`. The scan now considers **added lines only**; a
  newly generated file whose added content includes the banner still matches.

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
