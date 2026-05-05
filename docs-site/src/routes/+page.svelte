<svelte:head>
  <title>@nkwib/pr-triage — deterministic PR file-triage filter</title>
  <meta
    name="description"
    content="Zero deps. Pure function. Classifies every PR file as skip · skim · review-candidate so reviewers focus where it matters."
  />
</svelte:head>

<section class="hero">
  <div class="hero-grid">
    <div class="hero-copy">
      <span class="badge">
        <span class="dot" aria-hidden="true"></span>
        v0.1 · MIT · zero deps · Node 20+
      </span>
      <h1>
        Strip the lockfiles.<br />
        <span class="accent">Find</span> the real review.
      </h1>
      <p class="lede">
        <strong>@nkwib/pr-triage</strong> classifies every file in a
        pull request as <code>skip</code>, <code>skim</code>, or
        <code>review-candidate</code> — so a reviewer (or the next LLM tier)
        spends attention only on what changed.
      </p>

      <div class="cta">
        <a class="btn primary" href="/docs">Read the docs</a>
        <a class="btn ghost" href="/examples">See examples</a>
      </div>

      <pre class="install"><span class="prompt">$</span> npm install @nkwib/pr-triage</pre>
    </div>

    <aside class="demo">
      <div class="demo-tab">
        <span class="dots" aria-hidden="true">
          <i></i><i></i><i></i>
        </span>
        <span class="filename">classify.ts</span>
      </div>
      <pre class="demo-code"><code><span class="kw">import</span> &lbrace; classifyPrFiles &rbrace; <span class="kw">from</span> <span class="str">'@nkwib/pr-triage'</span>;

<span class="kw">const</span> &lbrace; verdicts &rbrace; = <span class="fn">classifyPrFiles</span>(&lbrace;
  <span class="prop">files</span>: [
    &lbrace; <span class="prop">path</span>: <span class="str">'pnpm-lock.yaml'</span>,    <span class="prop">changeType</span>: <span class="str">'modified'</span>, <span class="prop">additions</span>: <span class="num">120</span>, <span class="prop">deletions</span>: <span class="num">45</span> &rbrace;,
    &lbrace; <span class="prop">path</span>: <span class="str">'src/pricing.ts'</span>,    <span class="prop">changeType</span>: <span class="str">'modified'</span>, <span class="prop">additions</span>: <span class="num">30</span>,  <span class="prop">deletions</span>: <span class="num">5</span>  &rbrace;,
    &lbrace; <span class="prop">path</span>: <span class="str">'tests/pricing.test.ts'</span>, <span class="prop">changeType</span>: <span class="str">'added'</span>,    <span class="prop">additions</span>: <span class="num">42</span>,  <span class="prop">deletions</span>: <span class="num">0</span>  &rbrace;
  ]
&rbrace;);

<span class="cmt">// pnpm-lock.yaml         → skip             (lockfile)</span>
<span class="cmt">// src/pricing.ts         → review-candidate (default)</span>
<span class="cmt">// tests/pricing.test.ts  → skim             (test)</span>
</code></pre>
    </aside>
  </div>
</section>

<section class="features">
  <div class="features-inner">
    <div class="feature">
      <div class="feature-icon">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
      </div>
      <h3>Three verdicts</h3>
      <p>
        <code>skip</code> for lockfiles, generated, binary, prettier-only;
        <code>skim</code> for tests, config, docs;
        <code>review-candidate</code> for everything else. That's the API surface.
      </p>
    </div>

    <div class="feature">
      <div class="feature-icon">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
        </svg>
      </div>
      <h3>Zero runtime deps</h3>
      <p>
        <code>"dependencies": &lbrace;&rbrace;</code>. No npm tree to audit.
        No transitive supply chain. Deletion-friendly.
      </p>
    </div>

    <div class="feature">
      <div class="feature-icon">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5" />
          <path d="M12 7v6l3 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
      </div>
      <h3>Deterministic</h3>
      <p>
        Pure function. No I/O, no filesystem, no network, no clock, no PRNG.
        Same input always produces the same verdicts in the same order.
      </p>
    </div>

    <div class="feature">
      <div class="feature-icon">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M9 12l2 2 4-4M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>
      <h3>11 rules. First-match wins.</h3>
      <p>
        <code>rename-only</code>, <code>lockfile</code>, <code>generated-path</code>,
        <code>binary</code>, <code>generated-header</code>,
        <code>prettier-only</code>, <code>import-reorder</code>,
        <code>docs</code>, <code>config</code>, <code>test</code>, plus the
        <code>default</code> fallback.
      </p>
    </div>

    <div class="feature">
      <div class="feature-icon">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 12h4l3-9 4 18 3-9h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>
      <h3>Fast</h3>
      <p>
        Processes a 100-file PR in well under 500&nbsp;ms on a laptop.
        Verified by <code>tests/performance.test.ts</code> in CI.
      </p>
    </div>

    <div class="feature">
      <div class="feature-icon">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 6h16M4 10h16M4 14h10M4 18h7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
      </div>
      <h3>Stable rule IDs</h3>
      <p>
        Every verdict carries a <code>ruleId</code> you can match against in
        your code (<code>'lockfile'</code>, <code>'docs'</code>, …) — safe to
        branch on across versions.
      </p>
    </div>
  </div>
