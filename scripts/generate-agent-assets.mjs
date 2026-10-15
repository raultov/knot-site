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
const TOOLCORE_ENTRY = join(ROOT, 'src', 'toolcore', 'index.ts')
const WEBMCP_REGISTRY_ENTRY = join(ROOT, 'src', 'webmcp', 'registry.ts')
const CONTACT_FORM_TOOL_ENTRY = join(ROOT, 'src', 'webmcp', 'contactFormTool.ts')
const UPDATES_FILE = join(ROOT, 'src', 'data', 'updates.json')

const JSONLD_START = '<!-- json-ld:start -->'
const JSONLD_END = '<!-- json-ld:end -->'

/** Transpile + bundle src/data/index.ts and import it as a data: URL. */
async function loadDataLayer() {
  return loadModule(DATA_ENTRY)
}

/**
 * Loads the tool registries so llms.txt advertises exactly the tools served
 * by functions/mcp.ts (portableTools), registered in the browser through
 * WebMCP (knotTools) and declared on the contact form.
 */
async function loadToolRegistries() {
  const [{ portableTools }, { knotTools }, contactForm] = await Promise.all([
    loadModule(TOOLCORE_ENTRY),
    loadModule(WEBMCP_REGISTRY_ENTRY),
    loadModule(CONTACT_FORM_TOOL_ENTRY),
  ])
  return { portableTools, knotTools, contactForm }
}

