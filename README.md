# @prcompass/pr-triage-filter

Deterministic filter that classifies pull request files as `skip | skim |
review-candidate`. Pure TypeScript — **no LLM, no network, no I/O beyond
what the caller provides**. Designed to cut 50–70% of files from the review
attention budget before any AI or human looks at them.

Extracted from [PR Compass](https://github.com/prcompass/prcompass), the
anti-autonomous code-review preparation tool. Published under MIT so any
review pipeline can use it independently.

## Status

Milestone 0 of PR Compass scaffolds the package surface. The rule registry
and fixture suite land in Milestone 1. **Do not depend on the public API
until 1.0.0.**

## Design principles

1. **Zero runtime deps.** No axios, no lodash, no framework.
2. **Fast.** Target: classify a 100-file PR in <500ms.
3. **Explicable.** Every verdict carries a `ruleId` and a human-readable reason.
4. **No heuristics that require LLM context.** If a decision needs semantic
   understanding, escalate with `review-candidate` — don't guess.

## Install (once published)

```bash
npm install @prcompass/pr-triage-filter
```

## Usage (preview)

```typescript
import { classifyFiles } from "@prcompass/pr-triage-filter";

const verdicts = classifyFiles([
  {
    path: "pnpm-lock.yaml",
    changeType: "modified",
    additions: 120,
    deletions: 45,
  },
]);
```

## License

MIT. See [LICENSE](./LICENSE).
