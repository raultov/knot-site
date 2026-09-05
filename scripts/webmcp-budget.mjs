#!/usr/bin/env node
/**
 * WebMCP budget guard — runs as part of `pnpm prebuild` and `pnpm audit:webmcp`.
 *
 * 1. Bundles src/webmcp/registry.ts with esbuild (already a devDependency) and
 *    imports it in Node so the real registered tools are tested, not a fixture.
 * 2. Checks name / description / parameter-description character budgets against
 *    the Chrome WebMCP best-practices guidance.
 * 3. Invokes each tool's worst-case execute() and checks the output length
 *    against OUTPUT_BUDGET and OUTPUT_TARGET (imported from format.ts).
 * 4. Runs Nivel-A golden snapshots: exact matches for stable tools, invariant
 *    assertions for data-driven tools whose output changes on every build.
 * 5. Detects overlapping tool names and warns if two descriptions share >60% of
 *    their word tokens.
 *
 * Exit code: 1 if any OVER or golden mismatch; 0 otherwise.
 *
 * Flags:
 *   --update   Regenerate webmcp-golden.json from the current run.
 */

import esbuild from 'esbuild'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const GOLDEN_FILE = join(ROOT, 'scripts', 'webmcp-golden.json')
const UPDATE_GOLDEN = process.argv.includes('--update')

// ─── Shared constants (mirrored from format.ts — must stay in sync) ──────────
const OUTPUT_BUDGET = 1500
const OUTPUT_TARGET = 1350

let failures = 0
let warnings = 0

function fail(msg) { console.error('  FAIL:', msg); failures++ }
function warn(msg) { console.warn('  WARN:', msg); warnings++ }
function ok(msg) { console.log('  OK  :', msg) }

// ─── 1. Bundle the registry ──────────────────────────────────────────────────
console.log('\n[webmcp-budget] Bundling src/webmcp/registry.ts…')

let bundleCode
try {
  const result = await esbuild.build({
    entryPoints: [join(ROOT, 'src', 'webmcp', 'registry.ts')],
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'neutral',
    target: 'node22',
    loader: { '.json': 'json' },
    alias: { '@': join(ROOT, 'src') },
    define: { 'import.meta.env.DEV': 'false' },
    logLevel: 'silent',
  })
  bundleCode = result.outputFiles[0].text
} catch (err) {
  console.error('[webmcp-budget] Bundle failed:', err.message)
  process.exitCode = 1
  process.exit()
}

// Stub minimal DOM/browser globals needed for top-level code in the registry's
// transitive deps (no tool accesses these at the top level, only inside execute).
globalThis.document = {
  getElementById: () => null,
  modelContext: undefined,
  addEventListener: () => {},
  removeEventListener: () => {},
  activeElement: null,
}
Object.defineProperty(globalThis, 'navigator', {
  value: { modelContext: undefined, clipboard: undefined },
  writable: true,
  configurable: true,
})
globalThis.window = {
  matchMedia: () => ({ matches: true }),
  scrollTo: () => {},
}
globalThis.performance = { now: () => 0 }

const dataUrl = 'data:text/javascript;base64,' + Buffer.from(bundleCode).toString('base64')
const mod = await import(dataUrl)
const tools = mod.knotTools

if (!Array.isArray(tools) || tools.length === 0) {
  console.error('[webmcp-budget] knotTools is empty or not exported correctly')
  process.exitCode = 1
  process.exit()
}
console.log(`[webmcp-budget] Loaded ${tools.length} tools: ${tools.map((t) => t.name).join(', ')}`)

// ─── 2. Metadata budgets ─────────────────────────────────────────────────────
console.log('\n[webmcp-budget] Checking metadata budgets…')

const NAME_MAX = 30
const DESC_MAX = 500
const PARAM_NAME_MAX = 30
const PARAM_DESC_MAX = 150

function checkSchema(schema, prefix) {
  if (!schema || typeof schema !== 'object') return
  const props = schema.properties
  if (!props) return
  for (const [paramName, paramSchema] of Object.entries(props)) {
    const fqName = `${prefix}.${paramName}`
    if (paramName.length > PARAM_NAME_MAX)
      fail(`Parameter name too long (${paramName.length} > ${PARAM_NAME_MAX}): ${fqName}`)
    const pd = paramSchema.description
    if (pd && pd.length > PARAM_DESC_MAX)
      fail(`Parameter description too long (${pd.length} > ${PARAM_DESC_MAX}): ${fqName}`)
    // Recurse for nested objects (e.g. tuning.cores)
    if (paramSchema.type === 'object') checkSchema(paramSchema, fqName)
  }
}

const names = []
for (const tool of tools) {
  const tag = `[${tool.name}]`
  names.push(tool.name)

  if (tool.name.length > NAME_MAX)
    fail(`${tag} name too long (${tool.name.length} > ${NAME_MAX})`)
  else
    ok(`${tag} name length ${tool.name.length}`)

  if (tool.description.length > DESC_MAX)
    fail(`${tag} description too long (${tool.description.length} > ${DESC_MAX})`)
  else
    ok(`${tag} description length ${tool.description.length}`)

  checkSchema(tool.inputSchema, tool.name)
}

