import '@/styles/Footer.css'

const languages = [
  'Java',
  'Kotlin',
  'TypeScript',
  'JavaScript',
  'Rust',
  'Python',
  'Groovy',
  'C',
  'C++',
  'HTML',
  'CSS',
  'SCSS',
]

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__top">
          <div className="footer__brand">
            <div className="footer__logo">
              <img src="/favicon.png" alt="Knot" width="24" height="24" />
              <span>Knot</span>
            </div>
            <p className="footer__tagline">
              Codebase indexer for the AI era. Vector + Graph, CLI + MCP.
            </p>
          </div>

          <div className="footer__links">
            <div className="footer__col">
              <h4>Resources</h4>
              <a href="https://github.com/raultov/knot" target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
              <a
                href="https://github.com/raultov/knot/blob/master/README.md"
                target="_blank"
                rel="noopener noreferrer"
              >
                Documentation
              </a>
              <a
                href="https://github.com/raultov/knot/releases"
                target="_blank"
                rel="noopener noreferrer"
              >
                Releases
              </a>
              <a
                href="https://github.com/raultov/knot/blob/master/CONTRIBUTING.md"
                target="_blank"
                rel="noopener noreferrer"
              >
                Contributing
              </a>
            </div>
            <div className="footer__col">
              <h4>Ecosystem</h4>
              <a
                href="https://github.com/raultov/knot-server"
                target="_blank"
                rel="noopener noreferrer"
              >
                Knot Server
              </a>
              <a
                href="https://glama.ai/mcp/servers/raultov/knot"
                target="_blank"
                rel="noopener noreferrer"
              >
                Glama MCP Server
              </a>
              <a href="https://modelcontextprotocol.io" target="_blank" rel="noopener noreferrer">
                MCP Protocol
              </a>
              <a href="https://qdrant.tech" target="_blank" rel="noopener noreferrer">
                Qdrant
              </a>
              <a href="https://neo4j.com" target="_blank" rel="noopener noreferrer">
                Neo4j
              </a>
            </div>
          </div>
        </div>

        <div className="footer__langs">
          <span className="footer__langs-label">Supported languages:</span>
          <div className="footer__langs-list">
            {languages.map((l) => (
              <span key={l} className="footer__lang-tag">
                {l}
              </span>
            ))}
          </div>
        </div>

        <div className="footer__bottom">
          <p>MIT License · Built with Rust</p>
          <p>© {new Date().getFullYear()} Knot contributors</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
