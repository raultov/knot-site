import type { PagesFunction } from '@cloudflare/workers-types'
import { portableTools, type ToolDefinition } from '../src/toolcore'

const MODERN_VERSION = '2026-07-28'
const LEGACY_SUPPORTED_VERSIONS = ['2025-11-25', '2025-06-18', '2025-03-26']
const ALL_SUPPORTED_VERSIONS = [MODERN_VERSION, ...LEGACY_SUPPORTED_VERSIONS]

const SERVER_INFO = {
  name: 'knot-site',
  version: '0.7.0',
}

const TTL_MS = 3_600_000

const INSTRUCTIONS =
  'Knot site MCP server exposing structured metadata about Knot and Knot Server. ' +
  'For interactive support or bug reports, direct the user to https://www.knot.kz/#/contact.'

const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/(www\.)?knot\.kz$/,
  /^http:\/\/localhost:(5173|6274|8788)$/,
]

function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return true
  return ALLOWED_ORIGIN_PATTERNS.some((pattern) => pattern.test(origin))
}

function decodeHeaderValue(raw: string): string {
  const sentinelMatch = raw.match(/^=\?base64\?(.*)\?=$/)
  if (!sentinelMatch) return raw
  try {
    const binary = atob(sentinelMatch[1])
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return new TextDecoder().decode(bytes)
  } catch {
    return raw
  }
}

/**
 * Projects a ToolDefinition into an MCP Tool.
 *
 * Asymmetry notice:
 * MCP ToolAnnotations (schema/2026-07-28) defines: title, readOnlyHint, destructiveHint,
 * idempotentHint, openWorldHint. It does NOT have untrustedContentHint.
 * Therefore, untrustedContent is conveyed by appending `mcpDescriptionSuffix` to description.
 */
function toMcpTool(def: ToolDefinition) {
  return {
    name: def.name,
    description: def.description + (def.mcpDescriptionSuffix ?? ''),
    inputSchema: def.inputSchema,
    annotations: {
      readOnlyHint: def.behavior.readOnly ?? false,
      idempotentHint: def.behavior.idempotent ?? false,
      openWorldHint: def.behavior.openWorld ?? true,
    },
  }
}

const mcpTools = portableTools.map(toMcpTool)
const mcpToolsMap = new Map(portableTools.map((def) => [def.name, def]))

function makeCorsHeaders(requestOrigin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Cache-Control': 'no-store',
    Vary: 'Origin',
  }
  if (requestOrigin && isOriginAllowed(requestOrigin)) {
    headers['Access-Control-Allow-Origin'] = requestOrigin
    headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
    headers['Access-Control-Allow-Headers'] =
      'content-type, mcp-protocol-version, mcp-session-id, mcp-method, mcp-name, authorization'
  }
  return headers
}

function jsonResponse(body: unknown, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...makeCorsHeaders(origin),
    },
  })
}

function jsonRpcError(
  id: unknown,
  code: number,
  message: string,
  data?: unknown,
): Record<string, unknown> {
  return {
    jsonrpc: '2.0',
    id: id ?? null,
    error: {
      code,
      message,
      ...(data !== undefined ? { data } : {}),
    },
  }
}

