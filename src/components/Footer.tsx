import { languages } from '@/data/languages'
import { site } from '@/data/site'
import '@/styles/Footer.css'

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
            <p className="footer__tagline">{site.tagline}</p>
          </div>

          <div className="footer__links">
            <nav className="footer__col" aria-label="Resources">
              <h2>Resources</h2>
              <ul>
                <li>
                  <a
                    href="https://github.com/raultov/knot"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    GitHub
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/raultov/knot/blob/master/README.md"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Documentation
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/raultov/knot/releases"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Releases
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/raultov/knot/blob/master/CONTRIBUTING.md"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Contributing
                  </a>
                </li>
              </ul>
            </nav>
            <nav className="footer__col" aria-label="Ecosystem">
              <h2>Ecosystem</h2>
              <ul>
                <li>
                  <a
                    href="https://github.com/raultov/knot-server"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Knot Server
                  </a>
                </li>
                <li>
                  <a
                    href="https://glama.ai/mcp/servers/raultov/knot"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Glama MCP Server
                  </a>
                </li>
                <li>
                  <a href="https://modelcontextprotocol.io" target="_blank" rel="noopener noreferrer">
                    MCP Protocol
                  </a>
                </li>
                <li>
                  <a href="https://qdrant.tech" target="_blank" rel="noopener noreferrer">
                    Qdrant
                  </a>
                </li>
                <li>
                  <a href="https://neo4j.com" target="_blank" rel="noopener noreferrer">
                    Neo4j
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        <div className="footer__langs">
          <span className="footer__langs-label">Supported languages:</span>
          <ul className="footer__langs-list">
            {languages.map((l) => (
              <li key={l} className="footer__lang-tag">
                {l}
              </li>
            ))}
          </ul>
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
