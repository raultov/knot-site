import type { CSSProperties } from 'react'
import {
  tokenEfficiencyCorpus,
  tokenEfficiencyMethodology,
  tokenEfficiencyMethodologyUrl,
  tokenEfficiencyNotes,
  tokenEfficiencyRows,
  tokenEfficiencyTotal,
} from '@/data/tokenEfficiency'
import type { TokenEfficiencyRow } from '@/data/types'
import '@/styles/TokenEfficiency.css'

const TASK_LABELS: Record<TokenEfficiencyRow['task'], string> = {
  discovery: 'discovery',
  callers: 'callers',
  explore: 'explore',
}

const num = (value: number) => value.toLocaleString('en-US')

function Row({ row }: { row: TokenEfficiencyRow }) {
  return (
    <tr>
      <th scope="row" className="token__task">
        <span className="token__task-inner">
          <span className={`token__badge token__badge--${row.task}`}>{TASK_LABELS[row.task]}</span>
          <span className="token__repo">
            {row.repo} <span className="token__lang">· {row.language}</span>
          </span>
          <span className="token__question">{row.question}</span>
        </span>
      </th>
      <td className="token__num token__num--knot">{num(row.knotTokens)}</td>
      <td className="token__num token__num--read">{num(row.readTokens)}</td>
      <td className="token__saved">
        <span className="token__saved-value">{row.reduction.toFixed(1)}%</span>
        <span
          className="token__bar"
          aria-hidden="true"
          style={{ '--fill': `${row.reduction}%` } as CSSProperties}
        />
      </td>
    </tr>
  )
}

function TokenEfficiency() {
  const { tasks, knotTokens, readTokens, reduction, factor, saved } = tokenEfficiencyTotal

  return (
    <section id="token-efficiency" className="token" aria-labelledby="token-title">
      <div className="container">
        <p className="token__eyebrow">Measured, not claimed</p>
        <h2 className="section-title" id="token-title">
          Token Efficiency
        </h2>
        <p className="section-subtitle">
          An agent exploring an unfamiliar codebase pays for every byte it reads. Without an index it
          greps and then reads whole files; with Knot it gets a targeted answer. Measured on three
          real indexed repositories across {tasks} realistic exploration tasks.
        </p>

        <div className="token__stats">
          <div className="token__stat token__stat--hero reveal">
            <span className="token__stat-value">{reduction}%</span>
            <span className="token__stat-label">fewer tokens overall</span>
          </div>
          <div className="token__stat reveal">
            <span className="token__stat-value">{factor}</span>
            <span className="token__stat-label">cheaper for the same {tasks} questions</span>
          </div>
          <div className="token__stat reveal">
            <span className="token__stat-value">{num(saved)}</span>
            <span className="token__stat-label">tokens saved — a whole context window</span>
          </div>
        </div>

        <div
          className="token__viewport"
          role="region"
          aria-label="Token efficiency benchmark results"
          tabIndex={0}
        >
          <table className="token__table">
            <caption>
              Tokens spent answering each question through Knot versus grepping and reading the
              source, counted with OpenAI&apos;s cl100k_base tokenizer.
            </caption>
            <thead>
              <tr>
                <th scope="col">Task</th>
                <th scope="col" className="token__col-num">
                  Knot
                </th>
                <th scope="col" className="token__col-num">
                  Read the code
                </th>
                <th scope="col" className="token__col-num">
                  Saved
                </th>
              </tr>
            </thead>
            <tbody>
              {tokenEfficiencyRows.map((row) => (
                <Row key={`${row.repo}-${row.task}`} row={row} />
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row" className="token__task">
                  <span className="token__task-inner">
                    <span className="token__repo">Total — {tasks} tasks</span>
                  </span>
                </th>
                <td className="token__num token__num--knot">{num(knotTokens)}</td>
                <td className="token__num token__num--read">{num(readTokens)}</td>
                <td className="token__saved">
                  <span className="token__saved-value">{reduction}%</span>
                  <span
                    className="token__bar"
                    aria-hidden="true"
                    style={{ '--fill': `${reduction}%` } as CSSProperties}
                  />
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <details className="token__method">
          <summary>How it is measured — and why the saving is a lower bound</summary>
          <div className="token__method-body">
            <p>
              Both sides count the exact bytes an LLM would receive as tool output. The
              read-the-code baseline is deliberately generous, so the published saving is a floor,
              not a best case.
            </p>
            <ul className="token__method-list">
              {tokenEfficiencyMethodology.map((m) => (
                <li key={m.task}>
                  <code>{m.task}</code>
                  <span className="token__method-cmd">{m.knotSide}</span>
                  <span className="token__method-cmd token__method-cmd--server">{m.serverSide}</span>
                  <span className="token__method-baseline">vs. {m.baseline}</span>
                </li>
              ))}
            </ul>
            <ul className="token__notes">
              {tokenEfficiencyNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
            <p className="token__corpus">
              Repositories measured, as indexed:{' '}
              {tokenEfficiencyCorpus.map((c, i) => (
                <span key={c.repo}>
                  {i > 0 ? ', ' : ''}
                  <strong>{c.repo}</strong> {num(c.files)} files / {num(c.entities)} entities
                </span>
              ))}
              .
            </p>
            <a
              href={tokenEfficiencyMethodologyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="token__method-link"
            >
              Full methodology and reproduction steps →
            </a>
          </div>
        </details>
      </div>
    </section>
  )
}

export default TokenEfficiency
