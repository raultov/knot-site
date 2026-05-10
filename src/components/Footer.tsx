import '../styles/Footer.css'

const languages = [
  'Java', 'Kotlin', 'TypeScript', 'JavaScript', 'Rust',
  'Python', 'Groovy', 'C', 'C++', 'HTML', 'CSS', 'SCSS',
]

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__top">
          <div className="footer__brand">
            <div className="footer__logo">
              <svg viewBox="0 0 32 32" fill="none" width="24" height="24">
                <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2"/>
                <path d="M10 16 C10 11 14 8 16 8 C18 8 22 11 22 16 C22 21 18 24 16 24 C14 24 10 21 10 16Z" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M12 16 C12 13 14 11 16 11 C18 11 20 13 20 16 C20 19 18 21 16 21 C14 21 12 19 12 16Z" stroke="currentColor" strokeWidth="1.2"/>
                <circle cx="16" cy="16" r="2" fill="currentColor"/>
              </svg>
              <span>Knot</span>
            </div>
            <p className="footer__tagline">
              Codebase indexer for the AI era. Vector + Graph, CLI + MCP.
            </p>
          </div>

          <div className="footer__links">
            <div className="footer__col">
              <h4>Resources</h4>
              <a href="https://github.com/raultov/knot" target="_blank" rel="noopener noreferrer">GitHub</a>
              <a href="https://github.com/raultov/knot/blob/master/README.md" target="_blank" rel="noopener noreferrer">Documentation</a>
              <a href="https://github.com/raultov/knot/releases" target="_blank" rel="noopener noreferrer">Releases</a>
              <a href="https://github.com/raultov/knot/blob/master/CONTRIBUTING.md" target="_blank" rel="noopener noreferrer">Contributing</a>
            </div>
            <div className="footer__col">
              <h4>Ecosystem</h4>
              <a href="https://github.com/raultov/knot-server" target="_blank" rel="noopener noreferrer">Knot Server</a>
              <a href="https://glama.ai/mcp/servers/raultov/knot" target="_blank" rel="noopener noreferrer">Glama MCP Server</a>
              <a href="https://modelcontextprotocol.io" target="_blank" rel="noopener noreferrer">MCP Protocol</a>
              <a href="https://qdrant.tech" target="_blank" rel="noopener noreferrer">Qdrant</a>
              <a href="https://neo4j.com" target="_blank" rel="noopener noreferrer">Neo4j</a>
            </div>
          </div>
        </div>

        <div className="footer__langs">
          <span className="footer__langs-label">Supported languages:</span>
          <div className="footer__langs-list">
            {languages.map((l) => (
              <span key={l} className="footer__lang-tag">{l}</span>
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
