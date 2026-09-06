import type { WebMcpTool } from './types'
import { portableTools } from '@/toolcore'
import { toWebMcpTool } from './adapters/toWebMcpTool'
import { withLogging } from './invocationLog'
import { getInstallCommand } from './tools/getInstallCommand'
import { copyInstallCommand } from './tools/copyInstallCommand'

/**
 * The tool set exposed to browsers that support Web-MCP. Registered by
 * `useWebMcp` on mount; every tool is wrapped in `withLogging` so each
 * invocation is recorded in the invocation log for auditing.
 */
export const knotTools: readonly WebMcpTool[] = [
  ...portableTools.map((def) => withLogging(toWebMcpTool(def))),
  withLogging(getInstallCommand),
  withLogging(copyInstallCommand),
]
