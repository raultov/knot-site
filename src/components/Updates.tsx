import feed from '@/data/updates.json'
import '@/styles/Updates.css'

type Repo = 'knot' | 'knot-server'

type UpdateEntry = {
  repo: Repo
  version: string
  title: string
  date: string | null
  summary: string
  highlights: string[]
  changelogUrl: string
}

const REPO_LABELS: Record<Repo, string> = {
  knot: 'raultov/knot',
  'knot-server': 'raultov/knot-server',
}

function isUpdateEntry(value: unknown): value is UpdateEntry {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    (v.repo === 'knot' || v.repo === 'knot-server') &&
    typeof v.version === 'string' &&
    typeof v.title === 'string' &&
    (v.date === null || typeof v.date === 'string') &&
    typeof v.summary === 'string' &&
    Array.isArray(v.highlights) &&
    typeof v.changelogUrl === 'string'
  )
}

const entries: UpdateEntry[] = Array.isArray(feed.entries)
  ? (feed.entries.filter(isUpdateEntry) as UpdateEntry[])
  : []

function UpdateCard({ entry }: { entry: UpdateEntry }) {
  return (
    <article className={`updates__card updates__card--${entry.repo}`}>
      <header className="updates__card-head">
        <span className={`updates__repo updates__repo--${entry.repo}`}>
          {REPO_LABELS[entry.repo]}
        </span>
        <span className="updates__version">v{entry.version}</span>
        {entry.date ? (
          <time className="updates__date" dateTime={entry.date}>
            {entry.date}
          </time>
        ) : null}
      </header>

      {entry.title ? <h3 className="updates__card-title">{entry.title}</h3> : null}
      {entry.summary ? <p className="updates__card-desc">{entry.summary}</p> : null}

      {entry.highlights.length > 0 ? (
        <ul className="updates__highlights">
          {entry.highlights.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      ) : null}

      <a
        href={entry.changelogUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="updates__link"
      >
        View in CHANGELOG →
      </a>
    </article>
  )
}

function Updates() {
  return (
    <section id="updates" className="updates">
      <div className="container">
        <h2 className="section-title">What's New</h2>
        <p className="section-subtitle">
          Latest releases from the Knot ecosystem — the CLI indexer and the MCP/REST server.
          Sorted by date.
        </p>

        {entries.length > 0 ? (
          <div className="updates__viewport" role="region" aria-label="Recent releases" tabIndex={0}>
            <div className="updates__list">
              {entries.map((e) => (
                <UpdateCard key={`${e.repo}-${e.version}`} entry={e} />
              ))}
            </div>
          </div>
        ) : (
          <p className="updates__empty">No release notes available right now.</p>
        )}

        {feed.generatedAt ? (
          <p className="updates__meta">
            Last refreshed{' '}
            <time dateTime={feed.generatedAt}>
              {new Date(feed.generatedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </time>
          </p>
        ) : null}
      </div>
    </section>
  )
}

export default Updates
