/**
 * @prcompass/pr-triage-filter
 *
 * Deterministic, LLM-free classifier for PR files. Public API stable from
 * Milestone 1 onward. Zero runtime dependencies, zero network I/O.
 *
 * This package is published to npm under MIT. Do not import from private
 * PR Compass packages here — keep the public surface self-contained.
 *
 * Milestone 0: placeholder types exported. Real rule registry, AST-level
 * no-op detection, and test fixtures land in Milestone 1.
 */

/**
 * The escalation verdict. Tier 1 decides whether a file even reaches an LLM.
 *
 * - `skip` — definitively ignorable (lockfiles, generated code, minified bundles)
 * - `skim` — likely low-risk but needs a second opinion
 * - `review-candidate` — must be evaluated further (Tier 2 / human reviewer)
 *
 * This is NOT the same enum as `annotate-corpus`'s final-verdict enum. Tier 1's
 * verdict is an escalation decision; annotate-corpus's is a reviewer-facing
 * recommendation. The two intentionally diverge.
 */
export type Verdict = "skip" | "skim" | "review-candidate";

/**
 * Input describing a single file in a pull request.
 */
export interface FileInput {
  readonly path: string;
  readonly changeType: "added" | "modified" | "deleted" | "renamed";
  readonly previousPath?: string;
  readonly additions: number;
  readonly deletions: number;
  readonly patch?: string;
}

/**
 * Per-file classification result.
 */
export interface FileVerdict {
  readonly path: string;
  readonly verdict: Verdict;
  readonly reason: string;
  readonly ruleId: string;
}
