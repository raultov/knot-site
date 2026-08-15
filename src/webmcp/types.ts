/**
 * Web-MCP (draft W3C Community Group spec) type surface.
 *
 * `navigator.modelContext` is declared OPTIONAL on purpose: every consumer must
 * narrow it before use, which makes forgetting the feature-detect a compile
 * error instead of a runtime one. The type system is the safety mechanism.
 */

export interface JSONSchema {
  type?: 'object' | 'string' | 'number' | 'boolean' | 'array'
  properties?: Readonly<Record<string, JSONSchema>>
  required?: readonly string[]
  enum?: readonly string[]
  description?: string
  items?: JSONSchema
  minimum?: number
  maximum?: number
}

export interface WebMcpToolResult {
  content: Array<{ type: 'text'; text: string }>
  isError?: boolean
}

export interface WebMcpToolAnnotations {
  readOnlyHint?: boolean
  destructiveHint?: boolean
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
  execute(input: TInput): Promise<WebMcpToolResult>
}

export interface ModelContext {
  registerTool(tool: WebMcpTool, options?: { signal?: AbortSignal }): void
  requestUserInteraction?(): Promise<void>
}

declare global {
  interface Navigator {
    readonly modelContext?: ModelContext
  }
}

export {}
