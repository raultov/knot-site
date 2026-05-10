import { useState } from 'react'
import '../styles/Header.css'

function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="header">
      <div className="container header__inner">
        <a href="#" className="header__logo">
          <svg className="header__logo-icon" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2"/>
            <path d="M10 16 C10 11 14 8 16 8 C18 8 22 11 22 16 C22 21 18 24 16 24 C14 24 10 21 10 16Z" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M12 16 C12 13 14 11 16 11 C18 11 20 13 20 16 C20 19 18 21 16 21 C14 21 12 19 12 16Z" stroke="currentColor" strokeWidth="1.2"/>
            <circle cx="16" cy="16" r="2" fill="currentColor"/>
          </svg>
          <span>Knot</span>
        </a>

        <button
          className={`header__toggle ${menuOpen ? 'header__toggle--open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={`header__nav ${menuOpen ? 'header__nav--open' : ''}`}>
          <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
          <a href="#demo" onClick={() => setMenuOpen(false)}>Demo</a>
          <a href="#server" onClick={() => setMenuOpen(false)}>Server</a>
          <a href="#install" onClick={() => setMenuOpen(false)}>Install</a>
          <a
            href="https://github.com/raultov/knot"
            target="_blank"
            rel="noopener noreferrer"
            className="header__github"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12 24 5.37 18.63 0 12 0z"/>
            </svg>
            GitHub
          </a>
        </nav>
      </div>
    </header>
  )
}

export default Header
