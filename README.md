# knot-site

Landing page for [Knot](https://github.com/raultov/knot) and [Knot Server](https://github.com/raultov/knot-server).

## Stack

- **Vite** + **React 19** + **TypeScript**
- Plain CSS (no frameworks), design tokens in `src/styles/global.css`
- Responsive dark theme
- Optimized for Core Web Vitals (preloaded LCP image, GPU-composited animations, reduced CLS)

## Development

```bash
pnpm install
pnpm run dev
```

## Build

```bash
pnpm run build
```

`build` runs `tsc && vite build`. The `prebuild` hook runs two build-time generators
(both never break the build — on failure they warn and keep previous artifacts):

- `scripts/fetch-updates.mjs` — fetches the CHANGELOG and GitHub Releases API of `raultov/knot`
  and `raultov/knot-server`, parses them with two grammars, and writes
  `src/data/updates.json` (the Updates section feed). Three layers of failure tolerance.
- `scripts/generate-agent-assets.mjs` — generates the agent-facing assets from the SAME
  `src/data/*` layer that feeds the UI (loaded via esbuild bundle + `data:` URL import):
  - `public/llms.txt` (H1, Markdown links, substantial content — Lighthouse
    *Agentic Browsing* requirement)
  - JSON-LD (`Organization` + two `SoftwareApplication`) injected into `index.html`
    between the `json-ld:start` / `json-ld:end` markers
  - `public/sitemap.xml` with a `<lastmod>` of the build date

Preview the production build locally:

```bash
pnpm run preview
```

Output goes to `dist/`.

## Data layer

`src/data/*` holds pure, serializable data (no React, no JSX) consumed by four consumers:
the React components, the Web-MCP tools, `llms.txt`, and JSON-LD. Icons live in
`src/icons/` as `Record<FeatureId, ReactNode>` — adding a feature without an icon is a
compile error. Commands and URLs shared by several components live in `src/data/site.ts`.

`src/data/tokenEfficiency.ts` mirrors the measured token-efficiency table published in
the knot and knot-server READMEs (81.7% fewer tokens / 5.5× cheaper than grep + reading
the source, across nine real exploration tasks). It feeds the Token Efficiency section
below the Hero, the Hero proof badge, `llms.txt` and the meta description. When the
benchmark is re-run upstream, update the rows, the total and the corpus here.

## Web-MCP

The site is fully conformant with the W3C CG WebMCP best practices and Chrome security guidance (see `docs/web-mcp-implementation-plan.md` and `docs/web-mcp-implementation-outcome-phases.md`):

- `src/webmcp/` — types (`document.modelContext` / `navigator.modelContext`, optional on purpose so every consumer
  must feature-detect), `useWebMcp` registration hook (tab-bound `AbortController`
  lifecycle), JSON Schemas with TypeScript input types derived from them (`schemas.ts`),
  the tool set (`registry.ts`) and the invocation log (`invocationLog.ts`, circular buffer
  + `withLogging` decorator).
- `src/webmcp/tools/` — six tools: `list-supported-languages`, `get-latest-releases`,
  `search-knot-capabilities`, `compare-knot-editions`, `get-install-command` (mutates page UI
  state: switches install tab and scrolls; explicitly declares `readOnlyHint: false`), and
  `copy-install-command` (guarded by a consent modal; declares `consequentialHint: true`).
  The tools are registered on every page (`useWebMcp` in `App`); each invocation is recorded
  in the invocation log (`invocationLog.ts`).
- **Security & Annotations**: `get-latest-releases` declares `untrustedContentHint: true` because
  release summaries originate from GitHub CHANGELOG markdown (external data). `copy-install-command`
  declares `consequentialHint: true`. Read-only tools declare `readOnlyHint: true`. Tools default to same-origin exposure (`exposedTo` left unset).
- **Token Efficiency & Budgeting**: Output responses are formatted in compact JSON (`jsonText`).
  Every tool output is guaranteed to fit within our 1,350-character internal target (90% of Chrome's 1,500-char budget limit). `jsonTextFitting` provides structural safety for list outputs.
- **Strict Code Validation**: Inputs like `get-install-command`'s resource tuning (`cores: 1–64`, `ramGb: 1–128`) are validated strictly in execution code, returning actionable error messages so AI models can self-correct.
- **Budget Guard & Snapshot Auditing**: `pnpm audit:webmcp` (invoked automatically during `pnpm prebuild` and CI) verifies tool name length (≤30), description length (≤500), parameter description length (≤150), output size budgets, description overlap, and runs Nivel-A golden snapshots.
- **DevTools Debugging**: In DEV builds, `window.__knotWebMcp` exposes `{ tools, invocationLog }` in the browser console for manual inspection.
- The **Contact** form is declarative Web-MCP (`toolname`, `tooldescription`,
  `toolparam*` attributes — passed through JSX spreads). No `toolautosubmit`: the human
  always presses Send. The `company_website` field is a honeypot with an explicit
  `toolparamdescription` instructing agents NOT to fill it, turning it into an AI honeypot
  as well as a classic scraper trap.
- **Trust boundary**: `copy-install-command` calls `requestUserInput()` / `requestUserInteraction()` and shows a
  consent modal (`src/state/consentStore.ts` + `ConsentModal.tsx`) — `clipboard.write`
  requires transient user activation, so consent is a technical requirement, not ceremony.
- `Contact.css` styles the `:tool-form-active` / `:tool-submit-active` pseudoclasses with
  `@supports` fallbacks and `prefers-reduced-motion` support.

## Contact form backend

`functions/api/contact.ts` is a Cloudflare Pages Function (same origin, so the CSP in
`public/_headers` needs no changes). Native form POST → `formData()` → honeypot check →
server-side validation with structured JSON errors → Resend email → `303 See Other` to
`/?contact=ok#contact`.

Required environment variables in Cloudflare Pages:

- `RESEND_API_KEY` — Resend API key (the `knot.kz` domain must be DNS-verified in Resend)
- `CONTACT_TO_EMAIL` — recipient address

Without these, `POST /api/contact` returns `503 {"error":"not-configured"}`.

Configure them either in the Cloudflare dashboard
(Pages → `knot-site` → Settings → Environment variables → Production) or from the CLI:

```bash
pnpm dlx wrangler pages secret put RESEND_API_KEY --project-name=knot-site
pnpm dlx wrangler pages secret put CONTACT_TO_EMAIL --project-name=knot-site
```

Re-deploy after adding the secrets — `wrangler pages secret put` only writes them, it does not
redeploy.

Rate limiting for `/api/contact` is configured as a rule in the Cloudflare dashboard
(the function is stateless). `functions/` is typed with `@cloudflare/workers-types` and
checked by `pnpm typecheck:functions` (also in CI; the root `tsc` only covers `src/`).

## Lighthouse / Agentic Browsing

```bash
pnpm run audit:agentic [url] [phase]
```

Runs Lighthouse in a clean headless profile with `--disable-extensions` (extensions were
the source of a false-positive `Accessibility tree` failure) over five categories
(agentic-browsing, performance, accessibility, best-practices, seo) and writes the
Reports written to `.lighthouse/<phase>/`. Without arguments it audits the local `vite preview`
build. See `docs/web-mcp-implementation-outcome-phases.md` for the per-phase history.

Two known production-only findings, both outside this repo:

- *Uses deprecated APIs* (Shared Storage / Protected Audience / `StorageType.persistent`)
  comes from Cloudflare's edge-injected `cdn-cgi/challenge-platform/scripts/jsd/main.js`
  (JavaScript Detections). Disabling that toggle in the Cloudflare dashboard (Security → Bots)
  removes the warnings; there is nothing to change in the code.
- The *Accessibility tree is not well-formed* failure only appears when auditing from a
  regular browser profile: it is caused by an extension-injected element (GUID tag name,
  `tabindex="1"`), which is why this script runs with `--disable-extensions`.

## Assets

Marketing media lives under `public/`:

- `demo-cli.gif` / `demo-mcp.gif` — CLI and MCP recordings (served from this repo).
- `demo-graph.gif` — Knot Server Graph Viewer recording (served from this repo).
- `screenshot-graph.webp` / `screenshot-swagger.webp` — static captures of the Graph Viewer and Swagger UI.
- `logo-dark*.webp`, `favicon-32.webp` — branding.
- `og-image.png` — 1200×630 social preview, generated by `scripts/generate-og-image.mjs`.

To re-export the static screenshots after a UI change, place the corresponding
`public/screenshot-graph.png` / `public/screenshot-swagger.png` files and run:

```bash
pnpm run optimize-images
```

(The chain also regenerates `og-image.png`.)

## Deployment

Cloudflare Pages deploys from this repository (dashboard integration). The site is a
static SPA: `public/_headers` sets the CSP (`script-src 'self'` — no inline scripts, no
third-party runtime requests; `form-action 'self'` — the contact form may only post to
the same origin), `public/404.html` is served for unknown routes, and
`functions/api/contact.ts` is the only backend.

## License

MIT © raultov 2026
