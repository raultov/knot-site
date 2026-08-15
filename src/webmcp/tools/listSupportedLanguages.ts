import type { WebMcpTool } from '@/webmcp/types'
import { languages } from '@/data/languages'
import { jsonText } from './format'
import {
  listSupportedLanguagesSchema,
  type ListSupportedLanguagesInput,
} from '@/webmcp/schemas'

/**
 * Tool #1 — the minimal viable tool. Reads the language list that also feeds
 * the footer of the site: one source of truth, two consumers (human UI and
 * agent tool).
 */
export const listSupportedLanguages: WebMcpTool<ListSupportedLanguagesInput> = {
  name: 'list-supported-languages',
  description:
    'Lists the programming languages and file formats that the Knot indexer can parse and index.',
  inputSchema: listSupportedLanguagesSchema,
  annotations: { readOnlyHint: true },
  execute: async () => {
    return jsonText({
      count: languages.length,
      languages: [...languages],
    })
  },
}
