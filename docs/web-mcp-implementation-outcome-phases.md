# Web-MCP — Implementation phase log

> Record of what was implemented in each phase of the `docs/PLAN-WEBMCP.md` plan, to
> document the generated code for the talk (BiznagaFest 2026).

---

## Phase 0 — Instrumentation & foundations ✅

*Goal: measure reliably and have the type layer ready. No visible change.*

### Files

| File | Action | Contents |
|---|---|---|
| `scripts/audit-agentic.mjs` | new | Lighthouse CLI wrapper. Boots `vite preview` (4173) when no URL is passed, runs headless with `--disable-extensions` + clean profile, audits 5 categories (agentic-browsing, performance, accessibility, best-practices, seo), writes JSON+HTML to `.lighthouse/<phase>/` |
| `package.json` | modified | `"audit:agentic": "node scripts/audit-agentic.mjs"` + `lighthouse@13.4.1` devDependency |
| `.gitignore` | modified | `+ .lighthouse/` |
| `src/webmcp/types.ts` | new | `JSONSchema`, `WebMcpToolResult`, `WebMcpTool` and declaration merging: `navigator.modelContext` declared **optional on purpose** (the type system forces every consumer to feature-detect) |
| `src/webmcp/useWebMcp.ts` | new | Hook `useWebMcp(tools): boolean` — single `AbortController`, registration per tool, cleanup via `abort()` (tab-bound lifecycle) |

### Verification

- `pnpm build && pnpm lint` pass with no behavior changes.
- Baseline on a clean profile in `.lighthouse/phase-0/`:
  - Scores: performance 98 · accessibility 96 · best-practices 96 · seo 100
  - **`agent-accessibility-tree` = PASS** ⇒ hypothesis 3.2 confirmed: the original FAIL was
    injected by a browser extension, not by knot-site code
  - `llms-txt` = FAIL (expected, fixed in Phase 2)
  - WebMCP: 3 audits unscored (populated in Phases 3-4)
  - CLS = PASS

### Files changed in this phase

- `scripts/audit-agentic.mjs` (new)
- `package.json` (modified)
- `.gitignore` (modified)
- `src/webmcp/types.ts` (new)
- `src/webmcp/useWebMcp.ts` (new)

---

## Phase 1 — Decouple data from presentation ✅

*The core refactor. Pure, serializable data with no JSX or React, in `src/data/`.*

### Files

| File | Action | Contents |
|---|---|---|
| `src/data/types.ts` | new | `Feature`, `Snippet`, `InstallOption`, `InstallSection`, `Product` (`'knot' \| 'server'`) |
| `src/data/features.ts` | new | 6 features extracted from `Features.tsx` with kebab-case `id`s |
| `src/data/serverFeatures.ts` | new | 9 features extracted from `KnotServer.tsx`, same shape |
| `src/data/install.ts` | new | `knotSections` (4 steps) + `knotServerSections` (7 steps) extracted from `Installation.tsx` |
| `src/data/languages.ts` | new | 14 languages extracted from `Footer.tsx` (`as const`) |
| `src/data/site.ts` | new | `site` (name, url, tagline, repos, Docker image), install commands and `dockerRunCommand` |
| `src/data/index.ts` | new | Barrel for the build-time generators (Phases 2/6) |
| `src/icons/featureIcons.tsx` | new | `Record<FeatureId, ReactNode>` with `FeatureId` derived from the data |
| `src/icons/serverIcons.tsx` | new | `Record<ServerFeatureId, ReactNode>`, same contract |
| `src/components/Features.tsx` | refactor | consumes `features` + `featureIcons`, keyed by `id` |
| `src/components/KnotServer.tsx` | refactor | consumes `serverFeatures` + `serverIcons` + `dockerRunCommand` |
| `src/components/Installation.tsx` | refactor | consumes `knotSections` / `knotServerSections`, tab typed with `Product` |
| `src/components/Footer.tsx` | refactor | consumes `languages` + `site.tagline` |
| `src/components/Hero.tsx` | refactor | install command sourced from `site.ts` |

### Design decisions

- **The type as a contract**: `Record<FeatureId, ReactNode>` — adding a feature without its
  icon breaks the build (enforced for real by `noUnusedLocals` + `tsc` in the build).
