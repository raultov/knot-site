import type { WebMcpTool } from './types'
import { withLogging } from './invocationLog'
import { listSupportedLanguages } from './tools/listSupportedLanguages'
import { getLatestReleases } from './tools/getLatestReleases'
import { searchKnotCapabilities } from './tools/searchKnotCapabilities'
import { compareKnotEditions } from './tools/compareKnotEditions'
import { getInstallCommand } from './tools/getInstallCommand'
import { copyInstallCommand } from './tools/copyInstallCommand'

/**
 * The tool set exposed to browsers that support Web-MCP. Registered by
 * `useWebMcp` on mount; every tool is wrapped in `withLogging` so the live
 * panel in the Agent Tools section shows each invocation.
 */
export const knotTools: readonly WebMcpTool[] = [
  withLogging(listSupportedLanguages),
  withLogging(getLatestReleases),
  withLogging(searchKnotCapabilities),
  withLogging(compareKnotEditions),
  withLogging(getInstallCommand),
  withLogging(copyInstallCommand),
]
