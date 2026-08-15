import type { WebMcpTool, WebMcpToolResult } from './types'

/**
 * Circular buffer (last ~20 entries) of Web-MCP tool invocations, consumed by
 * the AgentTools live panel with useSyncExternalStore. Lets the audience SEE
 * the invocation happen instead of taking the speaker's word for it.
 */

export interface InvocationEntry {
  id: number
  tool: string
  args: unknown
  result: string
  ms: number
  ts: number
  ok: boolean
}

const MAX_ENTRIES = 20

let entries: InvocationEntry[] = []
let nextId = 1
let snapshot: readonly InvocationEntry[] = entries
const listeners = new Set<() => void>()

function emit() {
  snapshot = entries
  for (const listener of listeners) listener()
}

export const invocationLog = {
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
  getSnapshot() {
    return snapshot
  },
  record(entry: Omit<InvocationEntry, 'id' | 'ts'>) {
    entries = [{ ...entry, id: nextId++, ts: Date.now() }, ...entries].slice(0, MAX_ENTRIES)
    emit()
  },
}

/**
 * Decorator that wraps a tool's `execute` with logging. Keeps the tool logic
 * itself clean: tools never know they are being observed.
 */
export function withLogging<TInput>(tool: WebMcpTool<TInput>): WebMcpTool<TInput> {
  return {
    ...tool,
    execute: async (input) => {
      const start = performance.now()
      try {
        const result: WebMcpToolResult = await tool.execute(input)
        invocationLog.record({
          tool: tool.name,
          args: input,
          result: result.content.map((c) => c.text).join('\n'),
          ms: Math.round(performance.now() - start),
          ok: !result.isError,
        })
        return result
      } catch (err) {
        invocationLog.record({
          tool: tool.name,
          args: input,
          result: err instanceof Error ? err.message : String(err),
          ms: Math.round(performance.now() - start),
          ok: false,
        })
        return {
          content: [{ type: 'text', text: err instanceof Error ? err.message : String(err) }],
          isError: true,
        }
      }
    },
  }
}
