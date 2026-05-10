import { useState } from 'react'
import '../styles/KnotServer.css'

interface Feature {
  icon: string
  title: string
  description: string
}

const features: Feature[] = [
  {
    icon: '📦',
    title: 'REST API',
    description:
      'Register repos, trigger indexing, and query search/callers/explore endpoints via a clean JSON REST API.',
  },
  {
    icon: '🔄',
    title: 'Git Webhooks',
    description:
      'GitHub, GitLab, and Bitbucket webhooks with HMAC-SHA256 signature validation trigger instant incremental re-indexing on every push.',
  },
  {
    icon: '⚙️',
    title: 'Background Scheduler',
    description:
      'Automatic stale lock cleanup and periodic re-indexing of repositories that haven\'t been synced recently.',
  },
  {
    icon: '☸️',
    title: 'Cluster & HA',
    description:
      'Horizontal scale-out with file-based distributed locking. Deploy multiple instances sharing an NFS/EFS workspace or a Kubernetes RWX PVC.',
  },
]

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

function KnotServer() {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(codeSnippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
          {features.map((f) => (
            <div key={f.title} className="knotserver__card">
              <div className="knotserver__icon">{f.icon}</div>
              <h3 className="knotserver__card-title">{f.title}</h3>
              <p className="knotserver__card-desc">{f.description}</p>
            </div>
          ))}
        </div>

        <div className="knotserver__code">
          <div className="knotserver__code-header">
            <div className="knotserver__code-dots">
              <span /><span /><span />
            </div>
            <span className="knotserver__code-label">REST API workflow</span>
            <button className="knotserver__code-copy" onClick={handleCopy}>
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <pre className="knotserver__code-body">
            <code>{codeSnippet}</code>
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