/** Transpile + bundle a TypeScript entry point and import it as a data: URL. */
async function loadModule(entry) {
  const result = await build({
    entryPoints: [entry],
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

function oneLine(text) {
  return String(text ?? '')
    .replace(/\s+/g, ' ')
    .trim()
}

function mcpToolLines(tools) {
  return tools
    .map((t) => {
      const hints = []
      if (t.behavior?.readOnly) hints.push('read-only')
      return `- \`${t.name}\`${hints.length ? ` (${hints.join(', ')})` : ''} — ${oneLine(
        t.description + (t.mcpDescriptionSuffix ?? ''),
      )}`
    })
    .join('\n')
}

function webMcpToolLines(tools, mcpToolNames) {
  return tools
    .map((t) => {
      const a = t.annotations ?? {}
      const hints = []
      if (a.readOnlyHint) hints.push('read-only')
      else hints.push('changes page state')
      if (a.consequentialHint) hints.push('requires user consent')
      if (a.untrustedContentHint) hints.push('untrusted content')
      if (!mcpToolNames.has(t.name)) hints.push('WebMCP only')
      return `- \`${t.name}\` (${hints.join(', ')}) — ${oneLine(t.description)}`
    })
    .join('\n')
}

function declarativeFormLines(contactForm) {
  const { CONTACT_FORM_TOOL_ATTRS: tool, CONTACT_FORM_PARAM_ATTRS: params } = contactForm
  const lines = [`- \`${tool.toolname}\` — ${oneLine(tool.tooldescription)} Parameters:`]
  for (const [name, attrs] of Object.entries(params)) {
    lines.push(`  - \`${name}\` — ${oneLine(attrs.toolparamdescription)}`)
  }
  return lines.join('\n')
}

/**
 * Advertises the tools this website itself exposes to agents: the remote MCP
 * endpoint served by functions/mcp.ts and the WebMCP tools registered by the
 * page. Kept distinct from knot-server's own `/mcp`, which queries indexed code.
 */
function buildAgentAccessText(site, tools) {
  const mcpUrl = `${site.url}/mcp`
  const mcpToolNames = new Set(tools.portableTools.map((t) => t.name))
  return [
    `${site.url} exposes structured metadata about Knot (supported languages, releases,`,
    'capabilities, edition comparison, install commands) as agent tools, over two transports.',
    'These tools describe the product; they do not query your code. To query an indexed',
    'codebase, run knot-mcp or knot-server (see below).',
    '',
    '### Remote MCP endpoint',
    '',
    `- URL: \`${mcpUrl}\``,
    '- Transport: MCP Streamable HTTP, stateless JSON-RPC over `POST` (no `Mcp-Session-Id`,',
    '  no authentication). Supports the `initialize` handshake and the stateless',
    '  `server/discover` flow.',
    `- Claude Code: \`claude mcp add --transport http knot-site ${mcpUrl}\``,
    `- opencode: \`{ "mcp": { "knot-site": { "type": "remote", "url": "${mcpUrl}" } } }\``,
    '',
    `Tools (${tools.portableTools.length}):`,
    '',
    mcpToolLines(tools.portableTools),
    '',
    '### WebMCP (in-browser)',
    '',
    `Loading ${site.url}/ in a browser that implements WebMCP exposes ${tools.knotTools.length} tools`,
    `on every page, plus 1 on the contact page (${tools.knotTools.length + 1} in total), that a browser agent`,
    'can call directly without scraping the UI.',
    '',
    `Imperative tools (${tools.knotTools.length}, on every page), registered through \`document.modelContext.registerTool()\``,
    '(falling back to `navigator.modelContext`):',
    '',
    webMcpToolLines(tools.knotTools, mcpToolNames),
    '',
    `Declarative tool (1, only on ${site.url}/#/contact), defined by HTML attributes on the contact form.`,
    'An agent may fill the fields, but the form does not auto-submit: a human must press Send.',
    '',
    declarativeFormLines(tools.contactForm),
  ].join('\n')
}

function buildLlmsText(data, updates, tools) {
  const { site, features, serverFeatures, languages, knotSections, knotServerSections } = data

  return [
    '# Knot',
    '',
    '> High-performance codebase indexer for AI agents. Extracts structural and semantic',
    '> information from source code using vector search (Qdrant) and a graph database (Neo4j).',
    '> Answers each exploration question with a targeted result instead of whole source files:',
    '> measured 81.7% fewer tokens (5.5×) than grep + reading the code.',
    '',
    '## Products',
    '',
    `- [Knot CLI](${site.repo.knot}): indexer, MCP server and CLI client.`,
    `- [Knot Server](${site.repo.knotServer}): distributed REST API, stateless MCP endpoint`,
    '  (`POST /mcp` on your own deployment), webhooks, scheduler, graph viewer and Swagger UI.',
    '',
    section('Agent access to this site (MCP + WebMCP)', buildAgentAccessText(site, tools)),
    section('Token Efficiency (measured)', buildTokenEfficiencyText(data)),
    section('Capabilities', featureLines(features)),
    section('Knot Server', featureLines(serverFeatures)),
    `## Supported languages\n\n${languages.join(', ')}\n`,
    section('Installation (Knot CLI)', installLines(knotSections)),
    section('Installation (Knot Server)', installLines(knotServerSections)),
    section('Latest releases', releaseLines(updates)),
    '## Documentation',
    '',
    `- [Knot README](${site.repo.knot}#readme): installation, configuration, CLI and MCP usage,`,
    '  and the full token efficiency methodology.',
    `- [Knot Server README](${site.repo.knotServer}#readme): REST API, the \`/mcp\` endpoint,`,
    '  webhooks, scheduler, cluster deployment and observability.',
    '',
  ]
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
}

/**
 * One line per measured task plus the total, mirroring the table published in
 * the knot README. Numbers come from the shared data layer so the UI, llms.txt
 * and any future consumer stay in sync.
 */
function buildTokenEfficiencyText(data) {
  const { tokenEfficiencyRows, tokenEfficiencyTotal } = data
  const lines = [
    'LLM token cost of answering each question through Knot versus grepping and reading',
    'the source, counted with OpenAI cl100k_base on the exact tool output received.',
    '',
    '| Task | Repo | Lang | Knot tokens | Read the code | Saved |',
    '|------|------|------|------------:|--------------:|------:|',
  ]
  for (const r of tokenEfficiencyRows) {
    lines.push(
      `| ${r.task} | ${r.repo} | ${r.language} | ${r.knotTokens} | ${r.readTokens} | ${r.reduction}% |`,
    )
  }
  const t = tokenEfficiencyTotal
  lines.push(
    `| **TOTAL** | — | ${t.tasks} tasks | **${t.knotTokens}** | **${t.readTokens}** | **${t.reduction}%** |`,
  )
  lines.push('')
  lines.push(
    `${t.factor} fewer tokens for the same ${t.tasks} questions — ${t.saved.toLocaleString('en-US')} tokens saved.`,
  )
  return lines.join('\n')
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
  const tools = await loadToolRegistries()
  const text = buildLlmsText(data, updates, tools)
  await mkdir(PUBLIC_DIR, { recursive: true })
  await writeFile(OUT_FILE, text, 'utf-8')
  console.log(`[generate-agent-assets] Wrote ${OUT_FILE} (${text.length} bytes)`)
}

async function writeJsonLd(data, updates) {
  const indexHtml = await readFile(INDEX_FILE, 'utf-8')
  const jsonLd = buildJsonLd(data, updates)
  let updated = await injectJsonLd(indexHtml, jsonLd)

  // Inject version, replacing any previously injected marker so repeated
  // builds do not accumulate stale app-version comments.
  const pkg = JSON.parse(await readFile(join(ROOT, 'package.json'), 'utf-8'))
  updated = updated.replace(
    /(\s*<!-- app-version: [^>]+ -->)+\s*(<\/body>)/,
    `\n  <!-- app-version: ${pkg.version} -->\n  $2`,
  )
  if (!updated.includes(`app-version: ${pkg.version}`)) {
    updated = updated.replace('</body>', `  <!-- app-version: ${pkg.version} -->\n  </body>`)
  }

  await writeFile(INDEX_FILE, updated, 'utf-8')
  console.log(
    `[generate-agent-assets] Injected JSON-LD and app-version (${pkg.version}) into ${INDEX_FILE}`,
  )
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
