import { describe, expect, it } from "vitest";
import { classifyPrFiles } from "../src/index.js";
import { fixtures } from "./fixtures/index.js";

describe("classifyPrFiles — fixture suite", () => {
  for (const fixture of fixtures) {
    it(`[${fixture.category}] ${fixture.id}: ${fixture.description}`, () => {
      const result = classifyPrFiles({ files: [fixture.input] });
      expect(result.verdicts).toHaveLength(1);
      const verdict = result.verdicts[0];
      if (!verdict) throw new Error("no verdict");
      expect(verdict.path).toBe(fixture.input.path);
      expect({
        verdict: verdict.verdict,
        ruleId: verdict.ruleId,
      }).toStrictEqual({
        verdict: fixture.expectedVerdict,
        ruleId: fixture.expectedRuleId,
      });
      expect(verdict.reason).toBeTypeOf("string");
      expect(verdict.reason.length).toBeGreaterThan(0);
    });
  }
});

describe("classifyPrFiles — aggregate properties", () => {
  const allResults = classifyPrFiles({ files: fixtures.map((f) => f.input) });

  it("preserves input order", () => {
    for (let i = 0; i < fixtures.length; i += 1) {
      const fixture = fixtures[i];
      const verdict = allResults.verdicts[i];
      if (!fixture || !verdict) throw new Error("index mismatch");
      expect(verdict.path).toBe(fixture.input.path);
    }
  });

  it("produces exactly one verdict per input file", () => {
    expect(allResults.verdicts).toHaveLength(fixtures.length);
  });

  it("every verdict is one of the three canonical values", () => {
    const allowed = new Set(["skip", "skim", "review-candidate"]);
    for (const v of allResults.verdicts) {
      expect(allowed.has(v.verdict)).toBe(true);
    }
  });

  it("every verdict carries a non-empty ruleId", () => {
    for (const v of allResults.verdicts) {
      expect(v.ruleId.length).toBeGreaterThan(0);
    }
  });

  it("handles an empty input", () => {
    expect(classifyPrFiles({ files: [] }).verdicts).toStrictEqual([]);
  });
});

describe("classifyPrFiles — elimination target", () => {
  it("eliminates at least 50% of fixtures via skip/skim (across categories)", () => {
    const result = classifyPrFiles({ files: fixtures.map((f) => f.input) });
    const eliminated = result.verdicts.filter(
      (v) => v.verdict === "skip" || v.verdict === "skim",
    ).length;
    const ratio = eliminated / result.verdicts.length;
    expect(ratio).toBeGreaterThanOrEqual(0.5);
  });
});
