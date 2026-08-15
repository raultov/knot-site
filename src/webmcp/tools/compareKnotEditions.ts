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
    'Compares the two Knot editions: the CLI indexer (knot) and the distributed server (knot-server). Returns a structured side-by-side comparison.',
  inputSchema: compareKnotEditionsSchema,
  annotations: { readOnlyHint: true },
  execute: async () => {
    return jsonText({
      editions: [
        {
          product: 'knot',
          repo: site.repo.knot,
          role: 'Single-machine codebase indexer, MCP server and CLI client.',
          capabilities: features.map((f) => f.title),
          distribution: 'curl installer script',
          deployment: 'local machine / CI runners',
        },
        {
          product: 'knot-server',
          repo: site.repo.knotServer,
          role: 'Distributed REST API, scheduler and web UIs for multi-repo, multi-user indexing.',
          capabilities: serverFeatures.map((f) => f.title),
          distribution: `curl installer, Docker image (${site.dockerImage}) or docker-compose`,
          deployment: 'server, cluster or Kubernetes',
        },
      ],
      whenToUse: [
        {
          product: 'knot',
          use: 'You index repositories on your own machine and query them via CLI or an MCP agent.',
        },
        {
          product: 'knot-server',
          use: 'You need a shared, always-on index for a team, webhooks-driven re-indexing, or a REST API for other services.',
        },
      ],
    })
  },
}
