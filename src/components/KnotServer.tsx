import { useState } from 'react'
import { useMouseTrack } from '@/hooks/useMouseTrack'
import GitHubIcon from '@/components/GitHubIcon'
import '@/styles/KnotServer.css'

const serverFeatures = [
  {
    title: 'REST API',
    description:
      'Register repos, trigger indexing, and query search/callers/explore endpoints via a clean JSON REST API. Interactive Swagger UI at /docs and OpenAPI spec for codegen.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
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
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21.5 2.5 2.5 21.5" />
        <path d="M21.5 2.5a10 10 0 0 1-8.84 13.45L2.5 21.5" />
        <path d="M8.34 15.66a4 4 0 0 0 5.66-5.66" />
      </svg>
    ),
  },
  {
    title: 'Background Scheduler',
    description:
      'Automatic stale lock cleanup and periodic re-indexing. Tunable via POLL_INTERVAL_SECS, MAX_INDEX_AGE_SECS, and STALE_LOCK_TIMEOUT_SECS in docker-compose.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
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
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="1" y="6" width="6" height="12" rx="1" />
        <rect x="9" y="3" width="6" height="18" rx="1" />
        <rect x="17" y="6" width="6" height="12" rx="1" />
        <path d="M7 10h2M15 10h2M7 14h2M15 14h2" />
      </svg>
    ),
  },
  {
    title: 'Container-Native & K8s Ready',
    description:
      'Official raultov/knot-server image on Docker Hub. Tune CPU and memory via environment variables to match any pod resource limit — from a lightweight 2-core sidecar to a full-cluster deployment.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
        <path d="M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12" />
        <path d="M7 3.5L12 6l5-2.5M4 11l8 5M4 13l8 5M20 11l-8 5M20 13l-8 5" />
      </svg>
    ),
  },
  {
    title: 'Interactive Graph Viewer',
    description:
      'Explore your indexed codebase visually at /graph. Filter by entity kind, toggle relationship types, focus at any depth, color-coded by language and kind.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="5" cy="6" r="2" />
        <circle cx="19" cy="6" r="2" />
        <circle cx="12" cy="18" r="2" />
        <circle cx="6" cy="14" r="1.5" />
        <circle cx="18" cy="14" r="1.5" />
        <path d="M7 6h10M6.5 7.5 11 16.5M17.5 7.5 13 16.5M7 13.5l4 3M17 13.5l-4 3" />
      </svg>
    ),
  },
  {
    title: 'Agent Skills & /index',
    description:
      '9 per-topic skills auto-install for Claude Desktop, Cursor, OpenCode and Copilot. The /index slash command registers and indexes the current repo end-to-end from your editor.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <rect x="9" y="9" width="6" height="6" />
        <path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2" />
      </svg>
    ),
  },
  {
    title: 'Local & Remote Repos',
    description:
      'Index Git URLs or local working trees. Idempotent re-registration via POST /api/repos. Build outputs (target/, node_modules/, .gradle/, dist/) auto-excluded.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
        <path d="M3 13h7l2-2h9" />
      </svg>
    ),
  },
  {
    title: 'Metrics & Distributed Tracing',
    description:
      'Prometheus /metrics endpoint exposes HTTP, indexing pipeline, queue, and process metrics — Grafana-ready. Opt-in OpenTelemetry tracing exports spans via OTLP gRPC with W3C traceparent propagation.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 3v16a2 2 0 0 0 2 2h16" />
        <path d="m7 15 3.5-5 3 3.5L18 7" />
        <path d="M18 7h3v3" />
      </svg>
    ),
  },
] as const

type ServerFeature = (typeof serverFeatures)[number]

function ServerFeatureCard({ title, description, icon }: ServerFeature) {
  const cardRef = useMouseTrack<HTMLDivElement>()
  return (
    <div ref={cardRef} className="knotserver__card reveal">
      <div className="knotserver__icon">{icon}</div>
      <h3 className="knotserver__card-title">{title}</h3>
      <p className="knotserver__card-desc">{description}</p>
    </div>
  )
}

