import type { ToolDefinition } from './types'
import { listSupportedLanguages } from './definitions/listSupportedLanguages'
import { getLatestReleases } from './definitions/getLatestReleases'
import { searchKnotCapabilities } from './definitions/searchKnotCapabilities'
import { compareKnotEditions } from './definitions/compareKnotEditions'

export * from './types'
export * from './format'
export * from './schemas'
export { listSupportedLanguages } from './definitions/listSupportedLanguages'
export { getLatestReleases } from './definitions/getLatestReleases'
export { searchKnotCapabilities } from './definitions/searchKnotCapabilities'
export { compareKnotEditions } from './definitions/compareKnotEditions'

/**
 * The 4 portable tool definitions shared between the WebMCP client registry
 * and the /mcp server endpoint. Ordered deterministically for prompt caching.
 */
export const portableTools: readonly ToolDefinition[] = [
  listSupportedLanguages,
  getLatestReleases,
  searchKnotCapabilities,
  compareKnotEditions,
]
