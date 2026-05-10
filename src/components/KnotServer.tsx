import { useState } from 'react'
import '@/styles/KnotServer.css'

const serverFeatures = [
  {
    title: 'REST API',
    description:
      'Register repos, trigger indexing, and query search/callers/explore endpoints via a clean JSON REST API.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
        <path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
        <path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4Z" />
      </svg>
    ),
  },
  {
    title: 'Git Webhooks',
    description:
      'GitHub, GitLab, and Bitbucket webhooks with HMAC-SHA256 signature validation trigger instant incremental re-indexing on every push.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.5 2.5 2.5 21.5" />
        <path d="M21.5 2.5a10 10 0 0 1-8.84 13.45L2.5 21.5" />
        <path d="M8.34 15.66a4 4 0 0 0 5.66-5.66" />
      </svg>
    ),
  },
  {
    title: 'Background Scheduler',
    description:
      'Automatic stale lock cleanup and periodic re-indexing of repositories that haven\'t been synced recently.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
      </svg>
    ),
  },
  {
    title: 'Cluster & HA',
    description:
      'Horizontal scale-out with file-based distributed locking. Deploy multiple instances sharing an NFS/EFS workspace or a Kubernetes RWX PVC.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="6" width="6" height="12" rx="1" />
        <rect x="9" y="3" width="6" height="18" rx="1" />
        <rect x="17" y="6" width="6" height="12" rx="1" />
        <path d="M7 10h2M15 10h2M7 14h2M15 14h2" />
      </svg>
    ),
  },
  {
    title: 'Official Docker Image',
    description:
      'Deploy with raultov/knot-server from Docker Hub. Pre-packaged with git and SSH — one docker compose up launches the full stack with Qdrant and Neo4j.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
        <path d="M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12" />
        <path d="M7 3.5L12 6l5-2.5M4 11l8 5M4 13l8 5M20 11l-8 5M20 13l-8 5" />
      </svg>
    ),
  },
] as const

type ServerFeature = (typeof serverFeatures)[number]

const codeSnippet = `# Register a repository
curl -X POST http://localhost:3000/api/repos \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://github.com/raultov/knot.git",
    "name": "knot-core",
    "branch": "master",
    "webhook_secret": "my-webhook-secret"
  }'

# Semantic search via REST
curl "http://localhost:3000/api/repos/knot-core/search?q=webhook+validation"

# Trigger re-index
curl -X POST http://localhost:3000/api/repos/knot-core/sync`

const dockerComposeSnippet = `# Download docker-compose and launch the full stack
curl -O https://raw.githubusercontent.com/raultov/knot-server/master/docker-compose.yml
docker compose up

# knot-server is now running on http://localhost:3000
# Qdrant on http://localhost:6334, Neo4j on bolt://localhost:7687`

function ServerFeatureCard({ title, description, icon }: ServerFeature) {
  return (
    <div className="knotserver__card reveal">
      <div className="knotserver__icon">{icon}</div>
      <h3 className="knotserver__card-title">{title}</h3>
      <p className="knotserver__card-desc">{description}</p>
    </div>
  )
}

function KnotServer() {
  const [copied, setCopied] = useState(false)
  const [dockerCopied, setDockerCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(codeSnippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDockerCopy = async () => {
    await navigator.clipboard.writeText(dockerComposeSnippet)
    setDockerCopied(true)
    setTimeout(() => setDockerCopied(false), 2000)
  }

  return (
    <section id="server" className="knotserver">
      <div className="container">
        <div className="knotserver__header">
          <span className="knotserver__badge">Enterprise</span>
          <h2 className="section-title">
            Scale out with{' '}
            <span className="knotserver__highlight">Knot Server</span>
          </h2>
          <p className="section-subtitle">
            A distributed REST API and background task scheduler for managing
            and indexing Git repositories across a cluster. Turns Knot from a
            single-machine CLI tool into a highly available enterprise service.
          </p>
        </div>

        <div className="knotserver__grid">
          {serverFeatures.map((f) => (
            <ServerFeatureCard key={f.title} {...f} />
          ))}
        </div>

        <div className="knotserver__code">
          <div className="knotserver__code-header">
            <div className="knotserver__code-dots">
              <span /><span /><span />
            </div>
            <span className="knotserver__code-label">REST API workflow</span>
            <button
              className="knotserver__code-copy"
              onClick={handleCopy}
              aria-label="Copy REST API code snippet"
            >
              <span aria-live="polite">{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
          <pre className="knotserver__code-body">
            <code>{codeSnippet}</code>
          </pre>
        </div>

        <div className="knotserver__code">
          <div className="knotserver__code-header">
            <div className="knotserver__code-dots">
              <span /><span /><span />
            </div>
            <span className="knotserver__code-label">Docker Compose deployment</span>
            <button
              className="knotserver__code-copy"
              onClick={handleDockerCopy}
              aria-label="Copy Docker Compose code snippet"
            >
              <span aria-live="polite">{dockerCopied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
          <pre className="knotserver__code-body">
            <code>{dockerComposeSnippet}</code>
          </pre>
        </div>

        <div className="knotserver__cta">
          <a
            href="https://github.com/raultov/knot-server"
            target="_blank"
            rel="noopener noreferrer"
            className="knotserver__btn"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12 24 5.37 18.63 0 12 0z"/>
            </svg>
            View on GitHub
          </a>
          <a
            href="https://github.com/raultov/knot-server#readme"
            target="_blank"
            rel="noopener noreferrer"
            className="knotserver__btn-secondary"
          >
            Read the docs →
          </a>
        </div>
      </div>
    </section>
  )
}

export default KnotServer