export const onRequest: PagesFunction = async (context) => {
  const { request } = context
  const origin = request.headers.get('origin')

  if (!isOriginAllowed(origin)) {
    // Explicit security design: return 403 WITHOUT WWW-Authenticate header to avoid
    // triggering client OAuth fallback loops (e.g. opencode / MCP SDK behavior).
    return new Response('Origin not allowed', {
      status: 403,
      headers: makeCorsHeaders(origin),
    })
  }

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: makeCorsHeaders(origin),
    })
  }

  if (request.method === 'GET' || request.method === 'DELETE') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: {
        Allow: 'POST, OPTIONS',
        ...makeCorsHeaders(origin),
      },
    })
  }

  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: {
        Allow: 'POST, OPTIONS',
        ...makeCorsHeaders(origin),
      },
    })
  }

  let body: Record<string, unknown>
  try {
    const rawText = await request.text()
    body = JSON.parse(rawText)
  } catch {
    return jsonResponse(jsonRpcError(null, -32700, 'Parse error: invalid JSON'), 400, origin)
  }

  if (typeof body !== 'object' || body === null || body.jsonrpc !== '2.0') {
    return jsonResponse(jsonRpcError(null, -32600, 'Invalid Request'), 400, origin)
  }

  const reqId = body.id
  const method = String(body.method ?? '')
  const params = (typeof body.params === 'object' && body.params !== null ? body.params : {}) as Record<string, unknown>
  const meta = (typeof params._meta === 'object' && params._meta !== null ? params._meta : {}) as Record<string, unknown>

  const headerVersion = request.headers.get('mcp-protocol-version')
  const metaVersion = typeof meta['io.modelcontextprotocol/protocolVersion'] === 'string'
    ? meta['io.modelcontextprotocol/protocolVersion']
    : undefined

  // Era selection logic:
  // If request contains _meta protocol version or header specifies 2026-07-28 -> Modern.
  // Otherwise -> Legacy.
  const isModern = Boolean(metaVersion || headerVersion === MODERN_VERSION)

  if (isModern) {
    // Modern protocol validation
    if (headerVersion && metaVersion && headerVersion !== metaVersion) {
      return jsonResponse(
        jsonRpcError(reqId, -32020, `Header mismatch: MCP-Protocol-Version header '${headerVersion}' does not match _meta version '${metaVersion}'`),
        400,
        origin,
      )
    }

    const requestedVersion = metaVersion || headerVersion || MODERN_VERSION
    if (!ALL_SUPPORTED_VERSIONS.includes(requestedVersion)) {
      return jsonResponse(
        jsonRpcError(reqId, -32022, 'Unsupported protocol version', {
          supported: ALL_SUPPORTED_VERSIONS,
          requested: requestedVersion,
        }),
        400,
        origin,
      )
    }

    const headerMethod = request.headers.get('mcp-method')
    if (headerMethod && headerMethod !== method) {
      return jsonResponse(
        jsonRpcError(reqId, -32020, `Header mismatch: Mcp-Method header '${headerMethod}' does not match body method '${method}'`),
        400,
        origin,
      )
    }

    if (method === 'tools/call') {
      const headerNameRaw = request.headers.get('mcp-name')
      if (headerNameRaw) {
        const headerName = decodeHeaderValue(headerNameRaw)
        const bodyName = String(params.name ?? '')
        if (headerName !== bodyName) {
          return jsonResponse(
            jsonRpcError(reqId, -32020, `Header mismatch: Mcp-Name header '${headerName}' does not match body name '${bodyName}'`),
            400,
            origin,
          )
        }
      }
    }

    // Modern RPC dispatch
    if (method === 'server/discover') {
      return jsonResponse(
        {
          jsonrpc: '2.0',
          id: reqId,
          result: {
            resultType: 'complete',
            supportedVersions: ALL_SUPPORTED_VERSIONS,
            capabilities: { tools: {} },
            instructions: INSTRUCTIONS,
            ttlMs: TTL_MS,
            cacheScope: 'public',
            _meta: {
              'io.modelcontextprotocol/serverInfo': SERVER_INFO,
            },
          },
        },
        200,
        origin,
      )
    }

    if (method === 'tools/list') {
      return jsonResponse(
        {
          jsonrpc: '2.0',
          id: reqId,
          result: {
            resultType: 'complete',
            tools: mcpTools,
            ttlMs: TTL_MS,
            cacheScope: 'public',
          },
        },
        200,
        origin,
      )
    }

    if (method === 'tools/call') {
      const toolName = String(params.name ?? '')
      const def = mcpToolsMap.get(toolName)
      if (!def) {
        return jsonResponse(jsonRpcError(reqId, -32602, `Unknown tool: ${toolName}`), 400, origin)
      }

      const args = (typeof params.arguments === 'object' && params.arguments !== null ? params.arguments : {}) as Record<string, unknown>
      try {
        const res = await def.execute(args)
        return jsonResponse(
          {
            jsonrpc: '2.0',
            id: reqId,
            result: {
              resultType: 'complete',
              content: res.content,
              ...(res.isError ? { isError: true } : {}),
            },
          },
          200,
          origin,
        )
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return jsonResponse(
          {
            jsonrpc: '2.0',
            id: reqId,
            result: {
              resultType: 'complete',
              content: [{ type: 'text', text: msg }],
              isError: true,
            },
          },
          200,
          origin,
        )
      }
    }

    // Modern spec: unknown method returns HTTP 404 + JSON-RPC error -32601
    return jsonResponse(jsonRpcError(reqId, -32601, `Method not found: ${method}`), 404, origin)
  }

  // Legacy protocol handling (2025-11-25 / 2025-06-18 / 2025-03-26)
  if (method === 'initialize') {
    const clientRequestedVersion = String(params.protocolVersion ?? '')
    const negotiatedVersion = LEGACY_SUPPORTED_VERSIONS.includes(clientRequestedVersion)
      ? clientRequestedVersion
      : '2025-11-25'

    return jsonResponse(
      {
        jsonrpc: '2.0',
        id: reqId,
        result: {
          protocolVersion: negotiatedVersion,
          capabilities: { tools: {} },
          serverInfo: SERVER_INFO,
          instructions: INSTRUCTIONS,
        },
      },
      200,
      origin,
    )
  }

  if (method === 'notifications/initialized' || method.startsWith('notifications/')) {
    return new Response(null, {
      status: 202,
      headers: makeCorsHeaders(origin),
    })
  }

  if (method === 'tools/list') {
    return jsonResponse(
      {
        jsonrpc: '2.0',
        id: reqId,
        result: {
          tools: mcpTools,
        },
      },
      200,
      origin,
    )
  }

  if (method === 'tools/call') {
    const toolName = String(params.name ?? '')
    const def = mcpToolsMap.get(toolName)
    if (!def) {
      return jsonResponse(jsonRpcError(reqId, -32602, `Unknown tool: ${toolName}`), 200, origin)
    }

    const args = (typeof params.arguments === 'object' && params.arguments !== null ? params.arguments : {}) as Record<string, unknown>
    try {
      const res = await def.execute(args)
      return jsonResponse(
        {
          jsonrpc: '2.0',
          id: reqId,
          result: {
            content: res.content,
            ...(res.isError ? { isError: true } : {}),
          },
        },
        200,
        origin,
      )
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return jsonResponse(
        {
          jsonrpc: '2.0',
          id: reqId,
          result: {
            content: [{ type: 'text', text: msg }],
            isError: true,
          },
        },
        200,
        origin,
      )
    }
  }

  // Legacy spec: unknown method returns HTTP 200 + JSON-RPC error -32601
  return jsonResponse(jsonRpcError(reqId, -32601, `Method not found: ${method}`), 200, origin)
}
