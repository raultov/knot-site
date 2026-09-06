import type { ToolDefinition } from '../types'
import { languages } from '../../data/languages'
import { jsonText } from '../format'
import {
  listSupportedLanguagesSchema,
  type ListSupportedLanguagesInput,
} from '../schemas'

/**
 * Tool #1 — the minimal viable tool. Reads the language list that also feeds
 * the footer of the site: one source of truth, two consumers (human UI and
 * agent tool).
 */
export const listSupportedLanguages: ToolDefinition<ListSupportedLanguagesInput> = {
  name: 'list-supported-languages',
  description:
    'Lists the programming languages and file formats that the Knot indexer can parse and index.',
  inputSchema: listSupportedLanguagesSchema,
  behavior: { readOnly: true, idempotent: true, openWorld: false },
  execute: async () => {
    return jsonText({
      count: languages.length,
      languages: [...languages],
    })
  },
}