</section>

<section class="ports">
  <div class="ports-inner">
    <div class="ports-copy">
      <h2>50–70&nbsp;% of files removed from the budget</h2>
      <p>
        On real PRs, a typical run flags lockfiles, generated dirs, prettier-only
        whitespace churn, and docs as out of scope before any expensive analysis
        runs. Tier&nbsp;2 / Tier&nbsp;3 of a review pipeline never sees them.
      </p>
      <a class="btn ghost compact" href="/rules"
        >See the rule table
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </a>
    </div>
    <pre class="ports-code"><code><span class="cmt">// One pure function. One result.</span>
<span class="kw">interface</span> <span class="fn">FileVerdict</span> &lbrace;
  <span class="prop">path</span>:    <span class="kw">string</span>;
  <span class="prop">verdict</span>: <span class="str">'skip'</span> | <span class="str">'skim'</span> | <span class="str">'review-candidate'</span>;
  <span class="prop">ruleId</span>:  <span class="kw">string</span>;   <span class="cmt">// 'lockfile' | 'docs' | 'default' | …</span>
  <span class="prop">reason</span>:  <span class="kw">string</span>;   <span class="cmt">// human-readable, not UI-stable</span>
&rbrace;
</code></pre>
  </div>
</section>

<section class="cta-band">
  <div class="cta-band-inner">
    <h2>Reviewer attention is the budget.</h2>
    <p>This package spends none of it on lockfiles.</p>
    <div class="cta">
      <a class="btn primary" href="/docs">Read the guide</a>
      <a class="btn ghost" href="/api">API reference</a>
    </div>
  </div>
</section>

