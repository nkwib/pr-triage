/**
 * `@prcompass/pr-triage-filter` — deterministic PR file-triage filter.
 *
 * Zero runtime dependencies. Pure function. No I/O.
 *
 * Given the files in a pull request, classifies each file as
 * `skip | skim | review-candidate` so a reviewer's (or downstream LLM's)
 * attention lands where it matters.
 *
 * @packageDocumentation
 */

import { RULES, DEFAULT_VERDICT } from "./rules/index.js";

/**
 * Escalation verdict for a single file in a pull request.
 *
 * - `skip` — definitively ignorable (lockfiles, generated, binary, prettier-only, …)
 * - `skim` — likely low-risk but worth a glance (tests, config, docs)
 * - `review-candidate` — must be evaluated further (real source change)
 *
 * Note: this is an **escalation verdict**. Classifiers downstream of this
 * package (notably Tier 2 in PR Compass) use a different, final-reviewer
 * vocabulary (`review | skim | skip`). The two taxonomies intentionally
 * diverge.
 */
export type Verdict = "skip" | "skim" | "review-candidate";

/**
 * The kind of change GitHub reports for a file in a pull request.
 * Map GitHub's `status` field to one of these values before calling
 * `classifyPrFiles`.
 */
export type ChangeType = "added" | "modified" | "deleted" | "renamed";

/**
 * A single file in a pull request, described well enough for the filter to
 * classify it.
 */
export interface FileInput {
  /** Full repo-relative path in the new (or only) revision. */
  readonly path: string;
  /** Previous path when `changeType === "renamed"`. */
  readonly previousPath?: string;
  /** Kind of change (mapped from GitHub's `status` field). */
  readonly changeType: ChangeType;
  /** Number of lines added. */
  readonly additions: number;
  /** Number of lines deleted. */
  readonly deletions: number;
  /**
   * Unified-diff patch as GitHub returns it for this file (no `diff --git`
   * header, just hunks). Optional — several rules work without it.
   */
  readonly patch?: string;
}

/**
 * Input to `classifyPrFiles`. A list of files from one pull request.
 */
export interface ClassifyInput {
  readonly files: readonly FileInput[];
}

/**
 * Classification for one file.
 */
export interface FileVerdict {
  /** Path from the corresponding `FileInput`. */
  readonly path: string;
  readonly verdict: Verdict;
  /**
   * Stable identifier of the rule that produced this verdict. Safe to match
   * against in caller code; see the table in the README for the full list.
   */
  readonly ruleId: string;
  /** Short human-readable explanation. Not UI-stable across versions. */
  readonly reason: string;
}

/**
 * Result of classifying a whole pull request.
 */
export interface ClassifyResult {
  readonly verdicts: readonly FileVerdict[];
}

/**
 * Classify every file in a pull request.
 *
 * Pure, deterministic, zero I/O. Order of `input.files` is preserved in
 * `result.verdicts`.
 */
export function classifyPrFiles(input: ClassifyInput): ClassifyResult {
  if (input === null || typeof input !== "object") {
    throw new TypeError(
      "classifyPrFiles: expected an object with a `files` array, received " +
        (input === null ? "null" : typeof input),
    );
  }
  if (!Array.isArray(input.files)) {
    throw new TypeError(
      "classifyPrFiles: `input.files` must be an array of FileInput objects",
    );
  }
  const verdicts: FileVerdict[] = [];
  for (let i = 0; i < input.files.length; i += 1) {
    const file = input.files[i];
    if (file === null || typeof file !== "object") {
      throw new TypeError(
        `classifyPrFiles: input.files[${i}] must be a FileInput object`,
      );
    }
    verdicts.push(classifyOne(file));
  }
  return { verdicts };
}

function classifyOne(file: FileInput): FileVerdict {
  for (const rule of RULES) {
    const match = rule.evaluate(file);
    if (match !== null) {
      return {
        path: file.path,
        verdict: match.verdict,
        ruleId: rule.id,
        reason: match.reason,
      };
    }
  }
  return {
    path: file.path,
    verdict: DEFAULT_VERDICT.verdict,
    ruleId: DEFAULT_VERDICT.ruleId,
    reason: DEFAULT_VERDICT.reason,
  };
}
