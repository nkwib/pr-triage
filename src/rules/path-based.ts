import type { Rule } from "./index.js";

const LOCKFILES: readonly string[] = [
  "pnpm-lock.yaml",
  "package-lock.json",
  "npm-shrinkwrap.json",
  "yarn.lock",
  "bun.lockb",
  "bun.lock",
  "cargo.lock",
  "gemfile.lock",
  "composer.lock",
  "poetry.lock",
  "uv.lock",
  "go.sum",
  "pdm.lock",
  "pipfile.lock",
  "flake.lock",
];

const GENERATED_DIRS: readonly string[] = [
  "dist",
  "build",
  "out",
  "coverage",
  "__generated__",
  "_generated",
  ".next",
  ".nuxt",
  ".svelte-kit",
  ".turbo",
  "target",
  "node_modules",
  ".cache",
  ".output",
];

const GENERATED_SUFFIXES: readonly string[] = [
  ".min.js",
  ".min.css",
  ".bundle.js",
  ".bundle.css",
  ".generated.ts",
  ".generated.js",
  ".g.ts",
  ".g.dart",
  ".pb.go",
  ".pb.ts",
];

const BINARY_EXTENSIONS: readonly string[] = [
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".bmp",
  ".ico",
  ".webp",
  ".avif",
  ".tiff",
  ".svg",
  ".woff",
  ".woff2",
  ".ttf",
  ".otf",
  ".eot",
  ".mp3",
  ".mp4",
  ".mov",
  ".webm",
  ".wav",
  ".ogg",
  ".pdf",
  ".zip",
  ".tar",
  ".tar.gz",
  ".tgz",
  ".gz",
  ".bz2",
  ".xz",
  ".7z",
  ".rar",
  ".exe",
  ".dll",
  ".so",
  ".dylib",
  ".wasm",
  ".node",
];

const DOC_FILENAMES: readonly string[] = [
  "readme",
  "changelog",
  "contributing",
  "license",
  "licence",
  "authors",
  "notice",
  "code_of_conduct",
  "security",
];

const DOC_DIRS: readonly string[] = ["docs", "doc"];

const CONFIG_FILENAMES: readonly string[] = [
  ".editorconfig",
  ".gitattributes",
  ".gitignore",
  ".gitkeep",
  ".nvmrc",
  ".node-version",
  ".npmrc",
  ".prettierignore",
  ".prettierrc",
  ".prettierrc.js",
  ".prettierrc.json",
  ".prettierrc.yaml",
  ".prettierrc.yml",
  ".eslintignore",
  ".eslintrc",
  ".eslintrc.js",
  ".eslintrc.cjs",
  ".eslintrc.json",
  ".eslintrc.yaml",
  ".eslintrc.yml",
  "eslint.config.js",
  "eslint.config.mjs",
  "eslint.config.cjs",
  "eslint.config.ts",
  ".env.example",
  ".dockerignore",
  "dockerfile",
  "makefile",
  "renovate.json",
  "turbo.json",
  "pnpm-workspace.yaml",
  "vitest.config.ts",
  "vitest.config.js",
  "vite.config.ts",
  "vite.config.js",
  "svelte.config.js",
  "tailwind.config.ts",
  "tailwind.config.js",
  "postcss.config.js",
];

const CONFIG_SUFFIXES: readonly string[] = ["tsconfig.json", "tsconfig.base.json"];

const CONFIG_EXTENSIONS: readonly string[] = [".toml", ".ini", ".cfg"];

const TEST_INFIXES: readonly string[] = [".test.", ".spec."];

const TEST_DIRS: readonly string[] = ["tests", "test", "__tests__", "spec"];

const DOC_EXTENSIONS: readonly string[] = [".md", ".mdx", ".markdown"];

function basename(path: string): string {
  const idx = path.lastIndexOf("/");
  return idx >= 0 ? path.slice(idx + 1) : path;
}

function inDirectory(path: string, dir: string): boolean {
  const normalized = path.toLowerCase();
  const d = dir.toLowerCase();
  return normalized.startsWith(d + "/") || normalized.includes("/" + d + "/");
}

function endsWithLower(path: string, suffix: string): boolean {
  return path.toLowerCase().endsWith(suffix.toLowerCase());
}

