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

## Web-MCP

The site is agent-ready (see `docs/web-mcp-implementation-plan.md` for the full rationale):

- `src/webmcp/` — types (`navigator.modelContext`, optional on purpose so every consumer
  must feature-detect), `useWebMcp` registration hook (tab-bound `AbortController`
  lifecycle), JSON Schemas with TypeScript input types derived from them (`schemas.ts`),
  the tool set (`registry.ts`) and the invocation log (`invocationLog.ts`, circular buffer
  + `withLogging` decorator).
- `src/webmcp/tools/` — six tools: `list-supported-languages`, `get-latest-releases`,
  `search-knot-capabilities`, `compare-knot-editions`, `get-install-command` (mutates the
  UI: switches the install tab and scrolls), and `copy-install-command` (guarded by a
  consent modal, see below).
- The **Agent Tools** section lists every tool with its schema and shows a live
  invocation log when the browser supports Web-MCP (or with `?agent-debug`).
- The **Contact** form is declarative Web-MCP (`toolname`, `tooldescription`,
  `toolparam*` attributes — passed through JSX spreads). No `toolautosubmit`: the human
  always presses Send. The `company_website` field is a honeypot without
  `toolparamdescription`, so it never enters the generated schema.
- **Trust boundary**: `copy-install-command` calls `requestUserInteraction()` and shows a
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
reports to `.lighthouse/<phase>/`. Without arguments it audits the local `vite preview`
build. See `docs/web-mcp-implementation-outcome-phases.md` for the per-phase history.

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
