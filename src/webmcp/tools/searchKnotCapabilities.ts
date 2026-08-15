import type { WebMcpTool } from '@/webmcp/types'
import { features } from '@/data/features'
import { serverFeatures } from '@/data/serverFeatures'
import { searchKnotCapabilitiesSchema, type SearchKnotCapabilitiesInput } from '@/webmcp/schemas'
import { jsonText } from './format'

/**
 * Tool #3 — semantic-ish search over the capability data. A real agent would
 * rather ask than scrape the Features section.
 */

function score(text: string, query: string): number {
  const haystack = text.toLowerCase()
  const needle = query.toLowerCase()
  if (!needle) return 0
  if (haystack === needle) return 100
  if (haystack.includes(needle)) return 80 - (haystack.indexOf(needle) > 0 ? 10 : 0)
  let points = 0
  for (const word of needle.split(/\s+/)) {
    if (haystack.includes(word)) points += 30
  }
  return points
}

export const searchKnotCapabilities: WebMcpTool<SearchKnotCapabilitiesInput> = {
  name: 'search-knot-capabilities',
  description:
    'Searches Knot and Knot Server capabilities by keyword. Returns matching capabilities with a relevance score.',
  inputSchema: searchKnotCapabilitiesSchema,
  annotations: { readOnlyHint: true },
  execute: async (input) => {
    const query = input.query.trim()
    if (!query) {
      return jsonText({ matches: [] })
    }

    const pools =
      input.area === 'server'
        ? [{ area: 'server' as const, items: serverFeatures }]
        : input.area === 'cli'
          ? [{ area: 'cli' as const, items: features }]
          : [
              { area: 'cli' as const, items: features },
              { area: 'server' as const, items: serverFeatures },
            ]

    const matches = pools
      .flatMap((pool) =>
        pool.items.map((f) => ({
          area: pool.area,
          title: f.title,
          description: f.description,
          score: score(`${f.title} ${f.description}`, query),
        })),
      )
      .filter((m) => m.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)

    return jsonText({ query, matches })
  },
}
