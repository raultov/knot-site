import type { WebMcpTool } from '@/webmcp/types'
import feed from '@/data/updates.json'
import { getLatestReleasesSchema, type GetLatestReleasesInput } from '@/webmcp/schemas'
import { errorText, jsonText } from './format'

/**
 * Tool #2 — the pure AEO case. The same feed that renders the Updates
 * section is exposed as structured JSON, so an agent gets release data
 * without scraping the rendered DOM.
 */

type ReleaseEntry = {
  repo: string
  version: string
  title: string
  date: string | null
  summary: string
  changelogUrl: string
}

const entries: ReleaseEntry[] = Array.isArray(feed.entries) ? (feed.entries as ReleaseEntry[]) : []

export const getLatestReleases: WebMcpTool<GetLatestReleasesInput> = {
  name: 'get-latest-releases',
  description:
    'Returns the latest releases of Knot and Knot Server with version, date, summary and CHANGELOG link.',
  inputSchema: getLatestReleasesSchema,
  annotations: { readOnlyHint: true },
  execute: async (input) => {
    const { product = 'all', limit = 5 } = input

    if (limit < 1 || limit > 10) {
      return errorText('limit must be between 1 and 10')
    }

    const filtered =
      product === 'all' ? entries : entries.filter((e) => e.repo === product)

    if (filtered.length === 0) {
      return jsonText({ releases: [], note: 'No release data available yet.' })
    }

    return jsonText({
      generatedAt: (feed as { generatedAt?: string }).generatedAt ?? null,
      releases: filtered.slice(0, limit).map((e) => ({
        product: e.repo,
        version: e.version,
        title: e.title,
        date: e.date,
        summary: e.summary,
        changelogUrl: e.changelogUrl,
      })),
    })
  },
}