function KnotServer() {
  const [copied, setCopied] = useState(false)

  const dockerRunCmd = `docker run --network host \\
  -e KNOT_SERVER_RAYON_THREADS=2 \\
  -e KNOT_SERVER_BATCH_SIZE=16 \\
  -e KNOT_SERVER_INGEST_CONCURRENCY=1 \\
  raultov/knot-server \\
  --neo4j-password knot_secret_password \\
  --workspace-dir /path/to/your/repos`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(dockerRunCmd)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section id="server" className="knotserver">
      <div className="container">
        <div className="knotserver__header">
          <span className="knotserver__badge">Enterprise</span>
          <h2 className="section-title">
            Scale out with <span className="knotserver__highlight">Knot Server</span>
          </h2>
          <p className="section-subtitle">
            A distributed REST API and background task scheduler for managing and indexing Git
            repositories across a cluster. Turns Knot from a single-machine CLI tool into a highly
            available enterprise service.
          </p>
        </div>

        <div className="knotserver__grid">
          {serverFeatures.map((f) => (
            <ServerFeatureCard key={f.title} {...f} />
          ))}
        </div>

        <div className="knotserver__code">
          <p className="knotserver__code-intro">
            Container-native and Kubernetes-ready. Tune CPU and memory consumption with environment
            variables to fit any resource budget — this example targets <strong>2 cores</strong> and{' '}
            <strong>~1 GB RAM</strong>:
          </p>
          <div className="knotserver__code-header">
            <span className="knotserver__code-dots">
              <span />
              <span />
              <span />
            </span>
            <span className="knotserver__code-label">docker run</span>
            <button
              className="knotserver__code-copy"
              onClick={handleCopy}
              aria-label="Copy docker run command"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <pre className="knotserver__code-body">
            <code>{dockerRunCmd}</code>
          </pre>
          <div className="knotserver__code-legend">
            <div className="knotserver__code-legend-item">
              <span className="knotserver__code-legend-var">RAYON_THREADS</span>
              <span>Parallel indexing threads (maps to CPU cores)</span>
            </div>
            <div className="knotserver__code-legend-item">
              <span className="knotserver__code-legend-var">BATCH_SIZE</span>
              <span>Files per embedding batch (controls memory peak)</span>
            </div>
            <div className="knotserver__code-legend-item">
              <span className="knotserver__code-legend-var">INGEST_CONCURRENCY</span>
              <span>Simultaneous repo indexing jobs</span>
            </div>
          </div>
        </div>

        <div className="knotserver__visual">
          <p className="knotserver__visual-intro">Visual exploration &amp; REST playground</p>
          <div className="knotserver__visual-grid">
            <figure className="knotserver__visual-card">
              <picture>
                <source
                  type="image/webp"
                  srcSet="/screenshot-graph-mobile.webp 720w, /screenshot-graph.webp 1200w"
                  sizes="(max-width: 768px) 90vw, 50vw"
                />
                <img
                  src="/screenshot-graph.webp"
                  alt="Knot Server graph viewer at localhost:3000/graph showing entity nodes and relationship edges"
                  className="knotserver__visual-img"
                  width="1200"
                  height="750"
                  loading="lazy"
                  decoding="async"
                />
              </picture>
              <figcaption className="knotserver__visual-caption">
                <span className="knotserver__visual-label">Interactive Graph</span>
                <span className="knotserver__visual-url">localhost:3000/graph</span>
              </figcaption>
            </figure>
            <figure className="knotserver__visual-card">
              <picture>
                <source
                  type="image/webp"
                  srcSet="/screenshot-swagger-mobile.webp 720w, /screenshot-swagger.webp 1200w"
                  sizes="(max-width: 768px) 90vw, 50vw"
                />
                <img
                  src="/screenshot-swagger.webp"
                  alt="Knot Server Swagger UI at localhost:3000/docs showing REST endpoints for search, callers and explore"
                  className="knotserver__visual-img"
                  width="1200"
                  height="750"
                  loading="lazy"
                  decoding="async"
                />
              </picture>
              <figcaption className="knotserver__visual-caption">
                <span className="knotserver__visual-label">Swagger UI / OpenAPI</span>
                <span className="knotserver__visual-url">localhost:3000/docs</span>
              </figcaption>
            </figure>
          </div>
        </div>

        <div className="knotserver__cta">
          <a
            href="https://github.com/raultov/knot-server"
            target="_blank"
            rel="noopener noreferrer"
            className="knotserver__btn"
          >
            <GitHubIcon />
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
