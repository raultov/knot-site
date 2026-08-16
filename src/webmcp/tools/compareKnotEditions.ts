import type { WebMcpTool } from '@/webmcp/types'
import { site } from '@/data/site'
import { features } from '@/data/features'
import { serverFeatures } from '@/data/serverFeatures'
import { compareKnotEditionsSchema, type CompareKnotEditionsInput } from '@/webmcp/schemas'
import { jsonText } from './format'

/**
 * Tool #4 — complex structured answer about the two editions of the product.
 * Everything is derived from the shared data layer.
 */
export const compareKnotEditions: WebMcpTool<CompareKnotEditionsInput> = {
  name: 'compare-knot-editions',
  description:
    'Compares the two Knot editions. Knot is a 3-in-1 tool (indexer, MCP server, and CLI). Knot Server adds a REST API, supports multiple instances, and coordinates them for enterprise deployments.',
  inputSchema: compareKnotEditionsSchema,
  annotations: { readOnlyHint: true },
  execute: async () => {
    return jsonText({
      editions: [
        {
          product: 'knot',
          repo: site.repo.knot,
          role: '3-in-1 tool: Codebase indexer, MCP server, and CLI client.',
          capabilities: features.map((f) => f.title),
          distribution: 'curl installer script',
          deployment: 'local machine / CI runners',
        },
        {
          product: 'knot-server',
          repo: site.repo.knotServer,
          role: 'Enterprise edition: Includes indexer and REST API (equivalent to MCP/CLI), allowing multiple instances and coordination for enterprise deployments.',
          capabilities: serverFeatures.map((f) => f.title),
          distribution: `curl installer, Docker image (${site.dockerImage}) or docker-compose`,
          deployment: 'server, cluster or Kubernetes',
        },
      ],
      whenToUse: [
        {
          product: 'knot',
          use: 'You need an indexer, MCP server, or CLI tool on a single local machine.',
        },
        {
          product: 'knot-server',
          use: 'You need a REST API, multi-instance coordination, or enterprise deployment.',
        },
      ],
    })
  },
}
