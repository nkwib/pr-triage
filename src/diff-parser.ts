/**
 * Minimal unified-diff parser for patches as GitHub returns them.
 *
 * Handles the `@@ -oldStart,oldCount +newStart,newCount @@` hunk headers and
 * the `-`, `+`, ` ` (space) line prefixes. Ignores `\ No newline at end of
 * file` markers.
 *
 * Not a general-purpose patch library — written to support Tier 1's
 * diff-level heuristics and nothing else.
 */

export interface Hunk {
  readonly oldStart: number;
  readonly oldCount: number;
  readonly newStart: number;
  readonly newCount: number;
  readonly removed: readonly string[];
  readonly added: readonly string[];
  readonly context: readonly string[];
  readonly touchedNewLines: readonly number[];
}

export interface ParsedDiff {
  readonly hunks: readonly Hunk[];
}

const HUNK_HEADER = /^@@\s+-(\d+)(?:,(\d+))?\s+\+(\d+)(?:,(\d+))?\s+@@/;

interface HunkAccumulator {
  oldStart: number;
  oldCount: number;
  newStart: number;
  newCount: number;
  removed: string[];
  added: string[];
  context: string[];
  touchedNewLines: number[];
  newLineCursor: number;
}

/**
 * Parse a unified diff (the `patch` field from GitHub). Best-effort: on any
 * malformed input, returns whatever was parsed before the bad bit.
 */
export function parseUnifiedDiff(patch: string): ParsedDiff {
  const hunks: Hunk[] = [];
  let current: HunkAccumulator | null = null;

  const finalize = () => {
    if (current !== null) {
      hunks.push({
        oldStart: current.oldStart,
        oldCount: current.oldCount,
        newStart: current.newStart,
        newCount: current.newCount,
        removed: current.removed,
        added: current.added,
        context: current.context,
        touchedNewLines: current.touchedNewLines,
      });
      current = null;
    }
  };

  for (const line of patch.split("\n")) {
    const header = HUNK_HEADER.exec(line);
    if (header !== null) {
      finalize();
      const oldCountRaw = header[2];
      const newCountRaw = header[4];
      const newStart = Number(header[3]);
      current = {
        oldStart: Number(header[1]),
        oldCount: oldCountRaw === undefined ? 1 : Number(oldCountRaw),
        newStart,
        newCount: newCountRaw === undefined ? 1 : Number(newCountRaw),
        removed: [],
        added: [],
        context: [],
        touchedNewLines: [],
        newLineCursor: newStart,
      };
      continue;
    }
    if (current === null) continue;
    if (line.startsWith("\\")) continue;
    if (line === "") continue;
    const prefix = line.charAt(0);
    const content = line.slice(1);
    if (prefix === "-") {
      current.removed.push(content);
    } else if (prefix === "+") {
      current.added.push(content);
      current.touchedNewLines.push(current.newLineCursor);
      current.newLineCursor += 1;
    } else if (prefix === " ") {
      current.context.push(content);
      current.newLineCursor += 1;
    } else {
      // any other prefix terminates the current hunk
      finalize();
    }
  }
  finalize();

  return { hunks };
}