<style>
  .hero {
    padding: var(--sp-9) var(--sp-5) var(--sp-8);
    background:
      radial-gradient(circle at 80% -10%, var(--c-accent-soft), transparent 50%),
      radial-gradient(circle at 0% 100%, var(--c-bg-alt), transparent 60%),
      var(--c-bg);
    border-bottom: 1px solid var(--c-border);
  }

  .hero-grid {
    max-width: var(--wide-max);
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1.1fr 1fr;
    gap: var(--sp-7);
    align-items: center;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-2);
    background: var(--c-surface);
    border: 1px solid var(--c-border);
    color: var(--c-text-muted);
    font-family: var(--font-mono);
    font-size: var(--fs-xs);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 4px 10px;
    border-radius: 999px;
    box-shadow: var(--sh-sm);
    margin-bottom: var(--sp-5);
  }

  .badge .dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    background: var(--c-good);
    border-radius: 999px;
  }

  .hero h1 {
    font-size: clamp(2.25rem, 4.5vw, var(--fs-4xl));
    line-height: 1.05;
    letter-spacing: -0.04em;
    margin-bottom: var(--sp-5);
  }

  .accent {
    color: var(--c-accent);
    font-style: italic;
    font-weight: 700;
  }

  .lede {
    font-size: var(--fs-md);
    color: var(--c-text-muted);
    max-width: 38ch;
    margin-bottom: var(--sp-6);
  }

  .lede strong {
    color: var(--c-text);
    font-weight: 600;
  }

  .cta {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-3);
    margin-bottom: var(--sp-5);
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
    transition: background 120ms ease, color 120ms ease, border-color 120ms ease;
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

  .btn.compact {
    padding: 0.5rem 0.85rem;
    font-size: var(--fs-sm);
  }

  .install {
    display: inline-block;
    background: var(--c-surface);
    border: 1px solid var(--c-border);
    border-radius: var(--r-md);
    padding: var(--sp-2) var(--sp-4);
    font-family: var(--font-mono);
    font-size: var(--fs-sm);
    color: var(--c-text);
    box-shadow: var(--sh-sm);
    margin: 0;
  }

  .install .prompt {
    color: var(--c-text-subtle);
    margin-right: var(--sp-2);
    user-select: none;
  }

  .demo {
    background: var(--c-code-bg);
    border: 1px solid var(--c-border);
    border-radius: var(--r-lg);
    box-shadow: var(--sh-lg);
    overflow: hidden;
    font-family: var(--font-mono);
    font-size: var(--fs-sm);
  }

  .demo-tab {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    padding: var(--sp-3) var(--sp-4);
    border-bottom: 1px solid var(--c-border);
    background: var(--c-bg-alt);
    color: var(--c-text-subtle);
    font-size: var(--fs-xs);
  }

  .dots { display: inline-flex; gap: 6px; }
  .dots i {
    width: 10px; height: 10px; border-radius: 999px;
    background: var(--c-border-strong); display: inline-block;
  }
  .dots i:nth-child(1) { background: var(--c-accent); opacity: 0.55; }
  .dots i:nth-child(2) { background: #f59e0b; opacity: 0.55; }
  .dots i:nth-child(3) { background: var(--c-good); opacity: 0.55; }

  .filename { font-family: var(--font-mono); }

  .demo-code {
    margin: 0;
    padding: var(--sp-5);
    background: transparent;
    color: var(--c-code-text);
    overflow-x: auto;
    font-size: var(--fs-sm);
    line-height: 1.65;
    font-family: var(--font-mono);
  }

  .demo-code code { background: transparent; border: 0; padding: 0; color: inherit; font-family: var(--font-mono); font-size: inherit; }
  .demo-code .kw   { color: var(--c-code-keyword); }
  .demo-code .str  { color: var(--c-code-string); }
  .demo-code .fn   { color: var(--c-code-fn); }
  .demo-code .cmt  { color: var(--c-code-comment); font-style: italic; }
  .demo-code .prop { color: var(--c-code-prop); }
  .demo-code .num  { color: var(--c-code-num); }

  .features {
    padding: var(--sp-9) var(--sp-5);
  }

  .features-inner {
    max-width: var(--wide-max);
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--sp-5);
  }

  .feature {
    background: var(--c-surface);
    border: 1px solid var(--c-border);
    padding: var(--sp-5);
    border-radius: var(--r-lg);
  }

  .feature:hover {
    border-color: var(--c-border-strong);
  }

  .feature-icon {
    width: 36px; height: 36px;
    display: inline-flex; align-items: center; justify-content: center;
    background: var(--c-bg-alt); border: 1px solid var(--c-border);
    border-radius: var(--r-md); color: var(--c-accent);
    margin-bottom: var(--sp-4);
  }

  .feature-icon svg { width: 18px; height: 18px; }

  .feature h3 {
    font-size: var(--fs-md);
    margin: 0 0 var(--sp-2);
    letter-spacing: -0.02em;
  }

  .feature p {
    color: var(--c-text-muted);
    margin: 0;
    font-size: var(--fs-sm);
    line-height: 1.65;
  }

  .ports {
    padding: var(--sp-8) var(--sp-5);
    background: var(--c-bg-alt);
    border-top: 1px solid var(--c-border);
    border-bottom: 1px solid var(--c-border);
  }

  .ports-inner {
    max-width: var(--wide-max);
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr 1.2fr;
    gap: var(--sp-7);
    align-items: center;
  }

  .ports-copy h2 {
    margin: 0 0 var(--sp-3);
    font-size: var(--fs-2xl);
    letter-spacing: -0.03em;
  }

  .ports-copy p {
    color: var(--c-text-muted);
    margin-bottom: var(--sp-5);
    font-size: var(--fs-md);
  }

  .ports-code {
    margin: 0;
    background: var(--c-code-bg);
    border: 1px solid var(--c-border);
    border-radius: var(--r-lg);
    padding: var(--sp-5);
    overflow-x: auto;
    color: var(--c-code-text);
    font-family: var(--font-mono);
    font-size: var(--fs-sm);
    line-height: 1.65;
    box-shadow: var(--sh-md);
  }

  .ports-code code { background: transparent; border: 0; padding: 0; color: inherit; font-family: var(--font-mono); }
  .ports-code .kw   { color: var(--c-code-keyword); }
  .ports-code .str  { color: var(--c-code-string); }
  .ports-code .fn   { color: var(--c-code-fn); }
  .ports-code .cmt  { color: var(--c-code-comment); font-style: italic; }
  .ports-code .prop { color: var(--c-code-prop); }

  .cta-band {
    padding: var(--sp-9) var(--sp-5);
    text-align: center;
  }

  .cta-band-inner {
    max-width: 40rem;
    margin: 0 auto;
  }

  .cta-band h2 {
    font-size: var(--fs-2xl);
    margin-bottom: var(--sp-2);
    letter-spacing: -0.03em;
  }

  .cta-band p {
    color: var(--c-text-muted);
    margin-bottom: var(--sp-5);
    font-size: var(--fs-md);
  }

  .cta-band .cta {
    justify-content: center;
  }

  @media (max-width: 960px) {
    .hero { padding: var(--sp-7) var(--sp-5) var(--sp-7); }
    .hero-grid { grid-template-columns: 1fr; gap: var(--sp-6); }
    .features-inner { grid-template-columns: 1fr; }
    .ports-inner { grid-template-columns: 1fr; }
  }

  @media (max-width: 720px) {
    .hero h1 { font-size: clamp(2rem, 8vw, 2.6rem); }
  }
</style>
