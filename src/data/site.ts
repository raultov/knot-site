/**
 * Site-wide constants: repos, Docker image, canonical URLs, tagline and the
 * install/run commands that appear in more than one component. Keeping them
 * here means the UI, the build-time generators and the Web-MCP tools all read
 * the same values.
 */

export const site = {
  name: 'Knot',
  url: 'https://www.knot.kz',
  tagline: 'Codebase indexer for the AI era. Vector + Graph, CLI + MCP.',
  description:
    'High-performance codebase indexer. Semantic + structural search powered by Qdrant and Neo4j. MCP server + CLI. Ships with an interactive graph viewer, Swagger UI, Prometheus metrics, and OpenTelemetry tracing.',
  repo: {
    knot: 'https://github.com/raultov/knot',
    knotServer: 'https://github.com/raultov/knot-server',
  },
  dockerImage: 'raultov/knot-server',
} as const

export const knotInstallCommand =
  'curl --proto "=https" --tlsv1.2 -LsSf https://github.com/raultov/knot/releases/latest/download/knot-installer.sh | sh'

export const knotServerInstallCommand =
  "curl --proto '=https' --tlsv1.2 -LsSf https://github.com/raultov/knot-server/releases/latest/download/knot-server-installer.sh | sh"

/**
 * Snippet variants preserve the explicit `\` line-continuation that the
 * Installation section shows in its code blocks. Semantically identical to
 * the one-line commands above; visually distinct on purpose.
 */
export const knotInstallSnippet = `curl --proto "=https" --tlsv1.2 -LsSf \\
  https://github.com/raultov/knot/releases/latest/download/knot-installer.sh | sh`

export const knotServerInstallSnippet = `curl --proto '=https' --tlsv1.2 -LsSf \\
  https://github.com/raultov/knot-server/releases/latest/download/knot-server-installer.sh | sh`

export const dockerRunCommand = `docker run --network host \\
  -e KNOT_SERVER_RAYON_THREADS=2 \\
  -e KNOT_SERVER_BATCH_SIZE=16 \\
  -e KNOT_SERVER_INGEST_CONCURRENCY=1 \\
  raultov/knot-server \\
  --neo4j-password knot_secret_password \\
  --workspace-dir /path/to/your/repos`
