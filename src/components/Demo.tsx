import '../styles/Demo.css'

const demos = [
  {
    src: 'https://raw.githubusercontent.com/raultov/knot/master/demo-cli.gif',
    alt: 'Knot CLI demo showing instant reverse dependency lookup',
    label: 'CLI — Instant reverse dependency lookup',
  },
  {
    src: 'https://raw.githubusercontent.com/raultov/knot/master/demo-mcp.gif',
    alt: 'Knot MCP demo showing JSON-RPC protocol for AI agents',
    label: 'MCP — JSON-RPC protocol for AI agents',
  },
]

function Demo() {
  return (
    <section id="demo" className="demo">
      <div className="container">
        <h2 className="section-title">See it in action</h2>
        <p className="section-subtitle">
          Two modes, same power. CLI for your terminal, MCP for your AI agent.
        </p>

        <div className="demo__grid">
          {demos.map((d) => (
            <div key={d.label} className="demo__item">
              <div className="demo__frame">
                <div className="demo__frame-bar">
                  <span /><span /><span />
                </div>
                <img
                  src={d.src}
                  alt={d.alt}
                  className="demo__gif"
                  loading="lazy"
                />
              </div>
              <p className="demo__label">{d.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Demo
