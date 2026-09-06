import type { JSONSchema, SchemaType } from './types'

export type { SchemaType }

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
      maximum: 4,
      description: 'Maximum number of releases to return, 1 to 4. Defaults to 3.',
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

export type ListSupportedLanguagesInput = SchemaType<typeof listSupportedLanguagesSchema>
export type GetLatestReleasesInput = SchemaType<typeof getLatestReleasesSchema>
export type SearchKnotCapabilitiesInput = SchemaType<typeof searchKnotCapabilitiesSchema>
export type CompareKnotEditionsInput = SchemaType<typeof compareKnotEditionsSchema>
