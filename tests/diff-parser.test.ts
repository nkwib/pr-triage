import { describe, expect, it } from "vitest";
import { parseUnifiedDiff } from "../src/diff-parser.js";

describe("parseUnifiedDiff", () => {
  it("returns empty hunks for empty input", () => {
    expect(parseUnifiedDiff("").hunks).toStrictEqual([]);
  });

  it("returns empty hunks when no hunk header is present", () => {
    expect(parseUnifiedDiff("not a diff").hunks).toStrictEqual([]);
  });

  it("parses a single-hunk diff with added/removed/context lines", () => {
    const patch = [
      "@@ -1,3 +1,3 @@",
      " unchanged",
      "-old",
      "+new",
      " also unchanged",
    ].join("\n");
    const { hunks } = parseUnifiedDiff(patch);
    expect(hunks).toHaveLength(1);
    const hunk = hunks[0];
    if (!hunk) throw new Error();
    expect(hunk.oldStart).toBe(1);
    expect(hunk.oldCount).toBe(3);
    expect(hunk.newStart).toBe(1);
    expect(hunk.newCount).toBe(3);
    expect(hunk.removed).toStrictEqual(["old"]);
    expect(hunk.added).toStrictEqual(["new"]);
    expect(hunk.context).toStrictEqual(["unchanged", "also unchanged"]);
  });

  it("parses multiple hunks", () => {
    const patch = [
      "@@ -1,2 +1,2 @@",
      "-a",
      "+A",
      " z",
      "@@ -10,1 +10,1 @@",
      "-b",
      "+B",
    ].join("\n");
    const { hunks } = parseUnifiedDiff(patch);
    expect(hunks).toHaveLength(2);
    expect(hunks[0]?.removed).toStrictEqual(["a"]);
    expect(hunks[1]?.removed).toStrictEqual(["b"]);
  });

  it("defaults oldCount/newCount to 1 when the header omits them", () => {
    const patch = ["@@ -5 +5 @@", "-x", "+y"].join("\n");
    const { hunks } = parseUnifiedDiff(patch);
    expect(hunks[0]?.oldCount).toBe(1);
    expect(hunks[0]?.newCount).toBe(1);
  });

  it("ignores `\\ No newline at end of file` markers", () => {
    const patch = [
      "@@ -1,1 +1,1 @@",
      "-old",
      "\\ No newline at end of file",
      "+new",
      "\\ No newline at end of file",
    ].join("\n");
    const { hunks } = parseUnifiedDiff(patch);
    expect(hunks[0]?.removed).toStrictEqual(["old"]);
    expect(hunks[0]?.added).toStrictEqual(["new"]);
  });

  it("terminates a hunk on an unexpected prefix", () => {
    const patch = [
      "@@ -1,2 +1,2 @@",
      "-a",
      "+A",
      "ZZ something outside diff format",
      "@@ -10,1 +10,1 @@",
      "-b",
      "+B",
    ].join("\n");
    const { hunks } = parseUnifiedDiff(patch);
    // first hunk ends when ZZ line appears; second hunk still parsed
    expect(hunks).toHaveLength(2);
    expect(hunks[0]?.removed).toStrictEqual(["a"]);
    expect(hunks[1]?.removed).toStrictEqual(["b"]);
  });

  it("tracks touchedNewLines for added lines", () => {
    const patch = ["@@ -1,3 +10,5 @@", " a", "+NEW1", " b", "+NEW2", " c"].join("\n");
    const { hunks } = parseUnifiedDiff(patch);
    // new-file layout: a(10), NEW1(11), b(12), NEW2(13), c(14)
    expect(hunks[0]?.touchedNewLines).toStrictEqual([11, 13]);
  });
});
