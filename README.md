# knot-site

Landing page for [Knot](https://github.com/raultov/knot) and [Knot Server](https://github.com/raultov/knot-server).

## Stack

- **Vite** + **React** + **TypeScript**
- Plain CSS (no frameworks)
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

Preview the production build locally:

```bash
pnpm run preview
```

Output goes to `dist/`.

## Assets

Marketing media lives under `public/`:

- `demo-cli.gif` / `demo-mcp.gif` — pulled from the `knot` repo (kept for historical compatibility).
- `demo-graph.gif` — Knot Server Graph Viewer recording (served from this repo).
- `screenshot-graph.webp` / `screenshot-swagger.webp` — static captures of the Graph Viewer and Swagger UI.
- `logo-dark*.webp`, `favicon-32.webp` — branding.

To re-export the static screenshots after a UI change, place the corresponding
`public/screenshot-graph.png` / `public/screenshot-swagger.png` files and run:

```bash
pnpm run optimize-images
```

## License

MIT © raultov 2026
