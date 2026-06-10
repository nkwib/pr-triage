// Post-build smoke test: import the *built* package entry point and assert the
// public API is present and callable. Catches build-output regressions (wrong
// `main`, missing export, broken ESM emit) that the source-level test suite
// cannot see because it runs against `src/`.
//
// Run with `npm run smoke` after `npm run build`.

import { strict as assert } from "node:assert";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const distEntry = fileURLToPath(new URL("../dist/index.js", import.meta.url));
assert.ok(existsSync(distEntry), `built entry not found at ${distEntry} — run the build first`);

const mod = await import(distEntry);

assert.equal(
  typeof mod.classifyPrFiles,
  "function",
  "dist/index.js does not export a callable `classifyPrFiles`",
);

const result = mod.classifyPrFiles({
  files: [
    { path: "pnpm-lock.yaml", changeType: "modified", additions: 10, deletions: 2 },
    { path: "src/pricing.ts", changeType: "modified", additions: 5, deletions: 1 },
  ],
});

assert.ok(Array.isArray(result.verdicts), "result.verdicts must be an array");
assert.equal(result.verdicts.length, 2, "expected one verdict per input file");
assert.equal(result.verdicts[0].ruleId, "lockfile", "lockfile should classify as `lockfile`");
assert.equal(result.verdicts[0].verdict, "skip", "lockfile should be `skip`");
assert.equal(result.verdicts[1].ruleId, "default", "plain source should fall through to `default`");

console.log("smoke: dist/index.js exports a working classifyPrFiles ✓");
