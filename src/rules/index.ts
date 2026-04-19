import type { FileInput, Verdict } from "../index.js";
import { pathBasedRules } from "./path-based.js";
import { contentBasedRules } from "./content-based.js";

/**
 * A rule evaluates one file and either returns a match (with verdict + reason)
 * or `null` to defer to later rules.
 */
export interface Rule {
  readonly id: string;
  readonly description: string;
  evaluate(file: FileInput): RuleMatch | null;
}

export interface RuleMatch {
  readonly verdict: Verdict;
  readonly reason: string;
}

/**
 * Registry — evaluated in order, first match wins.
 *
 * Ordering rationale:
 *   1. `rename-only` first because a rename with no content change is cheap
 *      to detect and trumps every path-based rule.
 *   2. Path-based rules next: they rely only on filename/extension and skip
 *      any need to inspect the patch.
 *   3. Content-based rules last: parsing the patch is the expensive step.
 *
 * Within each group, ordering is chosen so that more specific rules fire
 * before more general ones (e.g., lockfile before generated-path).
 */
export const RULES: readonly Rule[] = [...pathBasedRules, ...contentBasedRules];

/**
 * Fallback when no rule fires. Exposed separately so the main `classifyOne`
 * function in `index.ts` can surface the same shape as a rule match.
 */
export const DEFAULT_VERDICT = {
  verdict: "review-candidate" as const,
  ruleId: "default",
  reason: "Production source code outside tests, docs, and config paths.",
} as const;
