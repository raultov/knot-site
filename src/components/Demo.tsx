import GitHubIcon from '@/components/GitHubIcon'
import '@/styles/Demo.css'

const demos = [
  {
    src: 'https://raw.githubusercontent.com/raultov/knot/master/demo-cli.gif',
    alt: 'Knot CLI demo showing instant reverse dependency lookup',
    label: 'CLI — Instant reverse dependency lookup',
    width: 800,
    height: 500,
  },
  {
    src: 'https://raw.githubusercontent.com/raultov/knot/master/demo-mcp.gif',
    alt: 'Knot MCP demo showing JSON-RPC protocol for AI agents',
    label: 'MCP — JSON-RPC protocol for AI agents',
    width: 800,
    height: 500,
  },
  {
    src: '/demo-graph.gif',
    alt: 'Knot Server Graph Viewer demo showing interactive node focus and relationship toggles',
    label: 'Graph Viewer — Explore your codebase visually',
    width: 800,
    height: 310,
  },
]

function Demo() {
  return (
    <section id="demo" className="demo">
      <div className="container">
        <h2 className="section-title">See it in action</h2>
        <p className="section-subtitle">
          Three modes, same power. CLI for your terminal, MCP for your AI agent, and the Graph
          Viewer for visual exploration of your indexed codebase.
        </p>

        <div className="demo__grid">
          {demos.map((d) => (
            <div key={d.label} className="demo__item">
              <div className="demo__frame">
                <div className="demo__frame-bar">
                  <span />
                  <span />
                  <span />
                </div>
                <img
                  src={d.src}
                  alt={d.alt}
                  className="demo__gif"
                  loading="lazy"
                  width={d.width}
                  height={d.height}
                />
              </div>
              <p className="demo__label">{d.label}</p>
            </div>
          ))}
        </div>

        <div className="demo__cta">
          <a
            href="https://github.com/raultov/knot"
            target="_blank"
            rel="noopener noreferrer"
            className="demo__btn"
          >
            <GitHubIcon />
            View on GitHub
          </a>
          <a
            href="https://github.com/raultov/knot#readme"
            target="_blank"
            rel="noopener noreferrer"
            className="demo__btn-secondary"
          >
            Read the docs →
          </a>
        </div>
      </div>
    </section>
  )
}

export default Demo
