import { useSyncExternalStore } from 'react'
import { isWebMcpAvailable } from '@/webmcp/useWebMcp'
import { knotTools } from '@/webmcp/registry'
import { invocationLog } from '@/webmcp/invocationLog'
import '@/styles/AgentTools.css'

/**
 * The Agent Tools page.
 *
 * Always visible: the list of Web-MCP tools this site exposes (name,
 * description, schema) — informative for a human reader and on-brand.
 *
 * Conditional: the live invocation log. Shown when the Web-MCP API is
 * available in this browser, or forced with ?agent-debug in the URL.
 *
 * Note: registration itself happens in App (all pages); this page is the
 * observability surface.
 */
function AgentTools() {
  const available = isWebMcpAvailable()
  const invocations = useSyncExternalStore(
    invocationLog.subscribe,
    invocationLog.getSnapshot,
    invocationLog.getSnapshot,
  )
  const showLog = available || new URLSearchParams(window.location.search).has('agent-debug')

  return (
    <section id="agent-tools" className="agent-tools page" aria-labelledby="agent-tools-title">
      <div className="container">
        <h2 className="section-title" id="agent-tools-title">
          Agent Tools
        </h2>
        <p className="section-subtitle">
          This site exposes its data as Web-MCP tools. An agent that opens it in a supporting
          browser can ask for capabilities, releases, or the exact install command — instead of
          scraping the DOM.
        </p>

        <p className="agent-tools__api" role="status">
          <span
            className={`agent-tools__api-dot ${available ? 'agent-tools__api-dot--on' : ''}`}
            aria-hidden="true"
          />
          {available
            ? 'Web-MCP API active in this browser'
            : 'Web-MCP not supported here — the tools are listed for reference'}
        </p>

        <ul className="agent-tools__list">
          {knotTools.map((tool) => (
            <li key={tool.name} className="agent-tools__tool reveal">
              <div className="agent-tools__tool-head">
                <code className="agent-tools__tool-name">{tool.name}</code>
                {tool.annotations?.readOnlyHint === true && (
                  <span className="agent-tools__badge agent-tools__badge--ro">read-only</span>
                )}
                {tool.annotations?.readOnlyHint === false && (
                  <span className="agent-tools__badge agent-tools__badge--ui">side effect</span>
                )}
                {tool.annotations?.readOnlyHint === undefined &&
                  !tool.annotations?.destructiveHint && (
                    <span className="agent-tools__badge agent-tools__badge--muted">
                      readOnlyHint unset
                    </span>
                  )}
              </div>
              <p className="agent-tools__tool-desc">{tool.description}</p>
              <details className="agent-tools__schema">
                <summary>input schema</summary>
                <pre>{JSON.stringify(tool.inputSchema, null, 2)}</pre>
              </details>
            </li>
          ))}
        </ul>

        {showLog && (
          <div className="agent-tools__log" aria-live="polite">
            <h3 className="agent-tools__log-title">Live invocations</h3>
            {invocations.length === 0 ? (
              <p className="agent-tools__log-empty">
                No invocations yet. Ask an agent to use one of the tools above.
              </p>
            ) : (
              <ol className="agent-tools__log-list">
                {invocations.map((e) => (
                  <li key={e.id} className="agent-tools__log-entry">
                    <div className="agent-tools__log-head">
                      <code className="agent-tools__log-tool">{e.tool}</code>
                      <span
                        className={`agent-tools__log-ok ${e.ok ? '' : 'agent-tools__log-ok--err'}`}
                      >
                        {e.ok ? 'ok' : 'error'}
                      </span>
                      <span className="agent-tools__log-ms">{e.ms} ms</span>
                      <time className="agent-tools__log-time">
                        {new Date(e.ts).toLocaleTimeString()}
                      </time>
                    </div>
                    <pre className="agent-tools__log-args">
                      {JSON.stringify(e.args, null, 2)}
                    </pre>
                    <pre className="agent-tools__log-result">{e.result}</pre>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

export default AgentTools
