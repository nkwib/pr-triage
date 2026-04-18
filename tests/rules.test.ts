import { describe, expect, it } from "vitest";
import { classifyPrFiles } from "../src/index.js";

/**
 * Targeted tests for edge cases and branches not fully exercised by the
 * fixture suite. These keep coverage >=95% and document behavior at the
 * boundaries of each rule.
 */

function classify(input: Parameters<typeof classifyPrFiles>[0]["files"][number]) {
  const [v] = classifyPrFiles({ files: [input] }).verdicts;
  if (!v) throw new Error("no verdict");
  return v;
}

describe("rule: rename-only", () => {
  it("does not fire when a rename has additions", () => {
    const v = classify({
      path: "src/a.ts",
      previousPath: "src/b.ts",
      changeType: "renamed",
      additions: 2,
      deletions: 0,
    });
    expect(v.verdict).toBe("review-candidate");
  });

  it("does not fire when a rename has deletions", () => {
    const v = classify({
      path: "src/a.ts",
      previousPath: "src/b.ts",
      changeType: "renamed",
      additions: 0,
      deletions: 2,
    });
    expect(v.verdict).toBe("review-candidate");
  });

  it("does not fire on non-rename changeType", () => {
    const v = classify({
      path: "src/a.ts",
      changeType: "modified",
      additions: 0,
      deletions: 0,
    });
    // falls through to default
    expect(v.ruleId).toBe("default");
  });
});

describe("rule: lockfile", () => {
  it("is case-insensitive on the filename", () => {
    const v = classify({
      path: "PNPM-LOCK.YAML",
      changeType: "modified",
      additions: 1,
      deletions: 1,
    });
    expect(v.ruleId).toBe("lockfile");
  });

  it("matches a lockfile nested deep in the repo", () => {
    const v = classify({
      path: "packages/backend/app/pnpm-lock.yaml",
      changeType: "modified",
      additions: 5,
      deletions: 5,
    });
    expect(v.ruleId).toBe("lockfile");
  });
});

describe("rule: generated-path", () => {
  it("matches dist at repo root", () => {
    const v = classify({
      path: "dist/index.js",
      changeType: "modified",
      additions: 1,
      deletions: 1,
    });
    expect(v.ruleId).toBe("generated-path");
  });

  it("matches nested .next/ cache", () => {
    const v = classify({
      path: "apps/web/.next/trace",
      changeType: "added",
      additions: 1,
      deletions: 0,
    });
    expect(v.ruleId).toBe("generated-path");
  });

  it("matches a suffix like .pb.ts", () => {
    const v = classify({
      path: "src/proto/orders.pb.ts",
      changeType: "modified",
      additions: 2,
      deletions: 2,
    });
    expect(v.ruleId).toBe("generated-path");
  });
});

describe("rule: binary", () => {
  it("matches a file with mixed case extension", () => {
    const v = classify({
      path: "assets/Logo.PNG",
      changeType: "modified",
      additions: 0,
      deletions: 0,
    });
    expect(v.ruleId).toBe("binary");
  });
});

describe("rule: prettier-only", () => {
  it("does not fire without a patch", () => {
    const v = classify({
      path: "src/x.ts",
      changeType: "modified",
      additions: 1,
      deletions: 1,
    });
    expect(v.ruleId).toBe("default");
  });

  it("does not fire when a hunk has only additions", () => {
    const v = classify({
      path: "src/x.ts",
      changeType: "modified",
      additions: 1,
      deletions: 0,
      patch: ["@@ -1,1 +1,2 @@", " a", "+b"].join("\n"),
    });
    expect(v.ruleId).toBe("default");
  });

  it("fires across multiple hunks when every hunk balances", () => {
    const v = classify({
      path: "src/multi.ts",
      changeType: "modified",
      additions: 2,
      deletions: 2,
      patch: [
        "@@ -1,1 +1,1 @@",
        "-const a=1;",
        "+const a = 1;",
        "@@ -10,1 +10,1 @@",
        "-const b=2;",
        "+const b = 2;",
      ].join("\n"),
    });
    expect(v.ruleId).toBe("prettier-only");
  });
});

