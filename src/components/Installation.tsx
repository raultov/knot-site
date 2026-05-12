import { useState, useTransition } from 'react'
import '@/styles/Installation.css'

const knotSnippets = [
  {
    lang: 'bash',
    label: 'Install binaries',
    code: `curl --proto "=https" --tlsv1.2 -LsSf \\
  https://github.com/raultov/knot/releases/latest/download/knot-installer.sh | sh`,
  },
  {
    lang: 'bash',
    label: 'Start Qdrant & Neo4j',
    code: `# Download docker-compose
curl -O https://raw.githubusercontent.com/raultov/knot/master/docker-compose.yml
docker compose up -d`,
  },
  {
    lang: 'bash',
    label: 'Index a codebase',
    code: `knot-indexer \\
  --repo-path /path/to/your/repo \\
  --neo4j-password secret`,
  },
  {
    lang: 'bash',
    label: 'Search via CLI',
    code: `# Install agent skills
curl -sO https://raw.githubusercontent.com/raultov/knot/master/.knot-agent.md \\
  && curl -fsSL https://raw.githubusercontent.com/raultov/knot/master/.knot-agent-skills.tar.gz | tar -xz

knot search "user authentication" \\
  --max-results 10 --repo my-app

knot callers "LoginService" \\
  --repo my-app

knot explore "src/services/auth.ts" \\
  --repo my-app`,
  },
  {
    lang: 'bash',
    label: 'Configure MCP server',
    code: `# For Claude Desktop, Gemini CLI, Cursor, etc.
knot-mcp

# MCP config example (claude_desktop_config.json):
{
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
] as const

const knotServerSnippets = [
  {
    lang: 'bash',
    label: 'Install binaries & Docker Image',
    code: `curl --proto '=https' --tlsv1.2 -LsSf \\
  https://github.com/raultov/knot-server/releases/latest/download/knot-server-installer.sh | sh
  
# Or use the versatile docker image for containerized environments (k8s)
docker pull raultov/knot-server:latest`,
  },
  {
    lang: 'bash',
    label: 'Start Standalone',
    code: `# Download docker-compose
curl -O https://raw.githubusercontent.com/raultov/knot-server/master/docker-compose.yml

# Start databases
docker compose up -d qdrant neo4j

# Run the server binary
export KNOT_WORKSPACE_DIR=$HOME/.knot/repos
export KNOT_NEO4J_PASSWORD=secret
knot-server`,
  },
  {
    lang: 'bash',
    label: 'Docker Compose (All-in-one)',
    code: `# Download docker-compose and launch the full stack
curl -O https://raw.githubusercontent.com/raultov/knot-server/master/docker-compose.yml
docker compose up

# knot-server is now running on http://localhost:3000
# Qdrant on http://localhost:6334, Neo4j on bolt://localhost:7687`,
  },
  {
    lang: 'bash',
    label: 'REST API & Agent Skills',
    code: `# Register a repository
curl -X POST http://localhost:3000/api/repos \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://github.com/raultov/knot.git",
    "name": "knot-core",
    "webhook_secret": "my-secret"
  }'

# Semantic search via REST
curl "http://localhost:3000/api/repos/knot-core/search?q=webhook"

# Download skills for AI Agents:

# Cursor
curl -sL https://raw.githubusercontent.com/raultov/knot-server/master/skills/cursor-rules.md >> .cursorrules

# GitHub Copilot
mkdir -p .github && curl -sL https://raw.githubusercontent.com/raultov/knot-server/master/skills/copilot-instructions.md >> .github/copilot-instructions.md

# Claude Code / Gemini CLI / opencode / Cline / Aider
curl -sL https://raw.githubusercontent.com/raultov/knot-server/master/skills/system-prompt.md > knot-skills.md`,
  },
] as const

type Snippet = (typeof knotSnippets)[number] | (typeof knotServerSnippets)[number]

function CodeSnippet({ label, code }: Snippet) {
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
          One command to install, one to index, one to search. Knot is designed
          to get out of your way.
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
          <div className="install__grid">
            {knotSnippets.map((s, i) => (
              <CodeSnippet key={i} {...s} />
            ))}
          </div>
        ) : (
          <div className="install__grid">
            {knotServerSnippets.map((s, i) => (
              <CodeSnippet key={i} {...s} />
            ))}
          </div>
        )}

        <div className="install__footer">
          <a
            href={activeTab === 'knot' ? "https://github.com/raultov/knot#readme" : "https://github.com/raultov/knot-server#readme"}
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