- **Deduplication of duplicated data**: `dockerRunCommand` was duplicated in `KnotServer.tsx`
  and `Installation.tsx`; it now lives in `site.ts`.
- **Detail found during verification**: the install command in `Installation` uses `\` +
  line break (shell continuation) while the `Hero` one is single-line. Modeled with two
  constants (`knotInstallCommand` vs `knotInstallSnippet`) to keep the render untouched.
- **Byte-identical verification**: built the old version (`git stash`) and the new one,
  dumped the DOM of both with headless Chrome, diffed with normalization (excluding the
  updates feed, which is dynamic by design) → `IDENTICAL`.

### Verification

- `pnpm build && pnpm lint` pass.
- Zero `react` imports in `src/data/**`; no component imports data from another component.
- Lighthouse scores unchanged (`.lighthouse/phase-1/`): **98 / 96 / 96 / 100**.
  Agentic browsing still 67 (`llms.txt` pending from Phase 2).

### Files changed in this phase

- `src/data/types.ts` (new)
- `src/data/features.ts` (new)
- `src/data/serverFeatures.ts` (new)
- `src/data/install.ts` (new)
- `src/data/languages.ts` (new)
- `src/data/site.ts` (new)
- `src/data/index.ts` (new)
- `src/icons/featureIcons.tsx` (new)
- `src/icons/serverIcons.tsx` (new)
- `src/components/Features.tsx` (refactor)
- `src/components/KnotServer.tsx` (refactor)
- `src/components/Installation.tsx` (refactor)
- `src/components/Footer.tsx` (refactor)
- `src/components/Hero.tsx` (refactor)

---

## Phase 2 — Agent Accessibility ✅

*This is where the score moves. No Web-MCP code required.*

### 2a — Generated `llms.txt` (the real fix)

- `scripts/generate-agent-assets.mjs` (new): build-time generator hooked to `prebuild` next to
  `fetch-updates.mjs`. Loads `src/data/*` via esbuild bundle + `data:` URL import (works on any
  Node version; esbuild declared as devDependency — it was already resolved by Vite, zero new
  packages) and writes `public/llms.txt`.
- Structure: H1 `# Knot`, blockquote intro, Products, Capabilities (from `features.ts`), Knot
  Server (from `serverFeatures.ts`), Supported languages (from `languages.ts`), Installation
  sections (from `install.ts`), Latest releases (from `updates.json`) and Documentation links.
  All links in Markdown `[text](url)` format; no bare URLs.
- Failure policy mirrors `fetch-updates.mjs`: never breaks the build.
- The same data that feeds the UI feeds `llms.txt` — the talk's thesis as a build step.

### 2b — The soft-404 behind it

- `public/404.html` (new): static page with the site's design tokens (inline `<style>`, allowed
  by `style-src 'unsafe-inline'`), `meta robots noindex`, link back home. Cloudflare Pages serves
  it automatically with a real 404 status.
- Verified locally: `/llms.txt` → `200` + `content-type: text/plain` (Vite preview).
  Production status codes to be confirmed after deploy.

### 2c — ARIA (quality work, NOT audit-driven)

Per the plan's honest labeling: none of these fix a failing audit; they improve the
accessibility tree that agents consume. Ordered by value:

1. **Installation tabs** — `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`,
   roving `tabIndex`, ArrowLeft/Right navigation, panels with `role="tabpanel"`,
   `aria-labelledby`, `tabIndex={0}` and `hidden` attribute (both panels always mounted;
   `.install__sections[hidden] { display: none }` to beat the author `display: flex`).
2. **Header disclosure** — `aria-expanded={menuOpen}` + `aria-controls="site-nav"`. The closed
   mobile nav was hidden with `transform`/`opacity` only, so its links stayed in the
   accessibility tree; added `visibility: hidden` with a delayed transition so the slide-up
   animation still shows.
3. **`CopyButton` unified** (`src/components/CopyButton.tsx`, new) — the copy+timeout logic
   triplicated in Hero/Installation/KnotServer now lives in one component. Copied state is a
   sibling `<span role="status">` OUTSIDE the button (a button's `aria-label` replaces its
   content as accessible name, making inner live regions unreliable). Generic `.copybutton`
   utilities in `global.css`; each usage keeps its pill styling on the wrapper.
4. **Decorative dots** — `aria-hidden="true"` on `hero__install-dots`, `demo__frame-bar`,
   `knotserver__code-dots`.
5. **Semantic lists** — footer columns are now `<nav aria-label="Resources|Ecosystem">` with
   `<ul>/<li>`; language tags are a real `<ul>` (14 `<li>`).
6. **Named landmarks** — `aria-labelledby` on every `<section id>` pointing to its heading
   (`hero-title`, `updates-title`, `features-title`, `demo-title`, `server-title`,
   `install-title`).
7. **Consistency** — Demo items unified to `<figure>/<figcaption>` like KnotServer.
8. **Bonus found by the audit**: `color-contrast` failed on `.knotserver__visual-url`
   (`--text-muted` #6e7681 = 3.76:1). Switched to `--text-secondary` → accessibility 96→100.

### Verification

- `pnpm build && pnpm lint` pass.
- Lighthouse (`.lighthouse/phase-2-final/`): performance 98 · **accessibility 100** (was 96) ·
  best-practices 96 · seo 100 · **agentic-browsing 100 (3/3)** — `llms-txt` PASS,
  `agent-accessibility-tree` PASS, `cumulative-layout-shift` PASS.
- Interactive checks in headless Chrome: arrow-key tab navigation moves focus + toggles panels;
  all 29 copy buttons render with sibling `role="status"`; pills keep their computed styles.
- Pending after deploy: `curl -I` on production for real 404 status and `llms.txt` content-type.

### Files changed in this phase

- `scripts/generate-agent-assets.mjs` (new)
- `public/llms.txt` (new, generated)
- `public/404.html` (new)
- `src/components/CopyButton.tsx` (new)
- `package.json` (modified: prebuild hook + esbuild devDependency)
- `src/styles/global.css` (modified: `.copybutton` utilities)
- `src/components/Hero.tsx` (modified)
- `src/components/Installation.tsx` (modified)
- `src/components/KnotServer.tsx` (modified)
- `src/components/Header.tsx` (modified)
- `src/components/Demo.tsx` (modified)
- `src/components/Footer.tsx` (modified)
- `src/components/Features.tsx` (modified)
- `src/components/Updates.tsx` (modified)
- `src/styles/Hero.css` (modified)
- `src/styles/Installation.css` (modified)
- `src/styles/KnotServer.css` (modified)
- `src/styles/Header.css` (modified)
- `src/styles/Footer.css` (modified)

---

## Phase 3 — Imperative API + live panel ✅

*Turns "WebMCP tools registered" and "WebMCP schemas are valid" from N/A into populated
and valid — in browsers that implement the API.*

### 3.1 State outside React

- `src/state/installationStore.ts` (new): minimal external store
  (`subscribe` / `getSnapshot` / `setActiveTab`) with a cached snapshot object for referential
  stability. Consumed with `useSyncExternalStore` — the correct React 19 primitive, not a
  useEffect subscription.
- `Installation.tsx` lost its local `useState`; the `useTransition` wrapper is kept. Slide:
  *"the agent cannot call your `useState`"*.

### 3.2 The five tools (`src/webmcp/tools/`)

All read from the `src/data/*` layer — same source of truth as the UI:

| Tool | Input | readOnlyHint | Role |
|---|---|---|---|
| `list-supported-languages` | `{}` | true | minimal viable tool |
| `get-latest-releases` | `{ product?, limit? }` | true | pure AEO: structured JSON instead of scraping |
| `search-knot-capabilities` | `{ query, area? }` | true | relevance-scored search over features |
| `compare-knot-editions` | `{}` | true | complex structured answer |
| `get-install-command` | `{ product, method, tuning? }` | **unset (gray zone)** | **mutates the UI**: switches the install tab via the store and scrolls to `#install` |

- #5's gray zone is deliberate: it mutates the UI but not persistent state, and the spec does
  not settle `readOnlyHint` for that case. Honest gray zone for the talk.
- Tuning maps `cores` → `KNOT_SERVER_RAYON_THREADS`, `ramGb` → `BATCH_SIZE × 16`.
- Scroll uses `setTimeout` instead of `requestAnimationFrame` (rAF is throttled in background
  tabs) and waits for the tab transition to commit; `scroll-padding-top: 80px` handles the
  fixed header offset for free.

### 3.3 Schemas derived types

- `src/webmcp/schemas.ts` (new): JSON Schemas as `as const satisfies JSONSchema` constants plus
  a `SchemaType<S>` conditional type that derives each tool's TypeScript input type FROM the
  schema — implementation and schema cannot diverge. `JSONSchema` made fully readonly to allow
  `as const`.

### 3.4 Live panel

- `src/webmcp/invocationLog.ts` (new): circular buffer (20 entries) of
  `{ id, tool, args, result, ms, ts, ok }` with pub/sub; `withLogging()` decorator wraps each
  tool's `execute` so tool logic stays clean.
- `src/webmcp/registry.ts` (new): `knotTools` — the five tools, all wrapped in `withLogging`.
- `src/components/AgentTools.tsx` + `src/styles/AgentTools.css` (new): always-visible section
  listing the tools (name, description, read-only / mutates-UI badges, schema in `<details>`);
  live log shown when `navigator.modelContext` exists or `?agent-debug` is in the URL.
  Uses only existing tokens.
- Integrated in `App.tsx` with `lazy()` + `<Suspense>` (project pattern) and `Tools` nav entry
  in `Header.tsx`.

### Type detail

`WebMcpTool.execute` uses method syntax so typed tools stay assignable to `WebMcpTool<unknown>`
(the shape the browser runtime sees) — method bivariance is the deliberate trust boundary.

### Verification

- `pnpm build && pnpm lint` pass.
- End-to-end via dev server + dynamic import: `get-install-command` switches the tab (store),
  scrolls to `#install` (verified top = 80px scroll-padding offset), returns the tuned command
  (`cores: 8, ramGb: 2` → `RAYON_THREADS=8`, `BATCH_SIZE=32`).
- Invocation log records registry-level calls (4 entries verified with args/ms/status).
- Feature-detect verified: this Chrome 151 build does not expose `navigator.modelContext`, so
  the panel shows "not supported" and the site works identically — acceptance criterion met.
  The three WebMCP audits remain `unscored` here; they will populate on a browser/flag combo
  with the API (re-run the audit at talk time).
- Lighthouse (`.lighthouse/phase-3/`): performance 98 · accessibility 100 · best-practices 96 ·
  seo 100 · agentic-browsing 100 (3/3), CLS PASS.

### Fix applied along the way

- Footer column titles `h4` → `h2`: the new Agent Tools `h2` created an
  `h4 → h2 → h4` sequence that failed the `heading-order` audit (accessibility dropped to 99).
  `h2` is always valid regardless of what precedes it.

### Files changed in this phase

- `src/state/installationStore.ts` (new)
- `src/webmcp/schemas.ts` (new)
- `src/webmcp/invocationLog.ts` (new)
- `src/webmcp/registry.ts` (new)
- `src/webmcp/tools/format.ts` (new)
- `src/webmcp/tools/listSupportedLanguages.ts` (new)
- `src/webmcp/tools/getLatestReleases.ts` (new)
- `src/webmcp/tools/searchKnotCapabilities.ts` (new)
- `src/webmcp/tools/compareKnotEditions.ts` (new)
- `src/webmcp/tools/getInstallCommand.ts` (new)
- `src/components/AgentTools.tsx` (new)
- `src/styles/AgentTools.css` (new)
- `src/webmcp/types.ts` (modified: readonly JSONSchema + method-syntax execute)
- `src/components/Installation.tsx` (modified: useSyncExternalStore)
- `src/components/Footer.tsx` (modified: h4 → h2)
- `src/styles/Footer.css` (modified)
- `src/App.tsx` (modified: AgentTools section)
- `src/components/Header.tsx` (modified: Tools nav entry)

---

## Phase 4 — Declarative API: contact form ✅

*Turns "WebMCP form coverage" from N/A into covered — in browsers that implement the API.*

### 4.1 `src/components/Contact.tsx`

- Declarative form, zero JavaScript for submission:
  `toolname="contact-knot-team"` + `tooldescription` on `<form>`,
  `toolparamtitle`/`toolparamdescription` on email/select/textarea.
- **No `toolautosubmit`**: the browser (or agent) fills the fields, a human presses Send.
  Native human-in-the-loop — the exact contrast with Phase 3.
- The Web-MCP attributes are spread into the JSX (`as const` objects): they are not standard
  HTML attributes, React passes unknown props through, and spreading keeps them type-safe
  without a `declare module 'react'` augmentation (which trips
  `@typescript-eslint/no-unused-vars` on the unused generic `T`).
- Success state: after the real navigation the component reads `?contact=ok` and shows a
  `role="status"` message; `history.replaceState` cleans the URL.

### 4.2 The honeypot — a gift for the talk

- Field `company_website`, hidden by CSS, `tabindex="-1"`, `autocomplete="off"` and —
  crucially — **without `toolparamdescription`**: it never appears in the JSON Schema the
  browser generates. A cooperative Web-MCP agent never sees it; a visual scraper that fills
  every input gets blocked by the server. Web-MCP structurally separates cooperative agents
  from adversarial scraping — demonstrated, not asserted.

### 4.3 `functions/api/contact.ts` (Cloudflare Pages Function)

- Same origin ⇒ `form-action 'self'` + `connect-src 'self'` hold ⇒ **the CSP is untouched**
  (acceptance criterion).
- `application/x-www-form-urlencoded` → `request.formData()` (not `request.json()`).
- Honeypot check → 400 `spam-detected`; server-side validation always, with structured JSON
  errors (`validation-failed` + `fields` map — what an agent needs to react to a failure);
  missing env → 503; delivery failure → 502.
- Success → **303 See Other** → `/?contact=ok#contact` (same origin, satisfies `form-action`).
- Email via Resend: `Authorization: Bearer ${env.RESEND_API_KEY}`,
  `from: noreply@knot.kz`, `to: env.CONTACT_TO_EMAIL`, `reply_to: <form email>`.
- Rate limiting is a Cloudflare dashboard rule (stateless function), not code.

### 4.4 Typing & CI

- `functions/tsconfig.json` (new): `@cloudflare/workers-types`, strict. The root
  `tsconfig.json` only includes `src`, so `tsc -p functions` was added as
  `typecheck:functions` script and to the CI workflow (after `pnpm build`).
- `@cloudflare/workers-types` devDependency.

### 4.5 Integration

- `lazy()` + `<Suspense>` in `App.tsx` before the Footer; `Contact` nav entry in `Header.tsx`
  (7 entries now — the mobile menu is a vertical dropdown, verified fine).

### Verification

- `pnpm build && pnpm lint && pnpm typecheck:functions` pass.
- Function logic tested locally (esbuild-bundled handler + mocked `fetch`): 10/10 tests —
  valid → 303 + email delivered with `reply_to`; honeypot → 400 and no email sent; invalid
  email / short message / unknown topic → 400 `validation-failed` with `fields`; missing env →
  503; non-form body → 400.
- DOM check: `toolname`/`tooldescription` present, no `toolautosubmit`, honeypot hidden with
  no `toolparamdescription`, form posts to `/api/contact`.
- Lighthouse (`.lighthouse/phase-4/`): performance 98 · accessibility 100 ·
  best-practices 96 · seo 100 · agentic-browsing 100 (3/3), CLS PASS. The three WebMCP audits
  remain `unscored` in this Chrome (no `modelContext`); re-audit at talk time on a supporting
  browser.
- `public/_headers` unchanged.

### Pending ops (documented for the deployment checklist)

- Resend DNS verification for `knot.kz` (do it well before the talk).
- Cloudflare env vars: `RESEND_API_KEY`, `CONTACT_TO_EMAIL`.
- Rate Limiting rule in the Cloudflare dashboard for `/api/contact`.

### Files changed in this phase

- `src/components/Contact.tsx` (new)
- `src/styles/Contact.css` (new)
- `functions/api/contact.ts` (new)
- `functions/tsconfig.json` (new)
- `package.json` (modified: `typecheck:functions` script + `@cloudflare/workers-types` devDep)
- `.github/workflows/ci.yml` (modified: `pnpm typecheck:functions` step)
- `src/App.tsx` (modified: Contact section)
- `src/components/Header.tsx` (modified: Contact nav entry)
- `src/webmcp/types.ts` (modified: removed the JSX augmentation attempt — spread approach used instead)

---

## Phase 5 — Trust boundaries ✅

### `requestUserInteraction()` + consent modal (tool #6)

- `src/state/consentStore.ts` (new): pending consent request store (promise-based
  `request(reason)` / `respond(approved)`), consumed with `useSyncExternalStore`.
- `src/components/ConsentModal.tsx` + `src/styles/ConsentModal.css` (new): `role="dialog"`
  `aria-modal="true"` overlay mounted globally in `App.tsx`. Autofocus on Allow, Escape = Deny,
  focus restored to the previously focused element on close.
- `src/webmcp/tools/copyInstallCommand.ts` (new): tool #6 `copy-install-command`
  (`{ product?: 'knot' | 'knot-server' }`, `readOnlyHint: false` → "side effect" badge).
  Flow: `navigator.modelContext.requestUserInteraction()` pauses the agent → consent modal →
  only an explicit Allow (a real user activation, preserved through the promise chain) lets
  `clipboard.write` succeed → structured result either way.
- Honest justification for the choice: `clipboard.write` requires transient user activation,
  which an agent does not have — consent here is a technical requirement, not ceremony. No
  destructive action was invented on a site with no database.
- Without `requestUserInteraction`, the tool degrades to a structured error.

### Pseudoclasses `:tool-form-active` / `:tool-submit-active`

- `Contact.css`: while an agent fills a field → accent border + pulsing shadow (accent =
  "in progress"); while an agent submits → green background + green pulse ("completed").
  Existing tokens only, no new colors.
- Follows the `.reveal` precedent: `@supports not (selector(:tool-form-active))` fallback
  (static 3px accent border-left on fields — a permanent marker when dynamic feedback is
  impossible) and `@media (prefers-reduced-motion: reduce)` disables the animations.

### AgentTools badge semantics

- Badge logic updated to distinguish the three `readOnlyHint` states: `true` → "read-only",
  `false` → "side effect", unset → "readOnlyHint unset" (the honest gray zone of tool #5).

### Verification

- `pnpm build && pnpm lint` pass.
- Live checks via dev server:
  - Consent modal: opens with `role="dialog"`/`aria-modal`, autofocus on Allow, Allow
    resolves `true` and closes; Escape resolves `false` and closes.
  - `copy-install-command` without `requestUserInteraction` → structured error.
  - Badges: 4× read-only, 1× "readOnlyHint unset", 1× "side effect".
  - Fallback CSS applied in this Chrome (`:tool-form-active` unsupported → 3px accent
    border-left verified via computed style).
- Lighthouse (`.lighthouse/phase-5/`): performance 98 · accessibility 100 · best-practices 96
  · seo 100 · agentic-browsing 100 (3/3), CLS PASS.

### Files changed in this phase

- `src/state/consentStore.ts` (new)
- `src/components/ConsentModal.tsx` (new)
- `src/styles/ConsentModal.css` (new)
- `src/webmcp/tools/copyInstallCommand.ts` (new)
- `src/webmcp/schemas.ts` (modified: `copyInstallCommandSchema`)
- `src/webmcp/registry.ts` (modified: tool #6)
- `src/components/AgentTools.tsx` (modified: badge semantics)
- `src/styles/AgentTools.css` (modified: `--muted` badge)
- `src/styles/Contact.css` (modified: pseudoclasses + fallback + reduced motion)
- `src/App.tsx` (modified: ConsentModal mount)

---

## Phase 6 — AEO, SEO & technical debt ✅

### JSON-LD (generated)

- `generate-agent-assets.mjs` now injects `Organization` + two `SoftwareApplication`
  (Knot + Knot Server) blocks into `index.html` between `json-ld:start` / `json-ld:end`
  markers (idempotent replacement). Everything derives from the shared data layer:
  `site.ts` (added `description` field), `features.ts` / `serverFeatures.ts` for
  `featureList`, and `updates.json` for `softwareVersion` (1.6.2 / 0.3.1 at build time).
- Verified: valid JSON, `@graph` with 3 nodes, present in `dist/index.html` and in the
  served DOM. CSP note: `application/ld+json` is data, not executable code — not blocked
  by `script-src 'self'` (final confirmation with the real production header after
  deploy). The Lighthouse `structured-data` audit is manual; the Rich Results Test runs
  against the deployed URL.

### `og:image` fixed

- `scripts/generate-og-image.mjs` (new): composes an SVG (site background + grid, the
  logo, "Knot", tagline, knot.kz) and renders `public/og-image.png` 1200×630 with sharp
  (`sharp` declared as devDependency; already in the tree via sharp-cli). Added to the
  `optimize-images` chain.
- `index.html`: `og:image` / `twitter:image` now point to
  `https://www.knot.kz/og-image.png` (was the nonexistent `/logo.png`).

### Sitemap

- `generate-agent-assets.mjs` regenerates `public/sitemap.xml` with `<lastmod>` =
  build date.

### Technical debt paid

- **Duplicate React keys in Updates**: the feed can contain two entries with the same
  version (knot 1.6.1 twice in the CHANGELOG), and the key was `${repo}-${version}` —
  React logged "two children with the same key" (found via console during Phase 6
  verification). Key is now `${repo}-${version}-${index}`.

### README

- Rewritten: stack, prebuild generators (`fetch-updates.mjs`, `generate-agent-assets.mjs`),
  data layer, Web-MCP architecture (tools, schemas, consent, pseudoclasses), contact
  backend (`functions/`, env vars, rate limiting), `audit:agentic` usage, assets and
  deployment notes.

### Decision: `.well-known/webmcp.json` skipped

- Per the plan's own verdict ("degraded to optional"): `llms.txt` is a real Lighthouse
  audit, the manifest is speculative — it would add a discovery footnote at best. Not
  generated. Revisit if the spec changes.

### Verification

- `pnpm build && pnpm lint && pnpm typecheck:functions` pass.
- JSON-LD valid JSON, correct `@graph` types, versions derived from the live feed,
  `og-image.png` 1200×630 (87 KB, content verified by pixel sampling), sitemap with
  `lastmod`, README updated.
- Final Lighthouse (`.lighthouse/phase-6-final/`): **performance 98 · accessibility 100
  · best-practices 96 · seo 100 · agentic-browsing 100 (3/3)**, CLS PASS. The three
  WebMCP audits remain unscored in this Chrome (no `modelContext`).

### Pending after deploy

- `curl -I https://www.knot.kz/llms.txt` → 200 + `text/plain`; unknown route → real 404.
- Rich Results Test on the live URL for JSON-LD.
- Social preview check (Twitter/OG) with `og-image.png`.
- Resend DNS verification, Cloudflare env vars and rate-limiting rule (Phase 4).
- Re-audit on a browser with Web-MCP enabled to populate the three WebMCP audits.

### Files changed in this phase

- `scripts/generate-og-image.mjs` (new)
- `public/og-image.png` (new, generated)
- `scripts/generate-agent-assets.mjs` (modified: JSON-LD + sitemap)
- `src/data/site.ts` (modified: `description` field)
- `index.html` (modified: `og:image` fix + JSON-LD markers)
- `public/sitemap.xml` (modified: `<lastmod>`, regenerated)
- `src/components/Updates.tsx` (modified: unique React keys)
- `README.md` (rewritten)
- `package.json` (modified: `sharp` devDep + og-image in `optimize-images`)

---

## Phase 6 follow-up — CHANGELOG 1.6.2 ✅

*The knot CHANGELOG now starts with v1.6.2 ("Accurate Indexing Progress") and repeats the
v1.6.1 section twice (once after 1.6.2, once after 1.6.0). Two corrections:*

1. **Duplicate feed entries**: `scripts/fetch-updates.mjs` now deduplicates parsed sections by
   `repo|version|title` BEFORE applying the per-repo limit (per-repo counter, so the limit
   still yields 5 unique entries per repo). Previously the duplicated upstream section
   produced two identical "Varnish VCL Include Resolution" cards in the Updates section,
   `llms.txt` and JSON-LD `featureList`-adjacent release data.
2. **Latest version everywhere**: after regenerating, `updates.json`, `llms.txt` and the
   JSON-LD `softwareVersion` point to 1.6.2 / 0.3.1 (knot-server 0.3.2 is announced in the
   1.6.2 notes but not yet in its own CHANGELOG; the site reflects that automatically when
   it lands).

### Files changed in this follow-up

- `scripts/fetch-updates.mjs` (modified: per-repo dedupe before limit)
- `src/data/updates.json` (regenerated)
- `public/llms.txt` (regenerated)
- `index.html` (regenerated JSON-LD)
- `public/sitemap.xml` (regenerated)

---

## Phase 6 follow-up 2 — knot-server 0.3.2 ✅

*The knot-server CHANGELOG published 0.3.2 ("Bump `knot` to v1.6.2", 2026-08-15). No code
changes were needed: the site reflects it automatically through the prebuild pipeline.*

- `updates.json` now leads with knot 1.6.2 → knot-server 0.3.2.
- JSON-LD `softwareVersion`: Knot 1.6.2, Knot Server 0.3.2.
- `llms.txt` Latest releases updated accordingly; build + lint pass.

### Files changed in this follow-up

- `src/data/updates.json` (regenerated)
- `public/llms.txt` (regenerated)
- `index.html` (regenerated JSON-LD)
- `public/sitemap.xml` (regenerated)

---

## Phase 6 follow-up 3 — Tools & Contact as sub-pages ✅

*The Tools and Contact sections were taking landing-page space that belongs to the knot and
knot-server projects. Both are now standalone sub-pages reachable only from the top bar.*

### Routing (no new dependency)

- `src/state/router.ts` (new): hand-rolled hash router — `#/tools` and `#/contact` are pages,
  anything else is the landing page (in-page section anchors like `#install` keep working).
  `hashchange`-driven, consumed with `useSyncExternalStore`.
- `App.tsx` renders one of three trees: home sections / Tools page / Contact page. An effect
  scrolls to the section anchor on home or to the top on page changes.
- `Header.tsx`: Tools → `#/tools`, Contact → `#/contact`, logo → `#/`, `aria-current="page"`
  on the active page link. Section links navigate home and scroll from any sub-page.
- `.page` utility in `global.css` clears the fixed header on sub-pages.

### Tool registration moved to App

- `useWebMcp(knotTools)` now runs in `App` — tools register on EVERY page of the site, so an
  agent opening the landing page still gets all six tools. The Tools page remains the
  observability surface (tool list + live log).
- `useWebMcp.ts` exports `isWebMcpAvailable()` for non-hook consumers.

### Contact success flow

- `functions/api/contact.ts` now redirects `303 → /?contact=ok#/contact`; the Contact page
  reads the param, shows the success state and cleans the URL (kept `#/contact`).
- Function test suite updated (10/10 pass).

### CLS fix on sub-pages

- First sub-page audits: CLS **FAIL** (0.82) — the Suspense fallback at the top of the page was
  replaced by the full content, shoving the footer thousands of pixels. Fix: `AgentTools` and
  `Contact` are no longer lazy (their data is already in the main bundle via the registry,
  so the cost is negligible). Result: sub-pages now 99 / 100 / 100 with CLS PASS.

### Verification

- `pnpm build && pnpm lint && pnpm typecheck:functions` pass.
- Browser flow verified: home → Tools → Contact → logo → home; correct hashes, `aria-current`,
  section scroll with `scroll-padding-top` offset, zero console errors.
- Lighthouse: home unchanged (98 / 100 / 96 / 100 · agentic 100); `/#/tools` and `/#/contact`
  now **performance 99 · accessibility 100 · agentic-browsing 100 (3/3)**, CLS PASS.

### Files changed in this follow-up

- `src/state/router.ts` (new)
- `src/App.tsx` (modified: routing + global tool registration + eager pages)
- `src/components/Header.tsx` (modified: page links + aria-current)
- `src/components/AgentTools.tsx` (modified: page, uses isWebMcpAvailable)
- `src/components/Contact.tsx` (modified: page, #/contact cleanup)
- `src/webmcp/useWebMcp.ts` (modified: isWebMcpAvailable export)
- `src/styles/global.css` (modified: .page utility)
- `functions/api/contact.ts` (modified: redirect to #/contact)

---

## Phase 6 follow-up 4 — "Tools" renamed to "Agent Tools" ✅

*Top bar label and URL both renamed.*

- Nav link: "Tools" → **"Agent Tools"**; URL route: `#/tools` → **`#/agent-tools`**.
- `Page` union member renamed to `'agent-tools'`; section id on the page is now
  `agent-tools` (landmark label `agent-tools-title`).
- Verified in the browser: top bar label, hash, direct URL load (`/#/agent-tools`),
  `aria-current`, and the Contact route still work; build + lint pass.

### Files changed in this follow-up

- `src/state/router.ts` (modified: route + Page type)
- `src/components/Header.tsx` (modified: label + href + aria-current)
- `src/components/AgentTools.tsx` (modified: section/heading ids)
- `src/App.tsx` (modified: page key)
