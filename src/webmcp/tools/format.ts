import type { WebMcpToolResult } from '@/webmcp/types'

/** Chrome WebMCP guidance: recommended maximum character budget per tool output. */
export const OUTPUT_BUDGET = 1500

/**
 * Our internal target (90% of budget) to leave headroom for data growth.
 * Guards and jsonTextFitting assert against this target.
 */
export const OUTPUT_TARGET = 1350

/**
 * Wraps structured data in compact JSON format.
 *
 * Compact on purpose: indentation is ~15.6% of the payload size and carries zero
 * information for LLMs.
 */
export function jsonText(value: unknown): WebMcpToolResult {
  return { content: [{ type: 'text', text: JSON.stringify(value) }] }
}

/** Truncates a string to max characters without cutting a word in half. */
export function truncateWords(text: string, max: number): string {
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  const safe = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut
  return safe.replace(/[\s,;:.-]+$/, '') + '…'
}

/**
 * Structural safety net for list-shaped outputs. Drops trailing items one by one
 * if the serialized payload exceeds OUTPUT_TARGET, ensuring the output never
 * breaches the target silently when feed or feature data grows. Sets
 * `truncated: true` on the response so the model knows it received a partial list.
 */
export function jsonTextFitting<T>(
  items: readonly T[],
  build: (slice: readonly T[], truncated: boolean) => unknown,
): WebMcpToolResult {
  let count = items.length
  while (count >= 0) {
    const isTruncated = count < items.length
    const payload = build(items.slice(0, count), isTruncated)
    const json = JSON.stringify(payload)
    if (json.length <= OUTPUT_TARGET || count === 0) {
      return { content: [{ type: 'text', text: json }] }
    }
    count--
  }
  return jsonText(build([], true))
}

/** Wraps a plain string. */
export function plainText(text: string): WebMcpToolResult {
  return { content: [{ type: 'text', text }] }
}

/** Wraps an error in the isError result shape. */
export function errorText(text: string): WebMcpToolResult {
  return { content: [{ type: 'text', text }], isError: true }
}
