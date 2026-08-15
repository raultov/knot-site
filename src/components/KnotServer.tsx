import { useMouseTrack } from '@/hooks/useMouseTrack'
import GitHubIcon from '@/components/GitHubIcon'
import CopyButton from '@/components/CopyButton'
import { serverFeatures } from '@/data/serverFeatures'
import { serverIcons } from '@/icons/serverIcons'
import { dockerRunCommand } from '@/data/site'
import type { Feature } from '@/data/types'
import '@/styles/KnotServer.css'

function ServerFeatureCard({ id, title, description }: Feature) {
  const cardRef = useMouseTrack<HTMLDivElement>()
  return (
    <div ref={cardRef} className="knotserver__card reveal">
      <div className="knotserver__icon">{serverIcons[id]}</div>
      <h3 className="knotserver__card-title">{title}</h3>
      <p className="knotserver__card-desc">{description}</p>
    </div>
  )
}

function KnotServer() {
  return (
    <section id="server" className="knotserver" aria-labelledby="server-title">
      <div className="container">
        <div className="knotserver__header">
          <span className="knotserver__badge">Enterprise</span>
          <h2 className="section-title" id="server-title">
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
            <ServerFeatureCard key={f.id} {...f} />
          ))}
        </div>

        <div className="knotserver__code">
          <p className="knotserver__code-intro">
            Container-native and Kubernetes-ready. Tune CPU and memory consumption with environment
            variables to fit any resource budget — this example targets <strong>2 cores</strong> and{' '}
            <strong>~1 GB RAM</strong>:
          </p>
          <div className="knotserver__code-header">
            <span className="knotserver__code-dots" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <span className="knotserver__code-label">docker run</span>
            <CopyButton
              text={dockerRunCommand}
              label="Copy docker run command"
              className="knotserver__code-copy"
            >
              Copy
            </CopyButton>
          </div>
          <pre className="knotserver__code-body">
            <code>{dockerRunCommand}</code>
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
