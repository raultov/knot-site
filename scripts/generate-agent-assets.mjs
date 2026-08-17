#!/usr/bin/env node
/**
 * Build-time generator for agent-facing assets.
 *
 * Phase 2: writes public/llms.txt from the SAME src/data/* modules that feed
 * the React UI. The TypeScript data layer is transpiled on the fly with
 * esbuild (already a dependency of Vite, no new packages) and imported as a
 * data: URL, which works on any Node version — no reliance on
 * --experimental-strip-types.
 *
 * Phase 6: injects JSON-LD (SoftwareApplication + Organization) into
 * index.html between `json-ld:start` / `json-ld:end` markers, and regenerates
 * public/sitemap.xml with a <lastmod> of the build date.
 *
 * Failure policy mirrors scripts/fetch-updates.mjs: NEVER break the build.
 * Any error is logged as a warning and previously generated assets (if any)
 * are left untouched.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const PUBLIC_DIR = join(ROOT, 'public')
const INDEX_FILE = join(ROOT, 'index.html')
const OUT_FILE = join(PUBLIC_DIR, 'llms.txt')
const SITEMAP_FILE = join(PUBLIC_DIR, 'sitemap.xml')
const DATA_ENTRY = join(ROOT, 'src', 'data', 'index.ts')
const UPDATES_FILE = join(ROOT, 'src', 'data', 'updates.json')

const JSONLD_START = '<!-- json-ld:start -->'
const JSONLD_END = '<!-- json-ld:end -->'

/** Transpile + bundle src/data/index.ts and import it as a data: URL. */
async function loadDataLayer() {
  const result = await build({
    entryPoints: [DATA_ENTRY],
    bundle: true,
    format: 'esm',
    platform: 'node',
    write: false,
    logLevel: 'silent',
  })
  const code = result.outputFiles[0].text
  return import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
}

async function loadUpdates() {
  if (!existsSync(UPDATES_FILE)) return null
  try {
    return JSON.parse(await readFile(UPDATES_FILE, 'utf-8'))
  } catch {
    return null
  }
}

function section(title, body) {
  const text = String(body ?? '').trim()
  return text ? `## ${title}\n\n${text}\n` : ''
}

function featureLines(items) {
  return items
    .map((f) => `- **${f.title}** — ${f.description.replace(/\s+/g, ' ').trim()}`)
    .join('\n')
}

function installLines(sections) {
  const out = []
  for (const s of sections) {
    out.push(`### ${s.step}. ${s.heading}`)
    out.push(s.description)
    const snippetLabels = [...(s.snippets ?? []), ...(s.options ?? []).flatMap((o) => o.snippets)]
    for (const sn of snippetLabels) {
      out.push(`- \`${sn.label}\``)
    }
  }
  return out.join('\n')
}

function releaseLines(updates) {
  if (!updates?.entries?.length) return ''
  const lines = []
  for (const e of updates.entries.slice(0, 6)) {
    const title = e.title ? `${e.title} — ` : ''
    const date = e.date ? ` (${e.date})` : ''
    lines.push(`- [v${e.version} · ${e.repo}](${e.changelogUrl}): ${title}${e.summary}${date}`)
  }
  return lines.join('\n')
}

function buildLlmsText(data, updates) {
  const { site, features, serverFeatures, languages, knotSections, knotServerSections } = data

  return [
    '# Knot',
    '',
    '> High-performance codebase indexer for AI agents. Extracts structural and semantic',
    '> information from source code using vector search (Qdrant) and a graph database (Neo4j).',
    '',
    '## Products',
    '',
    `- [Knot CLI](${site.repo.knot}): indexer, MCP server and CLI client.`,
    `- [Knot Server](${site.repo.knotServer}): distributed REST API, webhooks, scheduler,`,
    '  graph viewer and Swagger UI.',
    '',
    section('Capabilities', featureLines(features)),
    section('Knot Server', featureLines(serverFeatures)),
    `## Supported languages\n\n${languages.join(', ')}\n`,
    section('Installation (Knot CLI)', installLines(knotSections)),
    section('Installation (Knot Server)', installLines(knotServerSections)),
    section('Latest releases', releaseLines(updates)),
    '## Documentation',
    '',
    `- [Knot README](${site.repo.knot}#readme): installation, configuration, CLI and MCP usage.`,
    `- [Knot Server README](${site.repo.knotServer}#readme): REST API, webhooks, scheduler,`,
    '  cluster deployment and observability.',
    '',
  ]
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
}

