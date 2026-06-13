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
        subtitle: 'Register, list, sync, and delete repositories.',
        snippets: [
          {
            lang: 'bash',
            label: 'Register a repository',
            code: `curl -X POST http://localhost:3000/api/repos \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://github.com/your-org/your-repo.git",
    "name": "my-repo",
    "webhook_secret": "my-secret"
  }'

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
