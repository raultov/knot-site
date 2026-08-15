import type { WebMcpToolResult } from '@/webmcp/types'

/** Wraps structured data in the MCP-style text content shape. */
export function jsonText(value: unknown): WebMcpToolResult {
  return { content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] }
}

/** Wraps a plain string. */
export function plainText(text: string): WebMcpToolResult {
  return { content: [{ type: 'text', text }] }
}

/** Wraps an error in the isError result shape. */
export function errorText(text: string): WebMcpToolResult {
  return { content: [{ type: 'text', text }], isError: true }
}
