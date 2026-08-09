import '@/styles/Updates.css'

type UpdateItem = {
  date: string
  tag: 'New'
  title: string
  description: string
  repo: 'knot' | 'knot-server' | 'both'
  highlights: string[]
}

const updates: UpdateItem[] = [
  {
    date: '2026-08-09',
    tag: 'New',
    title: 'Varnish Cache (VCL) support',
    description:
      'Knot can now index Varnish Cache configuration files (VCL). Both the CLI indexer and the MCP/REST server expose native support, enabling semantic and structural search across your CDN edge configuration.',
    repo: 'both',
    highlights: [
      'VCL files are parsed and indexed alongside other supported languages.',
      'Backends, ACLs, sub-routines, and probe definitions are recognized as first-class entities.',
      'Available immediately in the latest releases of raultov/knot and raultov/knot-server.',
    ],
  },
]

function UpdateCard({ date, tag, title, description, repo, highlights }: UpdateItem) {
  return (
    <article className="updates__card reveal">
      <header className="updates__card-head">
        <span className="updates__tag">{tag}</span>
        <time className="updates__date" dateTime={date}>
          {date}
        </time>
      </header>

      <h3 className="updates__card-title">{title}</h3>
      <p className="updates__card-desc">{description}</p>

      <ul className="updates__highlights">
        {highlights.map((h) => (
          <li key={h}>{h}</li>
        ))}
      </ul>

      <div className="updates__links">
        {repo === 'knot' || repo === 'both' ? (
          <a
            href="https://github.com/raultov/knot"
            target="_blank"
            rel="noopener noreferrer"
            className="updates__link"
          >
            raultov/knot →
          </a>
        ) : null}
        {repo === 'knot-server' || repo === 'both' ? (
          <a
            href="https://github.com/raultov/knot-server"
            target="_blank"
            rel="noopener noreferrer"
            className="updates__link"
          >
            raultov/knot-server →
          </a>
        ) : null}
      </div>
    </article>
  )
}

function Updates() {
  return (
    <section id="updates" className="updates">
      <div className="container">
        <h2 className="section-title">What's New</h2>
        <p className="section-subtitle">
          Recent changes shipped across the Knot ecosystem — the CLI indexer and the MCP/REST
          server.
        </p>

        <div className="updates__list">
          {updates.map((u) => (
            <UpdateCard key={u.title} {...u} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default Updates