// Duplicate names
const dupes = names.filter((n, i) => names.indexOf(n) !== i)
if (dupes.length > 0) fail(`Duplicate tool names: ${dupes.join(', ')}`)

// Description overlap heuristic (>60% shared word tokens)
function wordTokens(s) {
  return new Set(s.toLowerCase().match(/\b\w{3,}\b/g) ?? [])
}
for (let i = 0; i < tools.length; i++) {
  for (let j = i + 1; j < tools.length; j++) {
    const a = wordTokens(tools[i].description)
    const b = wordTokens(tools[j].description)
    const shared = [...a].filter((w) => b.has(w)).length
    const ratio = shared / Math.max(a.size, b.size)
    if (ratio > 0.6)
      warn(
        `High description overlap (${Math.round(ratio * 100)}%) between ` +
          `"${tools[i].name}" and "${tools[j].name}"`,
      )
  }
}

// ─── 3. Output budgets ───────────────────────────────────────────────────────
console.log('\n[webmcp-budget] Checking output budgets…')

const maxLimit = (() => {
  const t = tools.find((t) => t.name === 'get-latest-releases')
  if (!t) return 4
  const max = t.inputSchema?.properties?.limit?.maximum
  return typeof max === 'number' ? max : 4
})()

const WORST_CASE_INPUTS = {
  'list-supported-languages': [{}],
  'get-latest-releases': [{ limit: maxLimit }],
  // query that matches the longest descriptions
  'search-knot-capabilities': [{ query: 'indexing' }, { area: 'cli', query: 'indexing' }],
  'compare-knot-editions': [{}],
  'get-install-command': [
    { product: 'knot', method: 'curl' },
    { product: 'knot', method: 'compose' },
    { product: 'knot-server', method: 'curl' },
    { product: 'knot-server', method: 'docker' },
    { product: 'knot-server', method: 'docker', tuning: { cores: 64, ramGb: 128 } },
    // error paths
    { product: 'knot', method: 'docker' },
  ],
  // copy-install-command excluded: requires human consent (tested via error path only)
  'copy-install-command': null,
}

const results = {}

for (const tool of tools) {
  const inputs = WORST_CASE_INPUTS[tool.name]
  if (inputs === null) {
    ok(`[${tool.name}] skipped (requires human activation)`)
    continue
  }
  if (!inputs) {
    warn(`[${tool.name}] no worst-case inputs defined`)
    continue
  }

  let maxChars = 0
  let worstInput = null

  for (const input of inputs) {
    let result
    try {
      result = await tool.execute(input)
    } catch (err) {
      fail(`[${tool.name}] threw during execute(${JSON.stringify(input)}): ${err.message}`)
      continue
    }

    const text = result.content.map((c) => c.text).join('\n')
    const chars = text.length

    if (chars > maxChars) {
      maxChars = chars
      worstInput = input
    }

    if (chars > OUTPUT_BUDGET) {
      fail(`[${tool.name}] output OVER budget: ${chars} > ${OUTPUT_BUDGET} (input: ${JSON.stringify(input)})`)
    } else if (chars > OUTPUT_TARGET) {
      warn(`[${tool.name}] output exceeds target: ${chars} > ${OUTPUT_TARGET} (input: ${JSON.stringify(input)})`)
    }

    // Detect jsonTextFitting truncation signal
    if (text.includes('"truncated":true')) {
      warn(`[${tool.name}] jsonTextFitting truncated the output for input: ${JSON.stringify(input)}`)
    }
  }

  ok(`[${tool.name}] worst-case output: ${maxChars} chars (input: ${JSON.stringify(worstInput)})`)
  results[tool.name] = { maxChars, worstInput }
}

// ─── 4. Golden snapshots ─────────────────────────────────────────────────────
console.log('\n[webmcp-budget] Running golden snapshots…')

// Tools with fully deterministic output (data from src/data/*, not network)
const STABLE_TOOLS = [
  'list-supported-languages',
  'compare-knot-editions',
  'search-knot-capabilities',
  'get-install-command',
]

const goldenInputs = {
  'list-supported-languages': [{}],
  'compare-knot-editions': [{}],
  'search-knot-capabilities': [
    { query: 'graph' },
    { query: 'docker', area: 'server' },
    { query: '' }, // should return errorText
  ],
  'get-install-command': [
    { product: 'knot', method: 'curl' },
    { product: 'knot-server', method: 'docker', tuning: { cores: 4, ramGb: 8 } },
    { product: 'knot', method: 'docker' }, // error path
    { product: 'knot-server', method: 'compose' },
  ],
}

