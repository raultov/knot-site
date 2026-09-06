import type { ToolDefinition } from '@/toolcore/types'
import type { WebMcpTool } from '@/webmcp/types'

/**
 * Projects a transport-agnostic ToolDefinition to a WebMcpTool.
 *
 * Asymmetry notice:
 * - `behavior.readOnly` maps to `annotations.readOnlyHint`.
 * - `behavior.untrustedContent` maps to `annotations.untrustedContentHint`.
 * - `behavior.idempotent` and `behavior.openWorld` exist in MCP's ToolAnnotations
 *   spec, but NOT in WebMCP, so they are intentionally omitted here.
 */
export function toWebMcpTool<T>(def: ToolDefinition<T>): WebMcpTool<T> {
  return {
    name: def.name,
    description: def.description,
    inputSchema: def.inputSchema,
    annotations: {
      ...(def.behavior.readOnly ? { readOnlyHint: true } : {}),
      ...(def.behavior.untrustedContent ? { untrustedContentHint: true } : {}),
    },
    execute: (input) => def.execute(input),
  }
}