function latestVersion(updates, repo) {
  const entry = updates?.entries?.find((e) => e.repo === repo && e.version)
  return entry?.version ?? null
}

function softwareApplication({ name, description, url, repo, version, features }) {
  const node = {
    '@type': 'SoftwareApplication',
    name,
    description,
    url: repo,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Linux, macOS, Windows',
    license: 'https://opensource.org/licenses/MIT',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    publisher: { '@id': `${url}/#organization` },
    author: { '@id': `${url}/#organization` },
    featureList: features.map((f) => f.title),
  }
  if (version) node.softwareVersion = version
  return node
}

function buildJsonLd(data, updates) {
  const { site, features, serverFeatures } = data

  return JSON.stringify(
    {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': `${site.url}/#organization`,
          name: site.name,
          url: site.url,
          logo: {
            '@type': 'ImageObject',
            url: `${site.url}/logo-dark-720.webp`,
          },
        },
        softwareApplication({
          name: 'Knot',
          description: site.description,
          url: site.url,
          repo: site.repo.knot,
          version: latestVersion(updates, 'knot'),
          features,
        }),
        softwareApplication({
          name: 'Knot Server',
          description: site.description,
          url: site.url,
          repo: site.repo.knotServer,
          version: latestVersion(updates, 'knot-server'),
          features: serverFeatures,
        }),
      ],
    },
    null,
    2,
  )
}

async function injectJsonLd(indexHtml, jsonLd) {
  const start = indexHtml.indexOf(JSONLD_START)
  const end = indexHtml.indexOf(JSONLD_END)
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(`JSON-LD markers not found in index.html`)
  }
  const block = `${JSONLD_START}\n    <script type="application/ld+json">\n${jsonLd
    .split('\n')
    .map((line) => `      ${line}`.trimEnd())
    .join('\n')}\n    </script>\n    ${JSONLD_END}`
  return indexHtml.slice(0, start) + block + indexHtml.slice(end + JSONLD_END.length)
}

function buildSitemap(siteUrl, lastmod) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}/</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`
}

async function writeLlmsText(data, updates) {
  const text = buildLlmsText(data, updates)
  await mkdir(PUBLIC_DIR, { recursive: true })
  await writeFile(OUT_FILE, text, 'utf-8')
  console.log(`[generate-agent-assets] Wrote ${OUT_FILE} (${text.length} bytes)`)
}

async function writeJsonLd(data, updates) {
  const indexHtml = await readFile(INDEX_FILE, 'utf-8')
  const jsonLd = buildJsonLd(data, updates)
  let updated = await injectJsonLd(indexHtml, jsonLd)
  
  // Inject version
  const pkg = JSON.parse(await readFile(join(ROOT, 'package.json'), 'utf-8'))
  updated = updated.replace('</body>', `  <!-- app-version: ${pkg.version} -->\n  </body>`)
  
  await writeFile(INDEX_FILE, updated, 'utf-8')
  console.log(`[generate-agent-assets] Injected JSON-LD and app-version (${pkg.version}) into ${INDEX_FILE}`)
}

async function writeSitemap() {
  const { site } = await loadDataLayer()
  const lastmod = new Date().toISOString().slice(0, 10)
  await writeFile(SITEMAP_FILE, buildSitemap(site.url, lastmod), 'utf-8')
  console.log(`[generate-agent-assets] Wrote ${SITEMAP_FILE} (lastmod ${lastmod})`)
}

async function main() {
  const data = await loadDataLayer()
  const updates = await loadUpdates()
  await writeLlmsText(data, updates)
  await writeJsonLd(data, updates)
  await writeSitemap()
}

main().catch((err) => {
  console.warn('[generate-agent-assets] Generation failed; keeping previous assets:', err.message)
})