describe("rule: import-reorder", () => {
  it("does not fire without a patch", () => {
    const v = classify({
      path: "src/x.ts",
      changeType: "modified",
      additions: 1,
      deletions: 1,
    });
    expect(v.ruleId).toBe("default");
  });

  it("treats 'use strict' as an import-region line (not a disqualifier)", () => {
    const v = classify({
      path: "src/x.js",
      changeType: "modified",
      additions: 2,
      deletions: 2,
      patch: [
        "@@ -1,4 +1,4 @@",
        "-'use strict';",
        '-import a from "a";',
        "+'use strict';",
        '+import a from "a";',
      ].join("\n"),
    });
    expect(v.ruleId).toBe("import-reorder");
  });

  it("does not fire when the only touched lines are comments/blanks (no meaningful imports changed)", () => {
    const v = classify({
      path: "src/x.ts",
      changeType: "modified",
      additions: 1,
      deletions: 1,
      patch: [
        "@@ -1,3 +1,3 @@",
        "-// old header",
        "+// new header",
        ' import a from "a";',
      ].join("\n"),
    });
    expect(v.ruleId).toBe("default");
  });

  it("does not fire when a non-import line is touched", () => {
    const v = classify({
      path: "src/x.ts",
      changeType: "modified",
      additions: 2,
      deletions: 1,
      patch: [
        "@@ -1,3 +1,4 @@",
        '-import a from "a";',
        '+import a from "a";',
        "+const x = doThing();",
        " export {};",
      ].join("\n"),
    });
    expect(v.ruleId).toBe("default");
  });

  it("does not fire when the set of imports changes", () => {
    const v = classify({
      path: "src/x.ts",
      changeType: "modified",
      additions: 2,
      deletions: 1,
      patch: [
        "@@ -1,2 +1,3 @@",
        '-import a from "a";',
        '+import a from "a";',
        '+import b from "b";',
        " export {};",
      ].join("\n"),
    });
    expect(v.ruleId).toBe("default");
  });

  it("does not fire on pure zero-op diff (all context)", () => {
    // no removed/added lines, only context
    const v = classify({
      path: "src/x.ts",
      changeType: "modified",
      additions: 0,
      deletions: 0,
      patch: ["@@ -1,1 +1,1 @@", ' import a from "a";'].join("\n"),
    });
    expect(v.ruleId).toBe("default");
  });
});

describe("rule: generated-header", () => {
  it("does not fire without a patch", () => {
    const v = classify({
      path: "src/x.ts",
      changeType: "modified",
      additions: 0,
      deletions: 0,
    });
    expect(v.ruleId).toBe("default");
  });

  it("matches 'autogenerated' (no hyphen)", () => {
    const v = classify({
      path: "src/thing.ts",
      changeType: "modified",
      additions: 1,
      deletions: 1,
      patch: [
        "@@ -1,3 +1,3 @@",
        "-// autogenerated header",
        "+// autogenerated header v2",
        " export {};",
      ].join("\n"),
    });
    expect(v.ruleId).toBe("generated-header");
  });
});

describe("rule: docs", () => {
  it("matches files in a doc/ (singular) directory", () => {
    const v = classify({
      path: "doc/architecture.txt",
      changeType: "modified",
      additions: 5,
      deletions: 1,
    });
    expect(v.ruleId).toBe("docs");
  });

  it("matches LICENSE without an extension", () => {
    const v = classify({
      path: "LICENSE",
      changeType: "modified",
      additions: 1,
      deletions: 1,
    });
    expect(v.ruleId).toBe("docs");
  });
});

describe("rule: config", () => {
  it("matches a .toml config file outside src/", () => {
    const v = classify({
      path: "pyproject.toml",
      changeType: "modified",
      additions: 2,
      deletions: 0,
    });
    expect(v.ruleId).toBe("config");
  });

  it("does NOT claim a .toml file under src/", () => {
    const v = classify({
      path: "src/data/config.toml",
      changeType: "modified",
      additions: 2,
      deletions: 0,
    });
    expect(v.ruleId).toBe("default");
  });
});

describe("rule: test", () => {
  it("matches files in a nested tests/ directory", () => {
    const v = classify({
      path: "packages/foo/tests/bar.ts",
      changeType: "modified",
      additions: 5,
      deletions: 0,
    });
    expect(v.ruleId).toBe("test");
  });
});

describe("default verdict", () => {
  it("applies to an unknown extension with no matching rule", () => {
    const v = classify({
      path: "src/main.hs",
      changeType: "modified",
      additions: 10,
      deletions: 2,
    });
    expect(v.verdict).toBe("review-candidate");
    expect(v.ruleId).toBe("default");
  });
});
