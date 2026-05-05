<svelte:head>
  <title>@nkwib/pr-triage — examples</title>
  <meta
    name="description"
    content="Copy-paste integrations: GitHub PR webhook, Octokit, GitHub Action, the CLI, and a CI pre-review script."
  />
</svelte:head>

<div class="ex-page">
  <header class="ex-hero">
    <a href="/" class="back-link">← Back to home</a>
    <h1>Examples</h1>
    <p class="lede">
      Copy-paste integrations for the four places this filter lives in real
      projects: a GitHub PR webhook, an Octokit fetch, a GitHub Action step,
      and a one-shot CI script.
    </p>
  </header>

  <section class="ex">
    <div class="ex-head">
      <span class="tag">1</span>
      <h2>GitHub PR webhook handler</h2>
    </div>
    <p class="ex-desc">
      Map GitHub's <code>pull_request.synchronize</code> payload into
      <code>FileInput</code>. The status field is the one that needs translating —
      everything else maps 1:1.
    </p>
    <pre class="code-block language-typescript" data-lang="typescript"><code>{`import { classifyPrFiles, type ChangeType } from '@nkwib/pr-triage';
import type { Octokit } from '@octokit/rest';

const STATUS_TO_CHANGE_TYPE: Record<string, ChangeType> = {
  added: 'added',
  modified: 'modified',
  removed: 'deleted',
  renamed: 'renamed',
  changed: 'modified',
  copied: 'added'
};

export async function triagePr(
  octokit: Octokit,
  owner: string,
  repo: string,
  pull_number: number
) {
  const files = await octokit.paginate(octokit.rest.pulls.listFiles, {
    owner, repo, pull_number, per_page: 100
  });

  const { verdicts } = classifyPrFiles({
    files: files.map((f) => ({
      path: f.filename,
      previousPath: f.previous_filename,
      changeType: STATUS_TO_CHANGE_TYPE[f.status] ?? 'modified',
      additions: f.additions,
      deletions: f.deletions,
      patch: f.patch
    }))
  });

  return verdicts;
}
`}</code></pre>
  </section>

  <section class="ex">
    <div class="ex-head">
      <span class="tag">2</span>
      <h2>Bucket the verdicts before passing to the next tier</h2>
    </div>
    <p class="ex-desc">
      The whole point of triage is to shrink the input set passed to a more
      expensive analyzer. Group by verdict and forward only what survives.
    </p>
    <pre class="code-block language-typescript" data-lang="typescript"><code>{`const { verdicts } = classifyPrFiles({ files });

const skipped = verdicts.filter((v) => v.verdict === 'skip');
const skimmed = verdicts.filter((v) => v.verdict === 'skim');
const reviewable = verdicts.filter((v) => v.verdict === 'review-candidate');

console.log(\`triage: \${skipped.length} skip / \${skimmed.length} skim / \${reviewable.length} review\`);
console.log(\`saved \${Math.round((skipped.length / verdicts.length) * 100)}% of files\`);

// Pass only review-candidates to the LLM tier.
await runTier2(reviewable.map((v) => v.path));
`}</code></pre>
  </section>

  <section class="ex">
    <div class="ex-head">
      <span class="tag">3</span>
      <h2>GitHub Action — comment a triage summary</h2>
    </div>
    <p class="ex-desc">
      A minimal action that runs the filter on every PR sync and posts a
      collapsed summary as a sticky comment. Useful as a "what did the bot
      hide from me" sanity check during rollout.
    </p>
    <pre class="code-block language-yaml" data-lang="yaml"><code>{`# .github/workflows/triage.yml
name: PR triage

on:
  pull_request:
    types: [opened, synchronize, reopened]

permissions:
  pull-requests: write

jobs:
  triage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22' }
      - run: npm install --no-save @nkwib/pr-triage @octokit/rest
      - run: node .github/scripts/triage.mjs
        env:
          GH_TOKEN: \${{ github.token }}
          PR_NUMBER: \${{ github.event.pull_request.number }}
          REPO: \${{ github.repository }}
`}</code></pre>
  </section>

  <section class="ex">
    <div class="ex-head">
      <span class="tag">4</span>
      <h2>Branch on a stable rule ID</h2>
    </div>
    <p class="ex-desc">
      <code>ruleId</code> is part of the public contract — pattern-matching on
      it is safe across minor versions. <code>reason</code> is not — it's
      reworded between versions. Use the right field for the right job.
    </p>
    <pre class="code-block language-typescript" data-lang="typescript"><code>{`// OK — ruleId is a stable identifier.
for (const v of verdicts) {
  if (v.ruleId === 'lockfile' || v.ruleId === 'generated-path') {
    metrics.increment('triage.skipped.generated');
  }
}

// BAD — reason is human-readable, not UI-stable.
if (v.reason === 'Package lockfile — content is auto-generated') {
  // …will silently break when the wording changes.
}
`}</code></pre>
  </section>

  <section class="ex">
    <div class="ex-head">
      <span class="tag">5</span>
      <h2>Local diff — using the @nkwib/pr-analyze wrapper</h2>
    </div>
    <p class="ex-desc">
      The companion CLI runs this filter (alongside the rest of the deterministic
      pipeline) over a local git diff. No GitHub round-trip needed during dev.
    </p>
    <pre class="code-block language-bash" data-lang="bash"><code>{`npx @nkwib/pr-analyze analyze --repo . --diff main..HEAD --format human

# JSON for piping into another tool:
npx @nkwib/pr-analyze analyze --repo . --diff HEAD~1 | jq '.triage.verdicts'
`}</code></pre>
  </section>

  <section class="cta-band">
    <h2>Ready to integrate?</h2>
    <p>The whole API is one function. Two minutes to install, an afternoon to be sure of the verdicts on your repo's PRs.</p>
    <div class="cta">
      <a class="btn primary" href="/docs">Read the guide</a>
      <a class="btn ghost" href="/api">API reference</a>
    </div>
  </section>
