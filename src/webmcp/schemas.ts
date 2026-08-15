import type { JSONSchema } from './types'

/**
 * Type-level JSON Schema → TypeScript mapping for the subset of JSON Schema
 * this site uses (object/string/number/enum/array + required).
 *
 * Every tool's input type is DERIVED from its schema constant, so the schema
 * the browser validates against and the type `execute` receives cannot
 * diverge. The Lighthouse "WebMCP schemas are valid" audit depends on the
 * former; compile safety on the latter.
 */
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

export const listSupportedLanguagesSchema = {
  type: 'object',
  properties: {},
  required: [],
} as const satisfies JSONSchema

export const getLatestReleasesSchema = {
  type: 'object',
  properties: {
    product: {
      type: 'string',
      enum: ['knot', 'knot-server', 'all'],
      description: 'Which product to report releases for. Defaults to all.',
    },
    limit: {
      type: 'number',
      minimum: 1,
      maximum: 10,
      description: 'Maximum number of releases to return. Defaults to 5.',
    },
  },
  required: [],
} as const satisfies JSONSchema

export const searchKnotCapabilitiesSchema = {
  type: 'object',
  properties: {
    query: {
      type: 'string',
      description: 'Free-text search over Knot and Knot Server capabilities.',
    },
    area: {
      type: 'string',
      enum: ['cli', 'server'],
      description: 'Restrict the search to the CLI product or the server.',
    },
  },
  required: ['query'],
} as const satisfies JSONSchema

export const compareKnotEditionsSchema = {
  type: 'object',
  properties: {},
  required: [],
} as const satisfies JSONSchema

export const getInstallCommandSchema = {
  type: 'object',
  properties: {
    product: {
      type: 'string',
      enum: ['knot', 'knot-server'],
      description: 'Which product to install.',
    },
    method: {
      type: 'string',
      enum: ['curl', 'docker', 'compose'],
      description:
        'Install method. docker is only available for knot-server; compose only for knot-server.',
    },
    tuning: {
      type: 'object',
      properties: {
        cores: {
          type: 'number',
          minimum: 1,
          maximum: 64,
          description: 'Maps to the RAYON_THREADS environment variable.',
        },
        ramGb: {
          type: 'number',
          minimum: 1,
          maximum: 128,
          description: 'Maps to the BATCH_SIZE environment variable (16 per GB).',
        },
      },
      required: [],
      description: 'Optional resource tuning. Only applies to knot-server docker runs.',
    },
  },
  required: ['product', 'method'],
} as const satisfies JSONSchema

export const copyInstallCommandSchema = {
  type: 'object',
  properties: {
    product: {
      type: 'string',
      enum: ['knot', 'knot-server'],
      description: 'Which product install command to copy. Defaults to knot.',
    },
  },
  required: [],
} as const satisfies JSONSchema

export type ListSupportedLanguagesInput = SchemaType<typeof listSupportedLanguagesSchema>
export type GetLatestReleasesInput = SchemaType<typeof getLatestReleasesSchema>
export type SearchKnotCapabilitiesInput = SchemaType<typeof searchKnotCapabilitiesSchema>
export type CompareKnotEditionsInput = SchemaType<typeof compareKnotEditionsSchema>
export type GetInstallCommandInput = SchemaType<typeof getInstallCommandSchema>
export type CopyInstallCommandInput = SchemaType<typeof copyInstallCommandSchema>
