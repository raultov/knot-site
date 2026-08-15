#!/usr/bin/env node
/**
 * Generates public/og-image.png (1200×630) for social previews.
 *
 * Composes an SVG (site background + grid, the logo, product name and
 * tagline) and renders it with sharp. Invoked from the `optimize-images`
 * chain so the asset stays reproducible.
 */
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const LOGO_HEIGHT = 190

async function main() {
  const logoBuffer = await readFile(join(ROOT, 'public', 'logo-dark.png'))
  const logoMeta = await sharp(logoBuffer).metadata()
  const logoWidth = Math.round(((logoMeta.width ?? 753) * LOGO_HEIGHT) / (logoMeta.height ?? 837))
  const logoX = 600 - logoWidth / 2
  const logoY = 175 - LOGO_HEIGHT / 2

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="#0d1117"/>
  <defs>
    <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
      <path d="M60 0H0V60" fill="none" stroke="rgba(48,54,61,0.12)" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="1200" height="630" fill="url(#grid)"/>
  <image href="data:image/png;base64,${logoBuffer.toString('base64')}" x="${logoX}" y="${logoY}" width="${logoWidth}" height="${LOGO_HEIGHT}"/>
  <text x="600" y="375" text-anchor="middle" font-family="monospace" font-size="88" font-weight="700" fill="#f0f6fc">Knot</text>
  <text x="600" y="445" text-anchor="middle" font-family="sans-serif" font-size="33" fill="#8b949e">Codebase Indexer for AI Agents</text>
  <text x="600" y="575" text-anchor="middle" font-family="monospace" font-size="24" fill="#58a6ff">knot.kz</text>
</svg>`

  await sharp(Buffer.from(svg)).png().toFile(join(ROOT, 'public', 'og-image.png'))
  console.log('[generate-og-image] Wrote public/og-image.png (1200×630)')
}

main().catch((err) => {
  console.error('[generate-og-image] Fatal:', err.message ?? err)
  process.exitCode = 1
})