const currentSnapshots = {}
for (const toolName of STABLE_TOOLS) {
  const tool = tools.find((t) => t.name === toolName)
  if (!tool) { warn(`Golden: tool not found: ${toolName}`); continue }

  currentSnapshots[toolName] = {}
  for (const input of goldenInputs[toolName]) {
    const key = JSON.stringify(input)
    let result
    try {
      result = await tool.execute(input)
    } catch (err) {
      fail(`Golden: [${toolName}] threw for input ${key}: ${err.message}`)
      continue
    }
    currentSnapshots[toolName][key] = result.content.map((c) => c.text).join('\n')
  }
}

if (UPDATE_GOLDEN) {
  writeFileSync(GOLDEN_FILE, JSON.stringify(currentSnapshots, null, 2) + '\n', 'utf-8')
  console.log(`[webmcp-budget] Golden file updated: ${GOLDEN_FILE}`)
} else if (!existsSync(GOLDEN_FILE)) {
  // First run: create the golden file automatically
  writeFileSync(GOLDEN_FILE, JSON.stringify(currentSnapshots, null, 2) + '\n', 'utf-8')
  console.log(`[webmcp-budget] Golden file created: ${GOLDEN_FILE}`)
} else {
  const stored = JSON.parse(readFileSync(GOLDEN_FILE, 'utf-8'))
  for (const [toolName, snapshots] of Object.entries(currentSnapshots)) {
    for (const [inputKey, output] of Object.entries(snapshots)) {
      const expected = stored[toolName]?.[inputKey]
      if (expected === undefined) {
        warn(`Golden: new snapshot key for [${toolName}] input ${inputKey} — run with --update`)
      } else if (output !== expected) {
        fail(
          `Golden: [${toolName}] output changed for input ${inputKey}.\n` +
            `  Expected: ${expected.slice(0, 120)}…\n` +
            `  Got:      ${output.slice(0, 120)}…`,
        )
      } else {
        ok(`Golden: [${toolName}] ${inputKey}`)
      }
    }
    // Check for keys in stored that are no longer present
    if (stored[toolName]) {
      for (const inputKey of Object.keys(stored[toolName])) {
        if (!(inputKey in currentSnapshots[toolName])) {
          warn(`Golden: stale key for [${toolName}] ${inputKey} — run with --update`)
        }
      }
    }
  }
}

// ─── 5. get-latest-releases invariants (data-driven, not a fixed snapshot) ───
console.log('\n[webmcp-budget] Checking get-latest-releases invariants…')

const relTool = tools.find((t) => t.name === 'get-latest-releases')
if (relTool) {
  const res = await relTool.execute({ limit: maxLimit })
  const text = res.content.map((c) => c.text).join('\n')
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    fail('get-latest-releases output is not valid JSON')
    parsed = null
  }

  if (parsed) {
    // Must have changelogUrls at the top level (hoisted from entries)
    if (parsed.changelogUrls && typeof parsed.changelogUrls === 'object') {
      ok('get-latest-releases has top-level changelogUrls map')
    } else {
      fail('get-latest-releases missing top-level changelogUrls (URL hoisting not applied)')
    }

    // No changelogUrl on individual entries
    if (parsed.releases?.some((r) => r.changelogUrl !== undefined)) {
      fail('get-latest-releases individual entries must not contain changelogUrl (should be hoisted)')
    } else {
      ok('get-latest-releases entries do not repeat changelogUrl')
    }

    // Summary length cap
    const longSummaries = (parsed.releases ?? []).filter((r) => (r.summary ?? '').length > 160)
    if (longSummaries.length > 0) {
      fail(
        `get-latest-releases summaries exceed 160 chars: ` +
          longSummaries.map((r) => `${r.product}@${r.version} (${r.summary.length})`).join(', '),
      )
    } else {
      ok('get-latest-releases all summaries ≤ 160 chars')
    }

    // Count
    if ((parsed.releases ?? []).length > maxLimit) {
      fail(`get-latest-releases returned more than limit=${maxLimit} entries`)
    } else {
      ok(`get-latest-releases returned ≤ ${maxLimit} entries`)
    }

    // No empty titles
    const emptyTitles = (parsed.releases ?? []).filter((r) => !r.title)
    if (emptyTitles.length > 0) {
      fail(
        `get-latest-releases entries with empty title: ` +
          emptyTitles.map((r) => `${r.product}@${r.version}`).join(', '),
      )
    } else {
      ok('get-latest-releases all entries have a title')
    }
  }
}

// ─── Summary ─────────────────────────────────────────────────────────────────
console.log('\n─────────────────────────────────────────────────')
if (failures === 0 && warnings === 0) {
  console.log('[webmcp-budget] All checks passed.')
} else {
  if (warnings > 0) console.warn(`[webmcp-budget] ${warnings} warning(s).`)
  if (failures > 0) {
    console.error(`[webmcp-budget] ${failures} failure(s). Build blocked.`)
    process.exitCode = 1
  }
}
