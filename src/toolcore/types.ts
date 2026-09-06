/**
 * Minimal Web-MCP / MCP JSON Schema and tool types for toolcore.
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

export type SchemaType<S extends JSONSchema> = S extends { enum: readonly (infer E)[] }
  ? E
  : S extends { type: 'string' }
    ? string
    : S extends { type: 'number' }
      ? number
      : S extends { type: 'boolean' }
        ? boolean
        : S extends { type: 'array' }
          ? S extends { items: JSONSchema }
            ? SchemaType<S['items']>[]
            : unknown[]
          : S extends { type: 'object' }
            ? S extends { properties: infer P extends Record<string, JSONSchema> }
              ? S extends { required: infer R extends readonly string[] }
                ? {
                    [K in keyof P as K extends R[number] ? K : never]-?: SchemaType<P[K]>
                  } & {
                    [K in keyof P as K extends R[number] ? never : K]+?: SchemaType<P[K]>
                  }
                : { [K in keyof P]+?: SchemaType<P[K]> }
              : Record<string, unknown>
            : unknown

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>
  isError?: boolean
}

/**
 * Transport-agnostic behavior descriptors.
 *
 * Projections:
 * - WebMCP: readOnly -> readOnlyHint, untrustedContent -> untrustedContentHint.
 * - MCP (2026-07-28): readOnly -> readOnlyHint, idempotent -> idempotentHint,
 *   openWorld -> openWorldHint. Note: untrustedContent is NOT part of MCP's ToolAnnotations;
 *   for MCP, it is appended to the tool description text.
 */
export interface ToolBehavior {
  readonly readOnly?: boolean
  readonly idempotent?: boolean
  readonly openWorld?: boolean
  readonly untrustedContent?: boolean
}

export interface ToolDefinition<TInput = unknown> {
  readonly name: string
  readonly description: string
  /** Optional suffix appended ONLY for MCP protocol tool descriptions (where untrustedContentHint is absent). */
  readonly mcpDescriptionSuffix?: string
  readonly inputSchema: JSONSchema
  readonly behavior: ToolBehavior
  execute(input: TInput): Promise<ToolResult>
}
