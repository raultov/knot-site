# Implementation plan — knot.kz agent-ready (Web-MCP)

# Important bibliography: https://developer.chrome.com/blog/new-in-devtools-149

> Working document to prepare the talk **"The End of Visual Scraping: Building the Agentic Web
> with Web-MCP and `navigator.modelContext`"** (BiznagaFest 2026, November 7, 2026, FYCMA Málaga)
> using https://www.knot.kz as a real production case study.
>
> Status: **plan approved and fully implemented** (Phases 0–6). Drafted: 2026-08-09.
> Implementation history in `docs/web-mcp-phases.md`.

---

## Table of contents

1. [Goal and thesis](#1-goal-and-thesis)
2. [Verified site diagnosis](#2-verified-site-diagnosis)
3. [Analysis of the Lighthouse "Agentic Browsing" audit](#3-analysis-of-the-lighthouse-agentic-browsing-audit)
4. [Target architecture](#4-target-architecture)
5. [Phase 0 — Instrumentation & foundations](#phase-0--instrumentation--foundations)
6. [Phase 1 — Decouple data from presentation](#phase-1--decouple-data-from-presentation)
7. [Phase 2 — Agent Accessibility](#phase-2--agent-accessibility)
8. [Phase 3 — Imperative API + live panel](#phase-3--imperative-api--live-panel)
9. [Phase 4 — Declarative API: contact form](#phase-4--declarative-api-contact-form)
10. [Phase 5 — Trust boundaries](#phase-5--trust-boundaries)
11. [Phase 6 — AEO, SEO and technical debt](#phase-6--aeo-seo-and-technical-debt)
12. [Phase → talk timeline mapping](#12-phase--talk-timeline-mapping)
13. [Risks](#13-risks)
14. [Decisions made](#14-decisions-made)
15. [Execution checklist](#15-execution-checklist)

---

## 1. Goal and thesis

Turn knot.kz into a fully agentic site, covering both levels Lighthouse distinguishes in its
*Agentic Browsing* category, so the talk can be illustrated with a real production example
instead of a lab example.

### The narrative resonance

> **Knot indexes code so agents understand a repository.
> Web-MCP indexes a website so agents use it.**
> Same thesis, different layer.

"I built a tool that makes code legible to agents; now I'm going to make their own website
legible" is an arc that justifies every change without it looking like a bolt-on, and it fits the
informational purpose the site already serves.

### The two levels (structure borrowed from Lighthouse)

| Level | Audits | Meaning |
|---|---|---|
| **Agent Accessibility** | accessibility tree, `llms.txt` | **Passive** legibility. The agent *reads* you |
| **WebMCP** | form coverage, tools registered, schemas valid | **Active** capability. The agent *uses* you |

The talk, as currently drafted, only covers the second level. Google is saying the first one is
the prerequisite. Incorporating that hierarchy is a differentiator against any other MCP talk on
the circuit: *"before exposing tools, fix what the agent is already trying to read"*.

### Product constraint

The site fulfills a real informational role about knot.kz. No change may distort it. The new
Agent Tools section is justified because it is **on-brand**: knot is exactly about making
technical artifacts legible to agents.

---

## 2. Verified site diagnosis

### Stack

- Vite 7 + React 19 + TypeScript 5.5, static SPA, **no router, no backend, no tests**.
- pnpm 10 / Node 22 on CI. Prettier: no semicolons, single quotes, `printWidth: 100`.
- `tsconfig.json`: alias `@/* → src/*` (duplicated in `vite.config.ts`; both must stay in sync),
  `resolveJsonModule: true`, `include: ["src"]` **only**.
- `pnpm build` = `tsc && vite build`. Any unused variable breaks the build (`noUnusedLocals`).
- CI (`.github/workflows/ci.yml`) runs lint + build + `pnpm audit`, but **does not deploy**.
  Deployment is done by Cloudflare Pages via dashboard integration (outside version control).

### Composition

`src/App.tsx` renders `Header` + `Hero` + `Footer` directly, and `Updates`, `Features`, `Demo`,
`KnotServer`, `Installation` via `React.lazy()`, each wrapped in its own `<Suspense>` with a
shared fallback (`src/App.tsx:7-11`, `:27-41`). **Every new section must follow this exact
pattern.**

### Design tokens (`src/styles/global.css:1-22`)

All custom properties live there. `App.css` contains no tokens (only `.app__fallback`).

| Group | Tokens |
|---|---|
| Backgrounds | `--bg-primary:#000000` · `--bg-secondary:#161b22` · `--bg-tertiary:#21262d` · `--border-color:#30363d` |
| Text | `--text-primary:#f0f6fc` · `--text-secondary:#8b949e` · `--text-muted:#6e7681` |
| Accent | `--accent:#58a6ff` · `--accent-hover:#79c0ff` |
| Semantic | `--green:#3fb950` · `--green-dim:#238636` · `--orange:#d29922` · `--purple:#a371f7` · `--red:#f85149` |
| Geometry | `--radius:8px` · `--radius-sm:4px` · `--max-width:1100px` |
| Typography | `--font-mono` (JetBrains Mono → monospace) · `--font-sans` (system stack) |

There is no spacing scale in variables: inline `clamp()` is used. Constant gutter:
`.container { padding: 0 24px }`. Single mobile breakpoint: `max-width: 768px`.

Reusable global utilities:
- `.reveal` — *scroll-driven* animation (`animation-timeline: view()`) with **double
  degradation**: `@media (prefers-reduced-motion: reduce)` and
  `@supports not (animation-timeline: view())`. It is the precedent to follow for any new CSS.
- `html { scroll-padding-top: 80px }` — the fixed header offset is already solved for any new
  anchor.
- `:focus-visible { outline: 2px solid var(--accent) }` — accessibility baseline already present.

### CSP (`public/_headers`, applies to `/*`)

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';
  img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none';
  base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests
```

Design consequences, **non-negotiable**:

| Directive | Implication |
|---|---|
| `connect-src 'self'` | Any runtime fetch to third-party APIs is forbidden. Hence the build-time fetch pattern of `scripts/fetch-updates.mjs` |
| `script-src 'self'` without `unsafe-inline` | No inline `<script>`, no analytics snippet, no polyfill from a CDN |
| `form-action 'self'` | The form **may only** post to the same origin ⇒ Cloudflare Pages Functions is the only option that does not force relaxing the CSP |
| `img-src 'self' data:` | No remote images |
| `style-src` with `'unsafe-inline'` | React inline styles and `useMouseTrack` do work |

> The last line of the file, `! Access-Control-Allow-Origin`, uses the Cloudflare Pages-specific
> *unset* syntax. It is the strongest evidence of the hosting.

### Existing data pipeline

`scripts/fetch-updates.mjs` (Node ESM, no dependencies, native `fetch`) runs in the `prebuild`
hook. It downloads the CHANGELOGs and Releases APIs of `raultov/knot` and `raultov/knot-server`,
parses them with **two different grammars**, and writes `src/data/updates.json`. It has three
layers of failure tolerance so the build never breaks. **It is the reference pattern for the new
generators of Phases 2 and 6.**

### Data/presentation coupling (the problem to solve)

| File | Embedded data | Volume |
|---|---|---|
| `src/components/Features.tsx` | 6 objects with inline `icon: <svg>` JSX | ~150 lines |
| `src/components/KnotServer.tsx:6-180` | 9 objects with inline `icon: <svg>` JSX | ~175 lines |
| `src/components/Installation.tsx:4-442` | `knotSections` + `knotServerSections` | ~440 lines |
| `src/components/Footer.tsx` | `languages` array (14 languages) | module |

Today **none of this is serializable** without dragging React along. It is a real — not
fabricated — case of the talk's thesis about the mandatory decoupling of presentation logic.

### Preexisting debt detected

| Problem | Location | Severity |
|---|---|---|
| `og:image` points to `/logo.png`, a **nonexistent file** in `public/` | `index.html` | High — all social previews broken |
| No JSON-LD / structured data | `index.html` | Medium |
| `sitemap.xml` without `<lastmod>` | `public/sitemap.xml` | Low |
| Soft-404: nonexistent routes return `index.html` | Cloudflare Pages | Medium — hurts SEO and caused the `llms.txt` failure |
| README does not document `fetch-updates.mjs`, the `prebuild` hook or the Updates section | `README.md` | Low |
| Copy+timeout logic triplicated | `Hero.tsx:11-15`, `Installation.tsx:453-457`, `KnotServer.tsx:206-210` | Low |

---

## 3. Analysis of the Lighthouse "Agentic Browsing" audit

Starting score: **1/3**.

### 3.1 Scoreable audits

| Audit | Status | **Verified** cause |
|---|---|---|
| Cumulative Layout Shift 0 | ✅ PASS | — (must not regress) |
| Accessibility tree is not well-formed | ❌ FAIL | Element **external to the site** (see 3.2) |
| llms.txt does not follow recommendations | ❌ FAIL | `/llms.txt` returns the site HTML (see 3.3) |

### 3.2 "Accessibility tree is not well-formed" — NOT knot-site code

Exact report detail:

```
Elements should not have tabindex greater than zero
<z0c405528-3811-45b2-9538-ee1da8f9a7fa tabindex="1" role="region">
```

**Check executed** against the deployed bundle (`dist/`):

```
$ grep -o 'tabIndex[^,;]\{0,20\}' dist/assets/*.js | sort -u
dist/assets/Updates-D6JTakVv.js:tabIndex:0
dist/assets/vendor-Ddy7v_zN.js:tabIndex"

$ grep -ro 'tabindex="[0-9]"' dist/
(no results)
```

**Conclusion:** the site's only `tabIndex` is `0` (in `Updates.tsx`, correct usage for a
keyboard-scrollable region). **There is no `tabindex="1"` anywhere in the deployed code.**

The GUID-formatted tag name (`z0c405528-…`) is the canonical pattern **browser extensions** use
to inject overlays without colliding with the page CSS. Additionally, with `script-src 'self'`
no third-party script could execute in the document — but extensions can, because they operate
outside the page CSP.

**Working hypothesis (high confidence):** the audit ran in a Chrome profile with active
extensions and the element is injected by one of them. It is plausible that it is an
agent/MCP-bridge extension installed precisely to investigate Web-MCP — which is, by the way, a
nice anecdote for the stage.

**Action:** re-measure headless without extensions **before** touching any ARIA. If it persists,
locate the element live via CDP (`Accessibility.getFullAXTree`).

> ⚠️ Explicit correction vs. previous versions of this plan: the initially proposed list of ARIA
> defects (tabs without `role="tablist"`, missing `aria-expanded`, etc.) was **speculative and
> the audit confirms none of them**. They are kept in Phase 2c as quality work, clearly labeled
> **not audit-driven**.

### 3.3 "llms.txt does not follow recommendations"

Exact report detail:

```
File is missing a required H1 header (e.g., "# Title").
File does not appear to contain any links.
```

**Check executed:** `GET https://www.knot.kz/llms.txt` returns the site HTML (the `<title>`
"Knot — Codebase Indexer for AI Agents" comes back, and the body is empty because it is a SPA
without SSR).

**Root cause:** Cloudflare Pages serves `index.html` as fallback for nonexistent routes. The
audit does not say "the file is missing": it says **what is at `/llms.txt` is not valid
Markdown**, because it is trying to parse HTML. Both errors fit exactly.

This also reveals a bigger problem: **any nonexistent route responds with the home page**
(soft-404), which hurts SEO in general.

### 3.4 WebMCP audits — `Unscored`

| Audit | Report text |
|---|---|
| WebMCP form coverage | *"Consider adding WebMCP annotations to the forms listed below."* — **Unscored** |
| WebMCP tools registered | *"Lists the WebMCP tools registered at the time of analysis."* — **Unscored** |
| WebMCP schemas are valid | *"Valid WebMCP schemas are required… Please fix any errors or warnings reported by the browser."* — **Unscored** |

**Critical implication for the narrative:** these three **do not count toward the score**. The
1/3 → 3/3 is achieved solely with `llms.txt` + a clean browser profile.

But *"lists the WebMCP tools registered"* means that, after Phase 3, **knot.kz's tools will
appear printed inside an official Google Lighthouse report**. As a talk artifact that is worth
more than the number.

**Recommended narrative reframing:** not *"from 1/3 to 3/3"*, but **"from 1/3 to 3/3 in ten
minutes… and now let's talk about what Lighthouse still doesn't know how to score"**. More
honest and more interesting.

---

## 4. Target architecture

The axis of the plan is collapsing four consumers onto **a single source of truth**:

```
                         src/data/*.ts
                               │
       ┌───────────────┬───────┴───────┬───────────────┐
       ▼               ▼               ▼               ▼
   Components       Web-MCP          llms.txt        JSON-LD
     React           tools        (build-time)    (build-time)
       │               │               │               │
     human       agent that DOES  agent that READS   crawler
```

Today that data lives embedded in JSX inside four components. **That is the real work of the
plan; Web-MCP is simply what makes it inevitable.**

### Resulting file structure

```
scripts/
  fetch-updates.mjs            (existing)
  generate-agent-assets.mjs    NEW  → public/llms.txt, JSON-LD, sitemap lastmod
  audit-agentic.mjs            NEW  → headless Lighthouse without extensions

src/
  data/
    types.ts        NEW   Feature, ServerFeature, InstallSection, Snippet, Product…
    features.ts     NEW   ← extracted from Features.tsx
    serverFeatures.ts NEW ← extracted from KnotServer.tsx
    install.ts      NEW   ← extracted from Installation.tsx
    languages.ts    NEW   ← extracted from Footer.tsx
    site.ts         NEW   repos, Docker image, URLs, tagline
    index.ts        NEW   barrel for the build-time generators
    updates.json    (existing, generated)

  icons/
    featureIcons.tsx   NEW  Record<FeatureId, ReactNode>
    serverIcons.tsx    NEW  Record<ServerFeatureId, ReactNode>

  state/
    installationStore.ts NEW  external store (useSyncExternalStore)

  webmcp/
    types.ts        NEW  declaration merging over Navigator
    useWebMcp.ts    NEW  registration hook + AbortSignal
    schemas.ts      NEW  typed JSON Schemas
    invocationLog.ts NEW pub/sub for the live panel
    registry.ts     NEW  tool assembly
    tools/
      listSupportedLanguages.ts
      getLatestReleases.ts
      searchKnotCapabilities.ts
      compareKnotEditions.ts
      getInstallCommand.ts

  components/
    AgentTools.tsx  NEW
    Contact.tsx     NEW
    CopyButton.tsx  NEW  (unifies triplicated logic)

  styles/
    AgentTools.css  NEW
    Contact.css     NEW

functions/
  api/contact.ts    NEW  Cloudflare Pages Function
  tsconfig.json     NEW  @cloudflare/workers-types

public/
  llms.txt          NEW (generated)
  404.html          NEW
  og-image.png      NEW (1200×630)
```

---

## Phase 0 — Instrumentation & foundations

*Goal: measure reliably and have the type layer ready. No visible change.*

### Files

| File | Action | Contents |
|---|---|---|
| `scripts/audit-agentic.mjs` | **new** | Lighthouse CLI wrapper |
| `package.json` | modify | `"audit:agentic": "node scripts/audit-agentic.mjs"` |
| `.gitignore` | modify | `+ .lighthouse/` |
| `src/webmcp/types.ts` | **new** | Types and declaration merging |
| `src/webmcp/useWebMcp.ts` | **new** | Registration hook |

### `scripts/audit-agentic.mjs`

Critical requirement: **run without extensions**, the probable cause of the false positive.

```
--chrome-flags="--headless=new --disable-extensions --no-first-run --disable-features=ExtensionsToolbarMenu"
--only-categories=agentic-browsing,performance,accessibility,best-practices,seo
--output=json,html  --output-path=.lighthouse/<phase>/
```

It must boot `vite preview` (port 4173) or accept a URL as argument so production can also be
audited. It keeps a per-phase history so the before/after can be shown in the talk.

### `src/webmcp/types.ts`

```ts
export interface JSONSchema { /* subset used */ }

export interface WebMcpToolResult {
  content: Array<{ type: 'text'; text: string }>
  isError?: boolean
}

export interface WebMcpTool<TInput = unknown> {
  name: string
  description: string
  inputSchema: JSONSchema
  annotations?: { readOnlyHint?: boolean; destructiveHint?: boolean }
  execute: (input: TInput) => Promise<WebMcpToolResult>
}

declare global {
  interface ModelContext {
    registerTool(tool: WebMcpTool, options?: { signal?: AbortSignal }): void
    requestUserInteraction?(): Promise<void>
  }
  interface Navigator {
    readonly modelContext?: ModelContext
  }
}
```

**Design decision:** `modelContext` is declared **optional on purpose**. It forces every
consumer to *narrow* and makes forgetting the feature-detect impossible. The type system is used
as a safety mechanism, not decoration. Good micro-slide for the talk.

### `src/webmcp/useWebMcp.ts`

```ts
export function useWebMcp(tools: readonly WebMcpTool[]): boolean
```

- `useEffect` with an `AbortController`.
- Feature-detect: `if (!navigator.modelContext) return`.
- Registers each tool with `{ signal: controller.signal }`.
- Cleanup: `controller.abort()`.
- Returns whether the API is available (so `AgentTools` decides what to render).

**Value for the talk:** the `AbortSignal` is the live demonstration of the *"tab-bound
lifecycle"* limitation of timeline Phase 5 — navigate away and the tools disappear from the
inspector.

### Acceptance criteria

- [ ] `pnpm build && pnpm lint` pass with no behavior changes.
- [ ] Lighthouse baseline captured **on a clean profile** in `.lighthouse/phase-0/`.
- [ ] **Key verification:** determine whether `Accessibility tree` goes green without
      extensions. If so ⇒ hypothesis 3.2 confirmed and Phase 2c stays as optional quality work.

---

## Phase 1 — Decouple data from presentation

*The core refactor of the talk. Justified on its own, with or without Web-MCP.*

### Extraction

| Source | Destination | Contents |
|---|---|---|
| `Features.tsx` | `src/data/features.ts` + `src/icons/featureIcons.tsx` | 6 items `{ id, title, description }` |
| `KnotServer.tsx:6-180` | `src/data/serverFeatures.ts` + `src/icons/serverIcons.tsx` | 9 items |
| `Installation.tsx:4-442` | `src/data/install.ts` | `knotSections` + `knotServerSections` |
| `Footer.tsx` | `src/data/languages.ts` | 14 languages |
| — | `src/data/site.ts` | repos, Docker image, canonical URLs, tagline |
| — | `src/data/types.ts` | shared types |
| — | `src/data/index.ts` | barrel for the generators |

The data becomes **pure and serializable**: no JSX, no React imports. Components resolve icons
via `featureIcons[f.id]`.

### Real type-safety

`Record<FeatureId, ReactNode>` with `FeatureId` derived from the data
(`typeof features[number]['id']`) means **adding a feature and forgetting its icon breaks the
build**. With `noUnusedLocals` and `tsc` in the build, this is enforced for real. It deserves a
moment in the talk: the type as a contract between the data layer and the visual layer.

### Technical decision: reading the `.ts` files from Node

The Phase 2 and 6 generators are Node scripts and need this data.

| Option | Risk | Verdict |
|---|---|---|
| Convert to `.json` + separate types | None; replicates the `updates.json` pattern | Loses `as const` and literal unions |
| Node `--experimental-strip-types` | The Node version on Cloudflare Pages is not under our control | ❌ Discarded |
| **Transpile with esbuild inside the script** | esbuild is already in `node_modules` as a Vite dependency | ✅ **Chosen** |

Implementation: `esbuild.build({ entryPoints: ['src/data/index.ts'], bundle: true, format: 'esm',
write: false })` then `import()` the result as a `data:` URL. ~15 lines, zero new dependencies,
works on any Node version.

### Acceptance criteria

- [ ] The site renders **byte-identical**. It is a pure refactor, no functional change.
- [ ] The 4 Lighthouse scores hold (100 / 92 / 92 / 100).
- [ ] No component imports data from another component.
- [ ] `src/data/**` contains not a single `react` import.
- [ ] Small reviewable commits (one component per commit), given there is no test suite.

---

## Phase 2 — Agent Accessibility

*This is where the score moves. Without writing a line of Web-MCP.*

### 2a — Generated `llms.txt` (the real fix)

**`scripts/generate-agent-assets.mjs`** (new), hooked into `prebuild` next to
`fetch-updates.mjs`. It must replicate its failure-tolerance policy: never break the build.

Sources: `src/data/*` (via esbuild) + `src/data/updates.json`. Output: `public/llms.txt`.

Requirements the audit demands, **verbatim**:
- At least one **H1** header (`# Title`).
- Links in **Markdown** format `[text](url)` — **never bare URLs**.
- Substantial content (not just a few words).

Proposed structure:

```markdown
# Knot

> High-performance codebase indexer for AI agents. Extracts structural and semantic
> information from source code using vector search (Qdrant) and a graph database (Neo4j).

## Products
- [Knot CLI](https://github.com/raultov/knot): indexer, MCP server and CLI client.
- [Knot Server](https://github.com/raultov/knot-server): distributed REST API, webhooks,
  scheduler, graph viewer and Swagger UI.

## Capabilities          ← generated from src/data/features.ts
## Knot Server           ← generated from src/data/serverFeatures.ts
## Supported languages   ← generated from src/data/languages.ts
## Installation          ← generated from src/data/install.ts
## Latest releases       ← generated from src/data/updates.json
## Documentation
- [Knot README](https://github.com/raultov/knot#readme): …
```

**Narrative value:** the same data that feeds the UI feeds `llms.txt`. The talk's thesis turned
into a build step.

### 2b — The soft-404 behind it

`/llms.txt` returns `index.html` today. This implies **any nonexistent route responds with the
home page**.

- Add `public/404.html` (static page, design-coherent, with a link home).
- Verify the real status code with `curl -I https://www.knot.kz/nonexistent-route`.
- After deploy, check that `curl -I https://www.knot.kz/llms.txt` returns
  `200` + `content-type: text/plain`.

### 2c — ARIA (quality work, **NOT audit-driven**)

> Honest labeling: **none of these points fixes a failing audit.** They are included because
> agents do consume the accessibility tree, because they improve the site for assistive
> technologies, and because they fit the "Agent Accessibility" level of the talk. Priority:
> execute **after** confirming the Phase 0 result.

Ordered by value:

1. **`Installation.tsx:495-508` — tabs without semantics.** Two `<button>`s that *are* a tabset
   but do not declare it: missing `role="tablist"`, `role="tab"`, `aria-selected`,
   `aria-controls`, and the panels lack `role="tabpanel"`. Also add *roving tabindex* and arrow
   key navigation. **It is the most valuable point** because it is exactly the control the
   `get-install-command` tool of Phase 3 will manipulate: the accessibility defect and the
   agentic opportunity are in the same place.

2. **`Header.tsx:24-32` — disclosure without state.** It has `aria-label` but lacks
   `aria-expanded={menuOpen}` and `aria-controls`. Also check in `Header.css` whether the closed
   nav is hidden with `transform` instead of `display:none`/`visibility:hidden`: in that case
   the links stay in the accessibility tree while invisible.

3. **Unified `CopyButton`** (`src/components/CopyButton.tsx`). Today the copy+timeout logic is
   triplicated (`Hero.tsx:11-15`, `Installation.tsx:453-457`, `KnotServer.tsx:206-210`).
   Additionally, `Hero.tsx:81-116` and `Installation.tsx:463-469` nest an
   `<span aria-live="polite">` inside a button whose `aria-label` **replaces** all its content
   as the accessible name, making the announcement unreliable; and `KnotServer.tsx:246-252` has
   no live region at all. Solution: state in a sibling `<span role="status">`, outside the
   button.

4. **Decorative** — `aria-hidden="true"` on `hero__install-dots` (`Hero.tsx:71-75`),
   `demo__frame-bar` (`Demo.tsx:42-46`), `knotserver__code-dots` (`KnotServer.tsx:240-244`).

5. **Semantic lists** — `.footer__langs` and `.footer__col` render collections without
   `<ul>/<li>`; link groups should go in `<nav aria-label="…">`.

6. **Named landmarks** — `aria-labelledby` on each `<section id="…">` pointing to its `h2`.
   Cheap and high-value for agentic landmark navigation.

7. **Consistency** — `Demo.tsx:40-57` uses `<p class="demo__label">`, while
   `KnotServer.tsx:276-297` already uses `<figure>/<figcaption>` correctly. Unify to `<figure>`.

### Acceptance criteria

- [ ] `curl -I https://www.knot.kz/llms.txt` → `200` + `content-type: text/plain`.
- [ ] Nonexistent routes → real `404`.
- [ ] `llms.txt` audit green.
- [ ] **Agentic Browsing = 3/3.**
- [ ] CLS still 0 (one of the three scoreable audits).

---

## Phase 3 — Imperative API + live panel

*Turns "WebMCP tools registered" and "WebMCP schemas are valid" from N/A into populated and
valid.*

### 3.1 State outside React

**`src/state/installationStore.ts`** (new) — minimal external store, consumed with
`useSyncExternalStore` (the correct React 19 primitive; avoids the antipattern of subscribing
from `useEffect`).

```ts
export const installationStore = {
  subscribe(cb: () => void): () => void
  getSnapshot(): { activeTab: Product }
  setActiveTab(tab: Product): void
}
```

`Installation.tsx:479` loses its local `useState`. Keep the existing `useTransition`.

> **Slide:** *"the agent cannot call your `useState`"*. Exposing a capability to an entity
> without a UI forces the state out of the component. It is the same architectural pressure as
> Phase 1, now applied to state instead of data.

### 3.2 The five tools

`src/webmcp/tools/`, one per file, all on top of `src/data/`:

| # | Tool | Input schema | `readOnlyHint` | Role in the talk |
|---|---|---|---|---|
| 1 | `list-supported-languages` | `{}` | `true` | The minimal viable tool. Warm-up |
| 2 | `get-latest-releases` | `{ product?: 'knot'\|'knot-server'\|'all', limit?: 1..10 }` | `true` | **The pure AEO case**: structured JSON instead of scraping |
| 3 | `search-knot-capabilities` | `{ query: string, area?: 'cli'\|'server' }` | `true` | Search over features |
| 4 | `compare-knot-editions` | `{}` | `true` | Complex structured answer |
| 5 | `get-install-command` | `{ product, method: 'curl'\|'docker'\|'compose', tuning?: { cores, ramGb } }` | ⚠️ gray zone | **Mutates the UI** |

**#5 is the pedagogical piece.** It does not just return the command: it calls
`installationStore.setActiveTab()` and scrolls to `#install`. It demonstrates what the
declarative API **cannot** do and therefore justifies the imperative one's existence.

It also carries an honest ambiguity worth bringing on stage: it mutates the UI but not
persistent state. `readOnlyHint: true` or not? The spec does not settle it. **Teaching a real
gray zone is more credible than pretending the spec covers everything.**

Naming convention: actionable, specific verbs (`get-`, `list-`, `search-`, `compare-`), as the
talk itself recommends in its Phase 5.

### 3.3 `src/webmcp/schemas.ts`

JSON Schemas as typed constants, with the TypeScript type **derived from the schema** (or vice
versa) so implementation and schema cannot diverge. The *"WebMCP schemas are valid"* audit
depends on this.

### 3.4 The `AgentTools` panel

**`src/webmcp/invocationLog.ts`** — circular buffer of the last ~20 invocations
(`{ id, tool, args, result, ms, ts }`), pub/sub consumed with `useSyncExternalStore`. A
`withLogging(tool)` decorator wraps each `execute` without polluting the tool logic.

**`src/components/AgentTools.tsx`** + **`src/styles/AgentTools.css`**:

- **Always visible:** informational section listing the exposed tools with name, description and
  schema. Legitimate for a human reader and on-brand.
- **Conditional** (`navigator.modelContext` present or `?agent-debug` in the URL): live log that
  lights up on every invocation.

**Stage value:** the audience **sees the invocation happen**. They do not have to take the
speaker's word for it.

**Integration:** `lazy()` + `<Suspense>` in `App.tsx` following `:7-11`, nav entry in
`Header.tsx`, and `scroll-padding-top: 80px` from `global.css` solves the offset for free.
Reuse `.reveal` and the existing tokens; do not introduce new tokens.

### Acceptance criteria

- [ ] The 5 tools appear listed in the Lighthouse report.
- [ ] *"WebMCP schemas are valid"* with no errors or warnings.
- [ ] In a non-supporting browser the site works identically and the panel does not show the
      log.
- [ ] Navigating away, the `AbortSignal` unregisters the tools (verifiable in the inspector).
- [ ] No regression in the 4 scores nor CLS.

---

## Phase 4 — Declarative API: contact form

*Turns "WebMCP form coverage" from N/A into covered.*

### 4.1 `src/components/Contact.tsx`

```html
<form toolname="contact-knot-team"
      tooldescription="Send a message to the Knot maintainers about support,
                       bug reports or general questions."
      action="/api/contact" method="post">
  <input name="email" type="email" required
         toolparamtitle="Email"
         toolparamdescription="Reply-to address of the person contacting the team" />
  <select name="topic"
          toolparamdescription="Category: support | bug | other">
  <textarea name="message" required
            toolparamdescription="Body of the message" />
  <input name="company_website" class="contact__hp" tabindex="-1" autocomplete="off" />
  <button type="submit">Send message</button>
</form>
```

**No `toolautosubmit`**: the browser fills the fields but requires the human to press send.
Native human-in-the-loop, **without a single line of JavaScript**. It is the exact contrast
against Phase 3 and the heart of the declarative segment of the talk.

### 4.2 The honeypot — a gift for the talk

Field `company_website`, hidden by CSS, `tabindex="-1"`, `autocomplete="off"` and — crucially —
**without `toolparamdescription`**.

A cooperative Web-MCP agent **never sees it**: it does not enter the JSON Schema the browser
generates, leaves it empty, and passes the filter. A visual scraper that fills everything it
finds in the DOM fills it and gets blocked.

> **Web-MCP structurally separates the cooperative agent from adversarial scraping.**
> This *demonstrates* live — instead of merely asserting — the talk's argument that Web-MCP does
> not trigger CAPTCHAs or anti-bot shields.

### 4.3 `functions/api/contact.ts` (Cloudflare Pages Function)

**Why Pages Functions and not Formspree:** same origin ⇒ `form-action 'self'` and
`connect-src 'self'` hold ⇒ **the CSP is untouched**. That is the entire reason.

Implementation details that cannot be glossed over:

- **Real navigation.** A declarative form without JS causes a real navigation. The function must
  respond **`303 See Other` → `/?contact=ok#contact`**, and `Contact.tsx` reads the query param
  to paint the success state. The same-origin redirect also satisfies `form-action 'self'`.
- **Content type.** The native submit arrives as `application/x-www-form-urlencoded`; use
  `await request.formData()`, not `request.json()`.
- **Server-side validation always**, with structured JSON error responses (which is also what
  the agent needs to be able to react).
- **Typing.** `tsconfig.json` has `include: ["src"]`, so the build's `tsc` **does not check
  `functions/`**. Create `functions/tsconfig.json` with `@cloudflare/workers-types` and add
  `tsc -p functions` to CI, or the code sneaks in untyped.
- **Rate limiting.** The function is stateless: the natural fit on Cloudflare is a Rate Limiting
  rule in the dashboard, not code.

### 4.4 Email delivery: Resend

- Endpoint: `POST https://api.resend.com/emails`, header
  `Authorization: Bearer ${env.RESEND_API_KEY}`.
- Environment variables on Cloudflare Pages: `RESEND_API_KEY`, `CONTACT_TO_EMAIL`.
- `from: noreply@knot.kz`, `to: env.CONTACT_TO_EMAIL`, `reply_to: <form email>`.
- ⚠️ **Critical path:** Resend requires **DNS-verifying the `knot.kz` domain** to send from
  `@knot.kz`. With the test sender `onboarding@resend.dev` email can only go to the account
  itself. **Start the DNS verification well ahead of time, not the week of the talk.**
- MailChannels is discarded: it stopped being free for Cloudflare Workers in 2024.

### 4.5 Integration

`lazy()` + `<Suspense>` in `App.tsx`, before the `Footer`. Nav entry in `Header.tsx`.

> ⚠️ With `AgentTools` and `Contact`, the nav goes from 5 to 7 entries. Review mobile behavior
> (`max-width: 768px`) and consider not adding both to the nav.

### Acceptance criteria

- [ ] *"WebMCP form coverage"* leaves N/A.
- [ ] Complete end-to-end submission: email received with correct `reply_to`.
- [ ] Without JavaScript, the form works (native submit + 303).
- [ ] No change to `public/_headers`.
- [ ] The honeypot blocks a POST that brings it filled.

---

## Phase 5 — Trust boundaries

### `requestUserInteraction()`

Applied to **copying the install command to the clipboard**.

Justification for the choice: `clipboard.write` **requires transient user activation**, so here
consent is not ceremony but a real technical requirement. More honest than inventing a
destructive action on a site with no database.

Flow: the agent invokes → `requestUserInteraction()` pauses execution → confirmation modal → the
human decision determines whether the clipboard write happens → structured result back to the
agent.

### Pseudoclasses

`:tool-form-active` and `:tool-submit-active` in `Contact.css`, to give visual feedback while
the LLM fills the form in the background.

Mandatory to follow the `.reveal` precedent in `global.css`:
- Fallback with `@supports not (selector(:tool-form-active))`.
- Respect `@media (prefers-reduced-motion: reduce)`.
- Use the existing tokens (`--accent: #58a6ff` for "in progress", `--green: #3fb950` for
  "completed"). Do not introduce new colors.

### Acceptance criteria

- [ ] The consent modal effectively blocks the action until the human decision.
- [ ] The styles degrade cleanly in browsers without the pseudoclasses.
- [ ] `prefers-reduced-motion` respected.

---

## Phase 6 — AEO, SEO and technical debt

| Task | Detail |
|---|---|
| **JSON-LD** | `SoftwareApplication` + `Organization` in `index.html`, generated from `src/data/site.ts` by `generate-agent-assets.mjs`. Today there is none. Verify that `script-src 'self'` does not block the `application/ld+json` block (it should not, being data and not executable code, but it must be checked with the real header) |
| **Broken `og:image`** | `index.html` points to `https://www.knot.kz/logo.png`, a **nonexistent file**. Generate `public/og-image.png` at 1200×630 and add it to the `pnpm optimize-images` chain (sharp-cli) |
| **`sitemap.xml`** | Add `<lastmod>`, generated at build time |
| **`README.md`** | Document `scripts/fetch-updates.mjs`, the `prebuild` hook, `generate-agent-assets.mjs`, `audit-agentic.mjs`, the Updates section, AgentTools, Contact and deployment |
| **`.well-known/webmcp.json`** | **Optional / downgraded.** With `llms.txt` already being a real audit, the speculative manifest adds little more than a discovery footnote. If included, label it explicitly as speculative |

### Acceptance criteria

- [ ] Rich Results Test validates the JSON-LD.
- [ ] Social preview (Twitter/OG) shows the image.
- [ ] The 4 Lighthouse scores maintained or improved.

---

## 12. Phase → talk timeline mapping

| Plan phase | Talk segment | Minutes |
|---|---|---|
| Phase 0 (baseline) + finding 3.2 | Segment 1 — Context and diagnosis | 00:00–08:00 |
| Phase 2 (llms.txt + soft-404) | **New proposed segment** — Agent Accessibility, the prior level | ~ +5 min |
| Phase 4 (declarative + honeypot) | Segment 2 — Live coding Declarative API | 08:00–18:00 |
| Phase 1 (refactor) + Phase 3 (imperative) | Segment 3 — Live coding Imperative API | 18:00–30:00 |
| Phase 5 | Segment 4 — Trust boundaries and security | 30:00–38:00 |
| Phase 6 + limitations | Segment 5 — Best practices and limitations | 38:00–45:00 |

### Slides this work generates

1. **"The agent cannot call your `useState`"** — Phase 3.1.
2. **The forced refactor** — real before/after diff of Phase 1, in a production repo.
3. **The honeypot** — Web-MCP structurally distinguishes the cooperative agent from adversarial
   scraping.
4. **Your tools inside a Google Lighthouse report** — Phase 3.
5. **A single source of truth** for UI, tools, `llms.txt` and JSON-LD — the section 4 diagram.
6. **The `readOnlyHint` gray zone** in `get-install-command` — honesty about what the spec does
   not resolve.
7. **"I audited my site with my own contaminated browser"** — finding 3.2 as an anecdote about
   the fragility of measuring agentic environments.

### Recommended CFP adjustments

- Add the **Agent Accessibility** level to the abstract: it is the differentiator against the
  backend MCP talks of BiznagaFest 2025 and against the international circuit.
- Reframe the hook: Web-MCP is **no longer experimental** (Chrome 151 stable, Lighthouse audit
  in production). That reinforces the "competitive survival mandate" argument of the AEO
  section with verifiable evidence.

---

## 13. Risks

| # | Risk | Mitigation |
|---|---|---|
| 1 | **Contaminated browser profile** — the #1 risk of both measurement and the live demo, and it has already produced a false positive | Clean, dedicated Chrome profile for the stage. Audits always headless with `--disable-extensions` |
| 2 | **The spec is still a Community Group Draft** despite being in stable Chrome; names may change before November | All API contact confined to `src/webmcp/`, a single edit point. Re-verify against the spec the week before |
| 3 | **Firefox and Safari do not implement Web-MCP** | Feature-detect in `useWebMcp`; the site stays inert and safe. A polyfill would have to be bundled (never a CDN, due to `script-src 'self'`) and loaded via dynamic `import()` under opt-in to avoid penalizing Core Web Vitals |
| 4 | **Phase 1 is a large refactor without a test suite** (no vitest nor playwright) | Small per-component commits, visual verification, and before/after Lighthouse score comparison |
| 5 | **Resend DNS verification** is the critical path of Phase 4 | Start it at the beginning of Phase 3, not when reaching Phase 4 |
| 6 | **Performance regression**: the site starts at 100/92/92/100 and CLS 0 | Re-audit all five categories when closing each phase, not just *agentic browsing* |
| 7 | **Live demo dependent on an external agent** | Recorded video plan B for every demo |

---

## 14. Decisions made

| Decision | Choice | Reason |
|---|---|---|
| Form backend | **Cloudflare Pages Function** (`functions/api/contact.ts`) | Same origin ⇒ the CSP is untouched |
| Email provider | **Resend** | 3,000 free emails/month, simple API. Requires DNS verification of `knot.kz` |
| Agent Tools section | **Complete, with live invocation log** | Maximum stage value; informative and on-brand for the human visitor |
| Scope | **Phases 0 through 6 complete** | — |
| Reading data from Node | **esbuild** (already present as a Vite dep) | No new dependencies and no Node version risk on Cloudflare |
| `.well-known/webmcp.json` | **Downgraded to optional** | `llms.txt` is a real audit; the manifest is speculative |
| ARIA work (2c) | **Kept but labeled as not audit-driven** | Honesty: the audit does not confirm it. It remains a legitimate improvement |

---

## 15. Execution checklist

### Phase 0 — Instrumentation
- [ ] `scripts/audit-agentic.mjs` with `--disable-extensions`
- [ ] `package.json`: `audit:agentic` script
- [ ] `.gitignore`: `+ .lighthouse/`
- [ ] `src/webmcp/types.ts`
- [ ] `src/webmcp/useWebMcp.ts`
- [ ] **Clean-profile baseline + verdict on hypothesis 3.2**

### Phase 1 — Refactor
- [ ] `src/data/types.ts`
- [ ] `src/data/features.ts` + `src/icons/featureIcons.tsx` + update `Features.tsx`
- [ ] `src/data/serverFeatures.ts` + `src/icons/serverIcons.tsx` + update `KnotServer.tsx`
- [ ] `src/data/install.ts` + update `Installation.tsx`
- [ ] `src/data/languages.ts` + update `Footer.tsx`
- [ ] `src/data/site.ts`, `src/data/index.ts`
- [ ] Verify identical render and unchanged scores

### Phase 2 — Agent Accessibility
- [ ] `scripts/generate-agent-assets.mjs` (esbuild + llms.txt) hooked to `prebuild`
- [ ] `public/404.html` and status code verification
- [ ] (Optional 2c) ARIA tabs, `aria-expanded`, `CopyButton`, `aria-hidden`, lists,
      `aria-labelledby`, `<figure>`
- [ ] **Audit: 3/3**

### Phase 3 — Imperative
- [ ] `src/state/installationStore.ts` + refactor of `Installation.tsx`
- [ ] `src/webmcp/schemas.ts`
- [ ] The 5 tools in `src/webmcp/tools/`
- [ ] `src/webmcp/registry.ts`, `src/webmcp/invocationLog.ts`
- [ ] `src/components/AgentTools.tsx` + `src/styles/AgentTools.css`
- [ ] `App.tsx` (lazy+Suspense) and `Header.tsx` (nav)
- [ ] Verify tools listed in Lighthouse and schemas valid

### Phase 4 — Declarative
- [ ] **Start Resend DNS verification (do it at the beginning of Phase 3)**
- [ ] `src/components/Contact.tsx` + `src/styles/Contact.css`
- [ ] `functions/api/contact.ts` + `functions/tsconfig.json`
- [ ] `@cloudflare/workers-types` in devDependencies; `tsc -p functions` in CI
- [ ] Environment variables on Cloudflare Pages
- [ ] Rate Limiting rule in the dashboard
- [ ] End-to-end test, with and without JavaScript

### Phase 5 — Trust boundaries
- [ ] `requestUserInteraction()` in the clipboard flow
- [ ] `:tool-form-active` / `:tool-submit-active` with `@supports` and `prefers-reduced-motion`

### Phase 6 — AEO and debt
- [ ] JSON-LD generated
- [ ] `public/og-image.png` 1200×630 + `index.html` correction
- [ ] `<lastmod>` in `sitemap.xml`
- [ ] `README.md` updated
- [ ] Final audit of all five categories

---

## Annex — Verified references

- **Declarative API:** `toolname` (required), `tooldescription` (required), `toolparamtitle`,
  `toolparamdescription`, `toolautosubmit`.
- **Imperative API:** `navigator.modelContext.registerTool(tool, options)` with lifecycle managed
  via `AbortSignal`. Tool object: `name`, `description`, `inputSchema`, `annotations`
  (`readOnlyHint`), `execute`.
- **Spec status:** W3C Web Machine Learning Community Group Draft Community Group Report.
  **Not** on the W3C Standards Track.
- **Support:** Chrome 151 in stable (no flag). Lighthouse includes the *Agentic Browsing*
  category, marked as *"still under development and subject to change"*.
- **`llms.txt` requirements per the audit:** at least one H1, links in Markdown format,
  substantial content.