</div>

<style>
  .ex-page {
    max-width: var(--wide-max);
    margin: 0 auto;
    padding: var(--sp-7) var(--sp-5) var(--sp-9);
  }

  .ex-hero {
    max-width: 50rem;
    margin: 0 auto var(--sp-7);
    text-align: center;
  }

  .back-link {
    display: inline-block;
    color: var(--c-text-muted);
    font-size: var(--fs-sm);
    text-decoration: none;
    margin-bottom: var(--sp-4);
  }

  .back-link:hover {
    color: var(--c-text);
    text-decoration: underline;
  }

  h1 {
    font-size: clamp(2rem, 4.5vw, var(--fs-3xl));
    margin-bottom: var(--sp-3);
    margin-top: 0;
    letter-spacing: -0.03em;
  }

  .lede {
    color: var(--c-text-muted);
    font-size: var(--fs-md);
    margin: 0;
  }

  .ex {
    background: var(--c-surface);
    border: 1px solid var(--c-border);
    border-radius: var(--r-lg);
    padding: var(--sp-5) var(--sp-6);
    margin-bottom: var(--sp-6);
    box-shadow: var(--sh-sm);
  }

  .ex-head {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    margin-bottom: var(--sp-3);
  }

  .ex-head h2 {
    margin: 0;
    font-size: var(--fs-lg);
    letter-spacing: -0.02em;
  }

  .tag {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border-radius: 999px;
    background: var(--c-accent);
    color: var(--c-accent-fg);
    font-family: var(--font-mono);
    font-size: var(--fs-xs);
    font-weight: 600;
  }

  .ex-desc {
    color: var(--c-text-muted);
    margin: 0 0 var(--sp-3);
    font-size: var(--fs-sm);
  }

  .ex pre.code-block {
    margin: 0;
  }

  .cta-band {
    text-align: center;
    padding: var(--sp-7) 0 0;
    max-width: 40rem;
    margin: 0 auto;
  }

  .cta-band h2 {
    font-size: var(--fs-xl);
    margin-bottom: var(--sp-2);
    margin-top: 0;
  }

  .cta-band p {
    color: var(--c-text-muted);
    margin-bottom: var(--sp-4);
  }

  .cta {
    display: flex;
    gap: var(--sp-3);
    justify-content: center;
    flex-wrap: wrap;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-2);
    padding: 0.65rem 1.1rem;
    border-radius: var(--r-md);
    font-size: var(--fs-sm);
    font-weight: 500;
    text-decoration: none;
    border: 1px solid transparent;
  }

  .btn.primary {
    background: var(--c-text);
    color: var(--c-bg);
    border-color: var(--c-text);
  }

  .btn.primary:hover {
    background: var(--c-accent);
    border-color: var(--c-accent);
    color: var(--c-accent-fg);
    text-decoration: none;
  }

  .btn.ghost {
    background: transparent;
    color: var(--c-text);
    border-color: var(--c-border-strong);
  }

  .btn.ghost:hover {
    background: var(--c-bg-alt);
    text-decoration: none;
  }
</style>
