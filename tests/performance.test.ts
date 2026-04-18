import { describe, expect, it } from "vitest";
import { classifyPrFiles, type FileInput } from "../src/index.js";

/**
 * The Tier 1 filter must classify a 100-file PR in under 500ms on commodity
 * hardware. This test fails the build if we regress past that budget.
 */
function buildLargePr(fileCount: number): readonly FileInput[] {
  const files: FileInput[] = [];
  const patchWithImports = [
    "@@ -1,4 +1,4 @@",
    '-import { a } from "a";',
    '-import { b } from "b";',
    '+import { b } from "b";',
    '+import { a } from "a";',
    " ",
    " export {};",
  ].join("\n");
  const patchWithLogic = [
    "@@ -1,4 +1,6 @@",
    " export function f(x: number) {",
    "-  return x * 2;",
    "+  const y = x * 2;",
    "+  const z = y + 1;",
    "+  return z;",
    " }",
  ].join("\n");

  for (let i = 0; i < fileCount; i += 1) {
    const kind = i % 10;
    if (kind === 0) {
      files.push({
        path: `pnpm-lock.yaml`,
        changeType: "modified",
        additions: 50,
        deletions: 20,
      });
    } else if (kind === 1) {
      files.push({
        path: `dist/bundle-${i}.js`,
        changeType: "modified",
        additions: 10,
        deletions: 10,
      });
    } else if (kind === 2) {
      files.push({
        path: `assets/icon-${i}.png`,
        changeType: "modified",
        additions: 0,
        deletions: 0,
      });
    } else if (kind === 3) {
      files.push({
        path: `src/renamed-${i}.ts`,
        previousPath: `src/old-${i}.ts`,
        changeType: "renamed",
        additions: 0,
        deletions: 0,
      });
    } else if (kind === 4) {
      files.push({
        path: `src/reorder-${i}.ts`,
        changeType: "modified",
        additions: 2,
        deletions: 2,
        patch: patchWithImports,
      });
    } else if (kind === 5) {
      files.push({
        path: `src/${i}.test.ts`,
        changeType: "modified",
        additions: 5,
        deletions: 1,
      });
    } else if (kind === 6) {
      files.push({
        path: `config/settings-${i}.json`,
        changeType: "modified",
        additions: 1,
        deletions: 1,
      });
    } else if (kind === 7) {
      files.push({
        path: `docs/section-${i}.md`,
        changeType: "modified",
        additions: 5,
        deletions: 2,
      });
    } else {
      files.push({
        path: `src/feature-${i}.ts`,
        changeType: "modified",
        additions: 3,
        deletions: 1,
        patch: patchWithLogic,
      });
    }
  }
  return files;
}

describe("performance", () => {
  it("classifies a 100-file PR in under 500ms", () => {
    const files = buildLargePr(100);
    // warm-up — first run pays JIT + module-graph costs
    classifyPrFiles({ files });
    const start = performance.now();
    const result = classifyPrFiles({ files });
    const elapsed = performance.now() - start;
    expect(result.verdicts).toHaveLength(100);
    expect(elapsed).toBeLessThan(500);
  });

  it("scales at least to 500 files without catastrophic slowdown", () => {
    const files = buildLargePr(500);
    const start = performance.now();
    const result = classifyPrFiles({ files });
    const elapsed = performance.now() - start;
    expect(result.verdicts).toHaveLength(500);
    // allow up to 5x the 100-file budget for 5x the work
    expect(elapsed).toBeLessThan(2500);
  });
});
