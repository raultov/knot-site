import { useState, useTransition } from 'react'
import '@/styles/Installation.css'

const knotSections = [
  {
    step: '1',
    heading: 'Install',
    description: 'One command installs knot-indexer, knot-mcp, and knot (CLI).',
    snippets: [
      {
        lang: 'bash',
        label: 'Install binaries',
        code: `curl --proto "=https" --tlsv1.2 -LsSf \\
  https://github.com/raultov/knot/releases/latest/download/knot-installer.sh | sh`,
      },
    ],
  },
  {
    step: '2',
    heading: 'Prerequisites',
    description: 'Knot needs Qdrant (vector search) and Neo4j (graph) running. The easiest way:',
    snippets: [
      {
        lang: 'bash',
        label: 'Start Qdrant & Neo4j',
        code: `# Download docker-compose
curl -O https://raw.githubusercontent.com/raultov/knot/master/docker-compose.yml
docker compose up -d`,
      },
    ],
  },
  {
    step: '3',
    heading: 'Index a codebase',
    description:
      'Point knot-indexer at any repo. Tune CPU and memory with environment variables to fit any machine.',
    snippets: [
      {
        lang: 'bash',
        label: 'Basic usage',
        code: `knot-indexer \\
  --repo-path /path/to/your/repo \\
  --neo4j-password secret`,
      },
      {
        lang: 'bash',
        label: 'Tune resource usage (~2 cores / ~1 GB RAM)',
        code: `KNOT_RAYON_THREADS=2 \\
KNOT_BATCH_SIZE=16 \\
KNOT_INGEST_CONCURRENCY=1 \\
  knot-indexer \\
  --repo-path /path/to/your/repo \\
  --neo4j-password secret`,
      },
    ],
  },
  {
    step: '4',
    heading: 'Query your code',
    description: 'Two ways to search your indexed codebase — pick the one that fits your workflow:',
    options: [
      {
        title: 'Option A — MCP server',
        subtitle:
          'Expose Knot to any MCP-compatible AI agent (Claude Desktop, Gemini CLI, Cursor, etc.).',
        snippets: [
          {
            lang: 'bash',
            label: 'Run knot-mcp',
            code: `knot-mcp`,
          },
          {
            lang: 'json',
            label: 'MCP config example (claude_desktop_config.json)',
            code: `{
  "mcpServers": {
    "knot-mcp": {
      "command": "/path/to/knot-mcp",
      "env": {
        "KNOT_REPO_PATH": "/path/to/indexed/repo",
        "KNOT_NEO4J_PASSWORD": "your-password"
      }
    }
  }
}`,
          },
        ],
      },
      {
        title: 'Option B — knot CLI + skills',
        subtitle:
          'A standalone client that queries the databases directly. Comes with downloadable agent skills for your favourite LLM CLI — but also works from a regular terminal.',
        snippets: [
          {
            lang: 'bash',
            label: 'Install agent skills',
            code: `curl -sO https://raw.githubusercontent.com/raultov/knot/master/.knot-agent.md \\
  && curl -fsSL https://raw.githubusercontent.com/raultov/knot/master/.knot-agent-skills.tar.gz | tar -xz`,
          },
          {
            lang: 'bash',
            label: 'Search, trace callers, explore files',
            code: `knot search "user authentication" \\
  --max-results 10 --repo my-app

knot callers "LoginService" \\
  --repo my-app

knot explore "src/services/auth.ts" \\
  --repo my-app`,
          },
        ],
      },
    ],
  },
] as const

