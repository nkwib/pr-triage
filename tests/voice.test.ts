/**
 * Cross-rule voice consistency test.
 *
 * The Tier 1 rule-firing reasons are rendered user-facing text in the
 * PR Compass sticky-comment brief. They must match the voice style
 * shared with the Tier 2 classification prompt:
 *
 *   - declarative, concrete, content-actionable where possible
 *   - not tautological with the filename or extension
 *   - no metadata voice ("file matches pattern X", "rule Y fired")
 *
 * This test sweeps every fixture through the classifier and scans the
 * produced reason strings with regexes that catch common metadata-voice
 * phrasings. If a future rule author defaults back to "file matches
 * pattern X" phrasing, the test fires.
 *
 * The forbidden patterns were curated from the first live run on
 * 2026-04-19 where the initial Tier 1 reasons leaked through as
 * tautological prose in the brief — see fix in the same commit range
 * where this test lands.
 */

import { describe, expect, it } from "vitest";

import { classifyPrFiles } from "../src/index.js";
import { fixtures } from "./fixtures/index.js";

// Tier 1 rule reasons must avoid two overlapping voices:
//
//   1. Metadata / debugging voice — "file matches X", "rule fired",
//      tautological "test file (.test. in filename)". These leaked
//      into the first live sandbox brief (see commit history for
//      M5 iteration 1).
//   2. Prescriptive voice (active, passive, or euphemistic) — a reason
//      must describe the code, not direct the reviewer. The two rule
//      sets used to live behind the `@prcompass/prompts` workspace
//      package; that package is not published, so the Tier 1 patterns
//      are vendored here. Tier 2 (in PR Compass) keeps its own copy;
//      drift between the two is acceptable so long as the Tier 1
//      reasons stay declarative.
const METADATA_VOICE_PATTERNS: ReadonlyArray<readonly [string, RegExp]> = [
  ["'file matches' metadata voice", /file matches/i],
  ["'pattern matched' metadata voice", /pattern matched/i],
  ["'rule fired' debugging voice", /rule fired/i],
  ["tautological test-file explanation", /\.(test|spec)\.?\s*(in filename|pattern)/i],
  ["tautological 'file type detected'", /file type detected/i],
  ["'file lives in' without content value (bare)", /^file lives in/i],
];

// Vendored from the (unpublished) `@prcompass/prompts` package.
// Catches reviewer-directing prose: imperatives ("please review",
// "make sure"), passive prescriptions ("should be reviewed"), and
// euphemistic prescriptions ("worth a look", "consider reviewing").
const VOICE_LEAK_PATTERNS: ReadonlyArray<readonly [string, RegExp]> = [
  ["imperative 'please' voice", /\bplease\s+(review|check|verify|inspect|look)\b/i],
  ["imperative 'make sure' voice", /\bmake sure\b/i],
  ["passive 'should be reviewed' voice", /\bshould be (reviewed|checked|verified|inspected)\b/i],
  ["euphemistic 'worth a look' voice", /\bworth (a look|reviewing|checking)\b/i],
  ["euphemistic 'consider reviewing' voice", /\bconsider (reviewing|checking|inspecting)\b/i],
  ["second-person 'you should' voice", /\byou (should|must|need to)\b/i],
];

const FORBIDDEN_PATTERNS = [
  ...METADATA_VOICE_PATTERNS,
  ...VOICE_LEAK_PATTERNS,
] as const;

describe("Tier 1 rule reasons — reviewer-facing voice", () => {
  const allReasons = classifyPrFiles({
    files: fixtures.map((f) => f.input),
  }).verdicts.map((v) => v.reason);

  it.each(FORBIDDEN_PATTERNS)(
    "no fixture produces a reason matching anti-pattern: %s",
    (_label, regex) => {
      for (const reason of allReasons) {
        expect(reason).not.toMatch(regex);
      }
    },
  );

  it("every reason is a declarative sentence ending in '.' (or a period-equivalent)", () => {
    // Reviewer-facing prose: sentence punctuation. Rule of thumb — if
    // the reason reads like a field label ("Binary asset") rather than
    // a sentence, it's metadata voice. We require a terminator so a
    // reason that reads "Configuration file" gets flagged by the
    // stricter test without needing its own regex.
    for (const reason of allReasons) {
      expect(reason.trim()).toMatch(/[.!?)]$/);
    }
  });

  it("every reason is at most 20 words (reviewer scans, not reads)", () => {
    // Tier 2's prompt caps reasons at 25 words. Tier 1 is more
    // constrained: its reasons are rule-bound and shouldn't need more
    // than 20 words to describe why the rule fired.
    for (const reason of allReasons) {
      const wordCount = reason.split(/\s+/).filter(Boolean).length;
      expect(wordCount).toBeLessThanOrEqual(20);
    }
  });
});
