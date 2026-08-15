import { useState, useSyncExternalStore } from 'react'
import GitHubIcon from '@/components/GitHubIcon'
import { router } from '@/state/router'
import '@/styles/Header.css'

function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { page } = useSyncExternalStore(router.subscribe, router.getSnapshot, router.getSnapshot)

  return (
    <header className="header">
      <div className="container header__inner">
        <a href="#/" className="header__logo">
          <img
            src="/favicon-32.webp"
            alt=""
            className="header__logo-icon"
            width="28"
            height="28"
            decoding="async"
            aria-hidden="true"
          />
          <span>Knot</span>
        </a>

        <button
          className={`header__toggle ${menuOpen ? 'header__toggle--open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
          aria-controls="site-nav"
        >
          <span />
          <span />
          <span />
        </button>

        <nav id="site-nav" className={`header__nav ${menuOpen ? 'header__nav--open' : ''}`}>
          <a href="#updates" onClick={() => setMenuOpen(false)}>
            What's New
          </a>
          <a href="#features" onClick={() => setMenuOpen(false)}>
            Features
          </a>
          <a href="#demo" onClick={() => setMenuOpen(false)}>
            Demo
          </a>
          <a href="#server" onClick={() => setMenuOpen(false)}>
            Server
          </a>
          <a href="#install" onClick={() => setMenuOpen(false)}>
            Install
          </a>
          <a
            href="#/agent-tools"
            onClick={() => setMenuOpen(false)}
            aria-current={page === 'agent-tools' ? 'page' : undefined}
          >
            Agent Tools
          </a>
          <a
            href="#/contact"
            onClick={() => setMenuOpen(false)}
            aria-current={page === 'contact' ? 'page' : undefined}
          >
            Contact
          </a>
          <a
            href="https://github.com/raultov/knot"
            target="_blank"
            rel="noopener noreferrer"
            className="header__github"
          >
            <GitHubIcon size={20} />
            GitHub
          </a>
        </nav>
      </div>
    </header>
  )
}

export default Header
