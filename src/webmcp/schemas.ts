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

export type GetInstallCommandInput = SchemaType<typeof getInstallCommandSchema>
export type CopyInstallCommandInput = SchemaType<typeof copyInstallCommandSchema>
