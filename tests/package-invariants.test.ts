import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * Build-fails-if-a-dependency-is-added invariant.
 *
 * The package's headline promise is **zero runtime dependencies**. This test
 * fails the build the moment a runtime dependency is introduced, keeping the
 * promise true rather than merely documented.
 */
const packageJsonPath = fileURLToPath(new URL("../package.json", import.meta.url));
const pkg = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
  dependencies?: Record<string, string>;
};

describe("package invariants", () => {
  it("declares no runtime dependencies", () => {
    const deps = pkg.dependencies ?? {};
    expect(Object.keys(deps)).toStrictEqual([]);
  });
});