const renameOnly: Rule = {
  id: "rename-only",
  description: "Pure rename with zero line-level changes",
  evaluate(file) {
    if (file.changeType === "renamed" && file.additions === 0 && file.deletions === 0) {
      return {
        verdict: "skip",
        reason: "Pure rename; no content change to review.",
      };
    }
    return null;
  },
};

const lockfile: Rule = {
  id: "lockfile",
  description: "Package-manager lockfile (auto-generated content)",
  evaluate(file) {
    const name = basename(file.path).toLowerCase();
    if (LOCKFILES.includes(name)) {
      return {
        verdict: "skip",
        reason: "Auto-generated lockfile; re-review by rerunning the package manager, not by reading the diff.",
      };
    }
    return null;
  },
};

const generatedPath: Rule = {
  id: "generated-path",
  description: "File lives in a generated directory or has a generated suffix",
  evaluate(file) {
    for (const dir of GENERATED_DIRS) {
      if (inDirectory(file.path, dir)) {
        return {
          verdict: "skip",
          reason: `Regenerated output from \`${dir}/\`; verify by rerunning the generator.`,
        };
      }
    }
    for (const suffix of GENERATED_SUFFIXES) {
      if (endsWithLower(file.path, suffix)) {
        return {
          verdict: "skip",
          reason: `Regenerated output (\`${suffix}\`); verify by rerunning the generator.`,
        };
      }
    }
    return null;
  },
};

const binary: Rule = {
  id: "binary",
  description: "Binary asset (image, font, archive, media)",
  evaluate(file) {
    for (const ext of BINARY_EXTENSIONS) {
      if (endsWithLower(file.path, ext)) {
        return {
          verdict: "skip",
          reason: `Binary asset (\`${ext}\`); review by comparing rendered output, not textual diff.`,
        };
      }
    }
    return null;
  },
};

const docs: Rule = {
  id: "docs",
  description: "Documentation file",
  evaluate(file) {
    const name = basename(file.path).toLowerCase();
    const stem = name.replace(/\.[^.]+$/, "");
    for (const ext of DOC_EXTENSIONS) {
      if (endsWithLower(file.path, ext)) {
        return {
          verdict: "skim",
          reason: "Prose-only Markdown change.",
        };
      }
    }
    if (DOC_FILENAMES.includes(stem)) {
      return {
        verdict: "skim",
        reason: "Top-level project document (README / CHANGELOG / LICENSE family).",
      };
    }
    for (const dir of DOC_DIRS) {
      if (inDirectory(file.path, dir)) {
        return {
          verdict: "skim",
          reason: `Prose documentation under \`${dir}/\`.`,
        };
      }
    }
    return null;
  },
};

const config: Rule = {
  id: "config",
  description: "Configuration file",
  evaluate(file) {
    const name = basename(file.path).toLowerCase();
    if (CONFIG_FILENAMES.includes(name)) {
      return {
        verdict: "skim",
        reason: "Repository-level configuration; scan for structural edits before trusting.",
      };
    }
    for (const suffix of CONFIG_SUFFIXES) {
      if (endsWithLower(name, suffix)) {
        return {
          verdict: "skim",
          reason: `Configuration file (\`${suffix}\`); scan for structural edits before trusting.`,
        };
      }
    }
    if (name === "package.json") {
      return {
        verdict: "skim",
        reason: "Edit to `package.json`; inspect for major-version dependency bumps or script changes.",
      };
    }
    for (const ext of CONFIG_EXTENSIONS) {
      if (endsWithLower(name, ext) && !inDirectory(file.path, "src")) {
        return {
          verdict: "skim",
          reason: `Configuration file (\`${ext}\`); scan for structural edits before trusting.`,
        };
      }
    }
    return null;
  },
};

const test: Rule = {
  id: "test",
  description: "Test file",
  evaluate(file) {
    const lower = file.path.toLowerCase();
    for (const infix of TEST_INFIXES) {
      if (lower.includes(infix)) {
        return {
          verdict: "skim",
          reason: "Test code accompanying the production change.",
        };
      }
    }
    for (const dir of TEST_DIRS) {
      if (inDirectory(file.path, dir)) {
        return {
          verdict: "skim",
          reason: "Test code accompanying the production change.",
        };
      }
    }
    return null;
  },
};

export const pathBasedRules: readonly Rule[] = [
  renameOnly,
  lockfile,
  generatedPath,
  binary,
  docs,
  config,
  test,
];
