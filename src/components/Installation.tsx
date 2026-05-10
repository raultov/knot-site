import { useState } from 'react'
import '@/styles/Installation.css'

const snippets = [
  {
    lang: 'bash',
    label: 'Install binaries',
    code: `curl --proto "=https" --tlsv1.2 -LsSf \\
  https://github.com/raultov/knot/releases/latest/download/knot-installer.sh | sh`,
  },
  {
    lang: 'bash',
    label: 'Index a codebase',
    code: `docker compose up -d              # Start Qdrant + Neo4j
knot-indexer \\
  --repo-path /path/to/your/repo \\
  --neo4j-password secret`,
  },
  {
    lang: 'bash',
    label: 'Search via CLI',
    code: `knot search "user authentication" \\
  --max-results 10 --repo my-app

knot callers "LoginService" \\
  --repo my-app

knot explore "src/services/auth.ts" \\
  --repo my-app`,
  },
  {
    lang: 'bash',
    label: 'Start MCP server',
    code: `# For Claude Desktop, Gemini CLI, Cursor, etc.
knot-mcp

# MCP config example (claude_desktop_config.json):
{
  "mcpServers": {
    "knot": {
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

type Snippet = (typeof snippets)[number]

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
  return (
    <section id="install" className="install">
      <div className="container">
        <h2 className="section-title">Get started in seconds</h2>
        <p className="section-subtitle">
          One command to install, one to index, one to search. Knot is designed
          to get out of your way.
        </p>

        <div className="install__grid">
          {snippets.map((s, i) => (
            <CodeSnippet key={i} {...s} />
          ))}
        </div>

        <div className="install__footer">
          <a
            href="https://github.com/raultov/knot#readme"
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