const knotServerSections = [
  {
    step: '1',
    heading: 'Install',
    description:
      'Three ways to get knot-server. Option C bundles the databases — skip straight to Run.',
    options: [
      {
        title: 'Option A — Download binaries',
        subtitle:
          'Auto-detects your OS and architecture. Requires Qdrant and Neo4j running separately (see Prerequisites).',
        snippets: [
          {
            lang: 'bash',
            label: 'Install via curl',
            code: `curl --proto '=https' --tlsv1.2 -LsSf \\
  https://github.com/raultov/knot-server/releases/latest/download/knot-server-installer.sh | sh`,
          },
        ],
      },
      {
        title: 'Option B — Docker image',
        subtitle:
          'Lightweight image for containerized environments and Kubernetes. Requires Qdrant and Neo4j running separately.',
        snippets: [
          {
            lang: 'bash',
            label: 'Pull from Docker Hub',
            code: `docker pull raultov/knot-server:latest`,
          },
        ],
      },
      {
        title: 'Option C — Docker Compose (all-in-one)',
        subtitle:
          'Downloads a pre-configured docker-compose.yml that includes knot-server, Qdrant, and Neo4j. No prerequisites needed.',
        snippets: [
          {
            lang: 'bash',
            label: 'Download docker-compose.yml',
            code: `curl -O https://raw.githubusercontent.com/raultov/knot-server/master/docker-compose.yml`,
          },
        ],
      },
    ],
  },
  {
    step: '2',
    heading: 'Prerequisites',
    description:
      'Only needed for Options A and B. Knot Server requires Qdrant (vector search) and Neo4j (graph) running. If you chose Option C, skip this step.',
    snippets: [
      {
        lang: 'bash',
        label: 'Start Qdrant & Neo4j',
        code: `# Download docker-compose
curl -O https://raw.githubusercontent.com/raultov/knot-server/master/docker-compose.yml

# Start only the databases
docker compose up -d qdrant neo4j`,
      },
    ],
  },
  {
    step: '3',
    heading: 'Run',
    description: 'Pick the method that matches your install option:',
    options: [
      {
        title: 'Docker Compose (Option C)',
        subtitle: 'Launches knot-server + Qdrant + Neo4j in one command.',
        snippets: [
          {
            lang: 'bash',
            label: 'Start the full stack',
            code: `docker compose up

# knot-server → http://localhost:3000
# Qdrant     → http://localhost:6334
# Neo4j      → bolt://localhost:7687`,
          },
        ],
      },
      {
        title: 'Standalone binary (Option A)',
        subtitle: 'Run the binary directly. Point it at your databases.',
        snippets: [
          {
            lang: 'bash',
            label: 'Run knot-server',
            code: `export KNOT_WORKSPACE_DIR=$HOME/.knot/repos
export KNOT_NEO4J_PASSWORD=secret
knot-server`,
          },
        ],
      },
      {
        title: 'Docker run (Option B)',
        subtitle:
          'Run the container with --network host to reach databases on localhost. Tune resources for Kubernetes.',
        snippets: [
          {
            lang: 'bash',
            label: 'docker run with resource tuning',
            code: `docker run --network host \\
  -e KNOT_SERVER_RAYON_THREADS=2 \\
  -e KNOT_SERVER_BATCH_SIZE=16 \\
  -e KNOT_SERVER_INGEST_CONCURRENCY=1 \\
  raultov/knot-server \\
  --neo4j-password knot_secret_password \\
  --workspace-dir /path/to/your/repos`,
          },
        ],
      },
    ],
  },
  {
    step: '4',
    heading: 'REST API',
    description: 'All operations are exposed through a JSON REST API on port 3000.',
    options: [
      {
        title: 'Indexing & repo management',
        subtitle:
          'Register, list, sync, and delete repositories. POST /api/repos is idempotent: re-registering a repo atomically rebuilds its graph and vector entries. Supports both remote Git URLs and local working-tree paths.',
        snippets: [
          {
            lang: 'bash',
            label: 'Register a Git repository',
            code: `curl -X POST http://localhost:3000/api/repos \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://github.com/your-org/your-repo.git",
    "name": "my-repo",
    "webhook_secret": "my-secret"
  }'

# Register a local working tree:
# curl -X POST http://localhost:3000/api/repos \\
#   -d '{"name": "local", "path": "/path/to/repo"}'

# List repos:   GET /api/repos
# Repo status:  GET /api/repos/:id
# Re-index:     POST /api/repos/:id/sync
# Delete:       DELETE /api/repos/:id`,
          },
        ],
      },
      {
        title: 'Webhooks',
        subtitle:
          'GitHub, GitLab, and Bitbucket push events trigger incremental re-indexing with HMAC-SHA256 validation.',
        snippets: [
          {
            lang: 'bash',
            label: 'Webhook endpoint',
            code: `# Configure in your Git provider settings:
# URL:    http://your-server:3000/api/webhook/:id
# Secret: same as webhook_secret from registration

# Supported: GitHub, GitLab, Bitbucket
# Validates: HMAC-SHA256 signatures
# Triggers:  incremental re-indexing on push`,
          },
        ],
      },
      {
        title: 'Code intelligence',
        subtitle:
          'Semantic search, reverse dependency lookup, file exploration, and cross-repo dependency graph.',
        snippets: [
          {
            lang: 'bash',
            label: 'Search, callers, explore, deps',
            code: `# Semantic search
curl "/api/repos/my-repo/search?q=authentication"

# Reverse dependency lookup
curl "/api/repos/my-repo/callers?entity=handleRequest"

# File structure inspection
curl "/api/repos/my-repo/explore?path=src/auth.ts"

# Cross-repo dependency graph
curl "/api/repos/my-repo/deps"`,
          },
        ],
      },
      {
        title: 'Health & monitoring',
        subtitle: 'Check server, Qdrant, and Neo4j connectivity plus repo statistics.',
        snippets: [
          {
            lang: 'bash',
            label: 'Health check',
            code: `curl http://localhost:3000/api/health`,
          },
        ],
      },
    ],
  },
  {
    step: '5',
    heading: 'Explore visually & via API',
    description:
      'Two zero-config UIs ship with knot-server. Open them in your browser once it’s running:',
    options: [
      {
        title: 'Graph Viewer',
        subtitle:
          'Interactive force-directed graph at /graph. Filter by entity kind, toggle relationship types, focus at any depth, color-coded by language and kind.',
        snippets: [
          {
            lang: 'bash',
            label: 'Open in browser',
            code: `open http://localhost:3000/graph`,
          },
        ],
      },
      {
        title: 'Swagger UI',
        subtitle:
          'Interactive REST playground powered by utoipa. Browse every endpoint, try requests, and download the OpenAPI spec for codegen.',
        snippets: [
          {
            lang: 'bash',
            label: 'Open in browser',
            code: `open http://localhost:3000/docs`,
          },
        ],
      },
    ],
  },
  {
    step: '6',
    heading: 'Index from your editor',
    description:
      'Two shortcuts to register and index the repo you are working on — without leaving your editor or terminal.',
    options: [
      {
        title: '/index slash command (OpenCode)',
        subtitle:
          'Type /index in OpenCode and it will health-check the server, derive a repo id, register or sync, poll until indexed, and verify with a search call.',
        snippets: [
          {
            lang: 'bash',
            label: 'Run from OpenCode',
            code: `# Inside OpenCode, just type:
/index

# Bundled with knot-server in commands/index.toml.
# Performs: health check → derive id → register/sync →
# poll until indexed → verify with search.`,
          },
        ],
      },
      {
        title: 'Install agent skills bundle',
        subtitle:
          'Self-extracting bundle with 9 per-topic skills for Claude Desktop, Cursor, OpenCode, and Copilot. One command, no config.',
        snippets: [
          {
            lang: 'bash',
            label: 'curl | bash',
            code: `curl -fsSL https://raw.githubusercontent.com/raultov/knot-server/master/.knot-server-agent-skills.sh | bash`,
          },
          {
            lang: 'text',
            label: '9 skills included',
            code: `# preflight   — health checks & environment setup
# search      — semantic + structural code search
# callers     — reverse dependency lookup
# explore     — file & module architecture inspection
# deps        — cross-repo dependency graph
# graph       — graph viewer operations
# repos       — repo registration & sync
# index       — end-to-end /index workflow
# workflows   — multi-step recipes`,
          },
        ],
      },
    ],
  },
  {
    step: '7',
    heading: 'Monitor in production',
    description:
      'Production-grade observability ships with knot-server: Prometheus metrics out of the box and opt-in OpenTelemetry distributed tracing.',
    options: [
      {
        title: 'Prometheus metrics',
        subtitle:
          'GET /metrics on the same port (enabled by default) exposes HTTP, indexing pipeline, registry queue, and process metrics — ready for Grafana dashboards.',
        snippets: [
          {
            lang: 'yaml',
            label: 'Prometheus scrape config',
            code: `# Try it: curl http://localhost:3000/metrics
scrape_configs:
  - job_name: 'knot-server'
    scrape_interval: 15s
    metrics_path: '/metrics'
    static_configs:
      - targets: ['knot-server:3000']`,
          },
        ],
      },
      {
        title: 'OpenTelemetry tracing',
        subtitle:
          'Opt-in W3C-compliant distributed tracing. Instruments every HTTP endpoint, indexing job (clone, pull, sync), and the scheduler loop; exports spans via OTLP gRPC to Jaeger, Tempo, or any collector. Inbound traceparent headers are honored for cross-service traces.',
        snippets: [
          {
            lang: 'bash',
            label: 'Enable tracing',
            code: `export KNOT_SERVER_TRACING_ENABLED=true
export KNOT_SERVER_OTLP_ENDPOINT=http://localhost:4317
export KNOT_SERVER_TRACE_SAMPLE_RATIO=1.0
knot-server`,
          },
        ],
      },
    ],
  },
] as const

