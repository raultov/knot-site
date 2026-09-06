#!/usr/bin/env node
/**
 * WebMCP & MCP budget guard — runs as part of `pnpm prebuild` and `pnpm audit:webmcp`.
 *
 * 1. Bundles src/webmcp/registry.ts & functions/mcp.ts with esbuild and imports them in Node.
 * 2. Checks WebMCP & MCP metadata character budgets against best-practices guidance.
 * 3. Invokes each tool's worst-case execute() and checks output length against OUTPUT_BUDGET.
 * 4. Runs Nivel-A golden snapshots: exact matches for WebMCP stable tools and cross-transport
 *    equivalence between WebMCP and /mcp executions.
 * 5. Audits /mcp endpoint protocol handling (Modern 2026-07-28 & Legacy, CORS/Origin, header validation,
 *    untrustedContent asymmetry).
 *
 * Exit code: 1 if any OVER or mismatch; 0 otherwise.
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

// ─── Shared constants ────────────────────────────────────────────────────────
const OUTPUT_BUDGET = 1500
const OUTPUT_TARGET = 1350

let failures = 0
let warnings = 0

function fail(msg) { console.error('  FAIL:', msg); failures++ }
function warn(msg) { console.warn('  WARN:', msg); warnings++ }
function ok(msg) { console.log('  OK  :', msg) }

// ─── 1. Bundle the WebMCP registry ───────────────────────────────────────────
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
  console.error('[webmcp-budget] WebMCP Bundle failed:', err.message)
  process.exitCode = 1
  process.exit()
}

// Stub minimal DOM/browser globals needed for top-level code
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
console.log(`[webmcp-budget] Loaded ${tools.length} WebMCP tools: ${tools.map((t) => t.name).join(', ')}`)

// ─── 2. Metadata budgets ─────────────────────────────────────────────────────
console.log('\n[webmcp-budget] Checking WebMCP metadata budgets…')

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

const dupes = names.filter((n, i) => names.indexOf(n) !== i)
if (dupes.length > 0) fail(`Duplicate tool names: ${dupes.join(', ')}`)

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
console.log('\n[webmcp-budget] Checking WebMCP output budgets…')

const maxLimit = (() => {
  const t = tools.find((t) => t.name === 'get-latest-releases')
  if (!t) return 4
  const max = t.inputSchema?.properties?.limit?.maximum
  return typeof max === 'number' ? max : 4
})()

const WORST_CASE_INPUTS = {
  'list-supported-languages': [{}],
  'get-latest-releases': [{ limit: maxLimit }],
  'search-knot-capabilities': [{ query: 'indexing' }, { area: 'cli', query: 'indexing' }],
  'compare-knot-editions': [{}],
  'get-install-command': [
    { product: 'knot', method: 'curl' },
    { product: 'knot', method: 'compose' },
    { product: 'knot-server', method: 'curl' },
    { product: 'knot-server', method: 'docker' },
    { product: 'knot-server', method: 'docker', tuning: { cores: 64, ramGb: 128 } },
    { product: 'knot', method: 'docker' },
  ],
  'copy-install-command': null,
}

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

    if (text.includes('"truncated":true')) {
      warn(`[${tool.name}] jsonTextFitting truncated output for input: ${JSON.stringify(input)}`)
    }
  }

  ok(`[${tool.name}] worst-case output: ${maxChars} chars (input: ${JSON.stringify(worstInput)})`)
}

// ─── 4. Golden snapshots ─────────────────────────────────────────────────────
console.log('\n[webmcp-budget] Running golden snapshots…')

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
    { query: '' },
  ],
  'get-install-command': [
    { product: 'knot', method: 'curl' },
    { product: 'knot-server', method: 'docker', tuning: { cores: 4, ramGb: 8 } },
    { product: 'knot', method: 'docker' },
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
  }
}

// ─── 5. get-latest-releases invariants ───────────────────────────────────────
console.log('\n[webmcp-budget] Checking get-latest-releases invariants…')

const relTool = tools.find((t) => t.name === 'get-latest-releases')
if (relTool) {
  const res = await relTool.execute({ limit: maxLimit })
  const text = res.content.map((c) => c.text).join('\n')
  let parsed = null
  try { parsed = JSON.parse(text) } catch { fail('get-latest-releases output is not valid JSON') }

  if (parsed) {
    if (parsed.changelogUrls && typeof parsed.changelogUrls === 'object') {
      ok('get-latest-releases has top-level changelogUrls map')
    } else {
      fail('get-latest-releases missing top-level changelogUrls')
    }

    if (parsed.releases?.some((r) => r.changelogUrl !== undefined)) {
      fail('get-latest-releases individual entries must not contain changelogUrl')
    } else {
      ok('get-latest-releases entries do not repeat changelogUrl')
    }

    const longSummaries = (parsed.releases ?? []).filter((r) => (r.summary ?? '').length > 160)
    if (longSummaries.length > 0) {
      fail(`get-latest-releases summaries exceed 160 chars`)
    } else {
      ok('get-latest-releases all summaries ≤ 160 chars')
    }
  }
}

// ─── 6. Bundle & Audit /mcp endpoint ──────────────────────────────────────────
console.log('\n[webmcp-budget] Bundling functions/mcp.ts & testing /mcp endpoint…')

let mcpHandler
try {
  const result = await esbuild.build({
    entryPoints: [join(ROOT, 'functions', 'mcp.ts')],
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'neutral',
    target: 'node22',
    loader: { '.json': 'json' },
    define: { 'import.meta.env.DEV': 'false' },
    logLevel: 'silent',
  })
  const mcpDataUrl = 'data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64')
  const mcpMod = await import(mcpDataUrl)
  mcpHandler = mcpMod.onRequest
} catch (err) {
  fail(`functions/mcp.ts bundle failed: ${err.message}`)
}

if (mcpHandler) {
  async function callEndpoint(opts) {
    const { method = 'POST', headers = {}, body = null } = opts
    const reqHeaders = new Headers({
      'content-type': 'application/json',
      ...headers,
    })
    const req = new Request('https://www.knot.kz/mcp', {
      method,
      headers: reqHeaders,
      ...(body !== null ? { body: JSON.stringify(body) } : {}),
    })
    const res = await mcpHandler({ request: req })
    const resText = await res.text()
    let resJson = null
    try { resJson = JSON.parse(resText) } catch { /* ignore */ }
    return { status: res.status, headers: res.headers, text: resText, json: resJson }
  }

  // 6.1 Modern Discover (2026-07-28)
  const discoverRes = await callEndpoint({
    body: {
      jsonrpc: '2.0',
      id: 1,
      method: 'server/discover',
      params: {
        _meta: {
          'io.modelcontextprotocol/protocolVersion': '2026-07-28',
        },
      },
    },
    headers: { 'mcp-protocol-version': '2026-07-28' },
  })

  if (discoverRes.status === 200 && discoverRes.json?.result?.resultType === 'complete') {
    ok('/mcp Modern server/discover returned status 200 with resultType: "complete"')
  } else {
    fail(`/mcp Modern server/discover failed: ${discoverRes.status} ${discoverRes.text}`)
  }

  // 6.2 Modern tools/list
  const modernListRes = await callEndpoint({
    body: {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {
        _meta: {
          'io.modelcontextprotocol/protocolVersion': '2026-07-28',
        },
      },
    },
    headers: { 'mcp-protocol-version': '2026-07-28', 'mcp-method': 'tools/list' },
  })

  if (modernListRes.status === 200 && Array.isArray(modernListRes.json?.result?.tools)) {
    const mcpToolList = modernListRes.json.result.tools
    if (mcpToolList.length === 4) {
      ok(`/mcp Modern tools/list returned exactly 4 portable tools`)
    } else {
      fail(`/mcp Modern tools/list tool count mismatch: ${mcpToolList.length} != 4`)
    }

    // Name regex & description budget
    for (const t of mcpToolList) {
      if (!/^[A-Za-z0-9_.-]{1,128}$/.test(t.name)) {
        fail(`/mcp tool name "${t.name}" violates MCP naming spec`)
      }
      if (t.description.length > DESC_MAX) {
        fail(`/mcp tool description "${t.name}" exceeds DESC_MAX: ${t.description.length} > ${DESC_MAX}`)
      }
    }

    // UntrustedContent asymmetry check
    const relMcpTool = mcpToolList.find((t) => t.name === 'get-latest-releases')
    if (relMcpTool) {
      if (relMcpTool.annotations?.untrustedContentHint !== undefined) {
        fail('/mcp tools/list output MUST NOT include untrustedContentHint in annotations (not in MCP spec)')
      } else {
        ok('/mcp ToolAnnotations correctly omits untrustedContentHint')
      }
      if (relMcpTool.description.includes('third-party content')) {
        ok('/mcp get-latest-releases description correctly includes mcpDescriptionSuffix')
      } else {
        fail('/mcp get-latest-releases description missing mcpDescriptionSuffix')
      }
    }

    // Total tool list size budget
    const listSize = JSON.stringify(mcpToolList).length
    const MCP_LIST_BUDGET = 2000
    if (listSize <= MCP_LIST_BUDGET) {
      ok(`/mcp tools/list serialized size ${listSize} chars <= ${MCP_LIST_BUDGET} token budget`)
    } else {
      fail(`/mcp tools/list serialized size OVER budget: ${listSize} > ${MCP_LIST_BUDGET}`)
    }
  } else {
    fail(`/mcp Modern tools/list failed: ${modernListRes.status} ${modernListRes.text}`)
  }

  // 6.3 Cross-transport equivalence for tools/call
  for (const toolName of ['list-supported-languages', 'compare-knot-editions', 'search-knot-capabilities']) {
    for (const input of goldenInputs[toolName]) {
      if (input.query === '') continue // error path tested separately
      const callRes = await callEndpoint({
        body: {
          jsonrpc: '2.0',
          id: 10,
          method: 'tools/call',
          params: {
            name: toolName,
            arguments: input,
            _meta: {
              'io.modelcontextprotocol/protocolVersion': '2026-07-28',
            },
          },
        },
        headers: {
          'mcp-protocol-version': '2026-07-28',
          'mcp-method': 'tools/call',
          'mcp-name': toolName,
        },
      })
      const mcpOutput = callRes.json?.result?.content?.[0]?.text
      const expectedGolden = currentSnapshots[toolName]?.[JSON.stringify(input)]
      if (mcpOutput === expectedGolden) {
        ok(`/mcp cross-transport equivalence for [${toolName}] ${JSON.stringify(input)}`)
      } else {
        fail(`/mcp cross-transport equivalence mismatch for [${toolName}] ${JSON.stringify(input)}`)
      }
    }
  }

  // 6.4 Legacy Initialize (2025-11-25)
  const legacyInit = await callEndpoint({
    body: {
      jsonrpc: '2.0',
      id: 100,
      method: 'initialize',
      params: {
        protocolVersion: '2025-11-25',
      },
    },
  })
  if (legacyInit.status === 200 && legacyInit.json?.result?.protocolVersion === '2025-11-25') {
    ok('/mcp Legacy initialize returned negotiated protocolVersion 2025-11-25')
  } else {
    fail(`/mcp Legacy initialize failed: ${legacyInit.status} ${legacyInit.text}`)
  }

  // 6.5 Header & Error validations
  const headerMismatch = await callEndpoint({
    body: {
      jsonrpc: '2.0',
      id: 200,
      method: 'tools/list',
      params: {
        _meta: {
          'io.modelcontextprotocol/protocolVersion': '2026-07-28',
        },
      },
    },
    headers: { 'mcp-protocol-version': '1900-01-01' },
  })
  if (headerMismatch.status === 400 && headerMismatch.json?.error?.code === -32020) {
    ok('/mcp Header Mismatch validation correctly returned HTTP 400 & error -32020')
  } else {
    fail(`/mcp Header Mismatch validation failed: ${headerMismatch.status}`)
  }

  const unsupportedVer = await callEndpoint({
    body: {
      jsonrpc: '2.0',
      id: 201,
      method: 'server/discover',
      params: {
        _meta: {
          'io.modelcontextprotocol/protocolVersion': '1900-01-01',
        },
      },
    },
    headers: { 'mcp-protocol-version': '1900-01-01' },
  })
  if (unsupportedVer.status === 400 && unsupportedVer.json?.error?.code === -32022) {
    ok('/mcp Unsupported Version validation correctly returned HTTP 400 & error -32022')
  } else {
    fail(`/mcp Unsupported Version validation failed: ${unsupportedVer.status}`)
  }

  const unknownMethodModern = await callEndpoint({
    body: {
      jsonrpc: '2.0',
      id: 202,
      method: 'invalid/method',
      params: {
        _meta: {
          'io.modelcontextprotocol/protocolVersion': '2026-07-28',
        },
      },
    },
    headers: { 'mcp-protocol-version': '2026-07-28' },
  })
  if (unknownMethodModern.status === 404 && unknownMethodModern.json?.error?.code === -32601) {
    ok('/mcp Unknown Method (Modern) correctly returned HTTP 404 & error -32601')
  } else {
    fail(`/mcp Unknown Method (Modern) failed: ${unknownMethodModern.status}`)
  }

  const forbiddenOrigin = await callEndpoint({
    body: { jsonrpc: '2.0', id: 203, method: 'tools/list' },
    headers: { origin: 'https://evil.example' },
  })
  if (forbiddenOrigin.status === 403 && !forbiddenOrigin.headers.get('www-authenticate')) {
    ok('/mcp Origin allowlist correctly rejected unauthorized origin with HTTP 403 (no WWW-Authenticate header)')
  } else {
    fail(`/mcp Origin allowlist failed: ${forbiddenOrigin.status}`)
  }

  const allowedOriginEcho = await callEndpoint({
    body: { jsonrpc: '2.0', id: 204, method: 'tools/list' },
    headers: { origin: 'http://localhost:6274' },
  })
  if (allowedOriginEcho.status === 200 && allowedOriginEcho.headers.get('access-control-allow-origin') === 'http://localhost:6274') {
    ok('/mcp Origin allowlist correctly echoed allowed origin http://localhost:6274')
  } else {
    fail(`/mcp Origin allowlist echo failed: ${allowedOriginEcho.status}`)
  }

  const methodGet = await callEndpoint({ method: 'GET' })
  if (methodGet.status === 405) {
    ok('/mcp HTTP GET correctly returned HTTP 405 Method Not Allowed')
  } else {
    fail(`/mcp HTTP GET failed: ${methodGet.status}`)
  }
}

// ─── Summary ─────────────────────────────────────────────────────────────────
console.log('\n─────────────────────────────────────────────────')
if (failures === 0 && warnings === 0) {
  console.log('[webmcp-budget] All WebMCP & /mcp checks passed.')
} else {
  if (warnings > 0) console.warn(`[webmcp-budget] ${warnings} warning(s).`)
  if (failures > 0) {
    console.error(`[webmcp-budget] ${failures} failure(s). Build blocked.`)
    process.exitCode = 1
  }
}
