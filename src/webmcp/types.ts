import type { JSONSchema, ToolResult } from '@/toolcore/types'

export type { JSONSchema }
export type WebMcpToolResult = ToolResult

/**
 * Web-MCP (draft W3C Community Group spec) type surface.
 *
 * `navigator.modelContext` is declared OPTIONAL on purpose: every consumer must
 * narrow it before use, which makes forgetting the feature-detect a compile
 * error instead of a runtime one. The type system is the safety mechanism.
 */

export interface WebMcpToolAnnotations {
  readOnlyHint?: boolean
  destructiveHint?: boolean
  /**
   * Marks the output as externally sourced (not authored by this site), so the
   * agent applies heightened scrutiny to protect against prompt injection.
   * https://developer.chrome.com/docs/ai/webmcp/secure-tools
   */
  untrustedContentHint?: boolean
  /** High-stakes or non-reversible action: agent should confirm before execution. */
  consequentialHint?: boolean
}

export interface ToolExecuteOptions {
  signal?: AbortSignal
}

export interface RegisterToolOptions {
  signal?: AbortSignal
  /**
   * Secure origins allowed to discover and run this tool.
   * Left unset by default so tools are restricted to same-origin.
   */
  exposedTo?: readonly string[]
}

export interface WebMcpTool<TInput = unknown> {
  name: string
  description: string
  inputSchema: JSONSchema
  annotations?: WebMcpToolAnnotations
  /**
   * Method syntax on purpose: the browser runtime calls this with whatever
   * input the schema validated, so typed tools must be assignable to
   * WebMcpTool<unknown>. Method bivariance allows that while the tool's own
   * implementation keeps its derived input type.
   */
  execute(input: TInput, options?: ToolExecuteOptions): Promise<WebMcpToolResult>
}

export interface ModelContext {
  registerTool(tool: WebMcpTool, options?: RegisterToolOptions): void | Promise<void>
}

declare global {
  interface Navigator {
    readonly modelContext?: ModelContext
  }
  interface Document {
    readonly modelContext?: ModelContext
  }
}

export {}