interface SnippetData {
  lang: string
  label: string
  code: string
}

function CodeSnippet({ label, code }: SnippetData) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="install__card">
      <div className="install__card-header">
        <span className="install__card-label">{label}</span>
        <button
          className="install__card-copy"
          onClick={handleCopy}
          aria-label={`Copy ${label} snippet`}
        >
          <span aria-live="polite">{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>
      <pre className="install__card-code">
        <code>{code}</code>
      </pre>
    </div>
  )
}

function Installation() {
  const [activeTab, setActiveTab] = useState<'knot' | 'server'>('knot')
  const [, startTransition] = useTransition()

  const handleTab = (tab: 'knot' | 'server') => {
    startTransition(() => setActiveTab(tab))
  }

  return (
    <section id="install" className="install">
      <div className="container">
        <h2 className="section-title">Get started in seconds</h2>
        <p className="section-subtitle">
          One command to install, one to index, one to search. Knot is designed to get out of your
          way.
        </p>

        <div className="install__tabs">
          <button
            className={`install__tab ${activeTab === 'knot' ? 'active' : ''}`}
            onClick={() => handleTab('knot')}
          >
            Knot
          </button>
          <button
            className={`install__tab ${activeTab === 'server' ? 'active' : ''}`}
            onClick={() => handleTab('server')}
          >
            Knot Server
          </button>
        </div>

        {activeTab === 'knot' ? (
          <div className="install__sections">
            {knotSections.map((section) => (
              <div key={section.step} className="install__section">
                <div className="install__section-header">
                  <span className="install__step">{section.step}</span>
                  <div>
                    <h3 className="install__section-title">{section.heading}</h3>
                    <p className="install__section-desc">{section.description}</p>
                  </div>
                </div>

                {'snippets' in section && section.snippets && (
                  <div className="install__section-snippets">
                    {section.snippets.map((s, i) => (
                      <CodeSnippet key={i} {...s} />
                    ))}
                  </div>
                )}

                {'options' in section && section.options && (
                  <div className="install__options">
                    {section.options.map((opt) => (
                      <div key={opt.title} className="install__option">
                        <div className="install__option-header">
                          <h4 className="install__option-title">{opt.title}</h4>
                          <p className="install__option-subtitle">{opt.subtitle}</p>
                        </div>
                        <div className="install__section-snippets">
                          {opt.snippets.map((s, i) => (
                            <CodeSnippet key={i} {...s} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="install__sections">
            {knotServerSections.map((section) => (
              <div key={section.step} className="install__section">
                <div className="install__section-header">
                  <span className="install__step">{section.step}</span>
                  <div>
                    <h3 className="install__section-title">{section.heading}</h3>
                    <p className="install__section-desc">{section.description}</p>
                  </div>
                </div>

                {'snippets' in section && section.snippets && (
                  <div className="install__section-snippets">
                    {section.snippets.map((s, i) => (
                      <CodeSnippet key={i} {...s} />
                    ))}
                  </div>
                )}

                {'options' in section && section.options && (
                  <div
                    className={`install__options ${section.options.length === 4 ? 'install__options--quad' : section.options.length === 3 ? 'install__options--triple' : ''}`}
                  >
                    {section.options.map((opt) => (
                      <div key={opt.title} className="install__option">
                        <div className="install__option-header">
                          <h4 className="install__option-title">{opt.title}</h4>
                          <p className="install__option-subtitle">{opt.subtitle}</p>
                        </div>
                        <div className="install__section-snippets">
                          {opt.snippets.map((s, i) => (
                            <CodeSnippet key={i} {...s} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="install__footer">
          <a
            href={
              activeTab === 'knot'
                ? 'https://github.com/raultov/knot#readme'
                : 'https://github.com/raultov/knot-server#readme'
            }
            target="_blank"
            rel="noopener noreferrer"
          >
            Read the full documentation →
          </a>
        </div>
      </div>
    </section>
  )
}

export default Installation
