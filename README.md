# knot-site

Landing page for [Knot](https://github.com/raultov/knot) and [Knot Server](https://github.com/raultov/knot-server).

## Stack

- **Vite** + **React** + **TypeScript**
- Plain CSS (no frameworks)
- Responsive dark theme

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

## Deploy

The site is deployed on **Cloudflare Pages**. Any push to `main` triggers an automatic deploy.

### Cloudflare Pages Setup

1. Connect the GitHub repo at [dash.cloudflare.com](https://dash.cloudflare.com) → Workers & Pages → Create application → Pages.
2. Select the repository.
3. Configure the build:
   - **Build command:** `pnpm run build`
   - **Build output directory:** `dist`
4. Add custom domain: `knot.kz` (and `www.knot.kz`).

For a manual preview deploy, run `pnpm run build` and drag the `dist/` folder into the Cloudflare Pages UI.

## Project Structure

```
src/
  App.tsx
  main.tsx
  components/
    Header.tsx
    Hero.tsx
    Features.tsx
    Demo.tsx
    KnotServer.tsx
    Installation.tsx
    Footer.tsx
  styles/
    global.css         # CSS variables, reset, shared styles
    Header.css
    Hero.css
    Features.css
    Demo.css
    KnotServer.css
    Installation.css
    Footer.css
```

## License

MIT © raultov 2026