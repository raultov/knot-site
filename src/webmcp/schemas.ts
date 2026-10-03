import type { JSONSchema } from './types'
import type { SchemaType } from '@/toolcore/schemas'

export type { SchemaType }
export {
  listSupportedLanguagesSchema,
  getLatestReleasesSchema,
  searchKnotCapabilitiesSchema,
  compareKnotEditionsSchema,
} from '@/toolcore/schemas'

export type {
  ListSupportedLanguagesInput,
  GetLatestReleasesInput,
  SearchKnotCapabilitiesInput,
  CompareKnotEditionsInput,
} from '@/toolcore/schemas'

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
        'Install method. docker: knot-server only. compose: Qdrant + Neo4j stack for knot, all-in-one docker-compose.yml for knot-server.',
    },
    tuning: {
      type: 'object',
      properties: {
        cores: {
          type: 'number',
          minimum: 1,
          maximum: 64,
          description: 'CPU cores for indexing. Sets KNOT_SERVER_RAYON_THREADS.',
        },
        ramGb: {
          type: 'number',
          minimum: 1,
          maximum: 128,
          description:
            'RAM in GB for knot-server. Picks the profile: under 2 low memory, 2-4 balanced, 5+ max throughput.',
        },
      },
      required: [],
      description:
        'Only for product knot-server with method docker; rejected otherwise. Install commands are machine-independent.',
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

export type GetInstallCommandInput = SchemaType<typeof getInstallCommandSchema>
export type CopyInstallCommandInput = SchemaType<typeof copyInstallCommandSchema>
