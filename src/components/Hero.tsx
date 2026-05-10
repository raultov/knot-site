import { useState } from 'react'
import '@/styles/Hero.css'

function Hero() {
  const [copied, setCopied] = useState(false)

  const installCmd = 'curl --proto "=https" --tlsv1.2 -LsSf https://github.com/raultov/knot/releases/latest/download/knot-installer.sh | sh'

  const handleCopy = async () => {
    await navigator.clipboard.writeText(installCmd)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section className="hero">
      <div className="container">
        <div className="hero__brand">
          <img
            src="/logo-dark.png"
            alt="Knot — Codebase Indexer for AI Agents"
            className="hero__brand-img"
            width="836"
            height="884"
          />
        </div>

        <div className="hero__badge">
          <span className="hero__badge-dot" />
          Open Source · MIT License
        </div>

        <h1 className="hero__title">
          High-performance codebase indexer{' '}
          <span className="hero__highlight">for AI agents</span>
        </h1>

        <p className="hero__subtitle">
          Knot extracts structural and semantic information from source code,
          enabling AI agents to understand, analyze, and navigate large code
          repositories with vector search and graph databases.
        </p>

        <div className="hero__actions">
          <a
            href="https://github.com/raultov/knot"
            target="_blank"
            rel="noopener noreferrer"
            className="hero__btn hero__btn--primary"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12 24 5.37 18.63 0 12 0z"/>
            </svg>
            View on GitHub
          </a>
          <a href="#install" className="hero__btn hero__btn--secondary">
            Get Started
          </a>
        </div>

        <div className="hero__install">
          <div className="hero__install-header">
            <span className="hero__install-dots">
              <span /><span /><span />
            </span>
            <span className="hero__install-label">Quick Install</span>
          </div>
          <pre className="hero__install-code">
            <code>{installCmd}</code>
          </pre>
          <button
            className="hero__install-copy"
            onClick={handleCopy}
            aria-label="Copy install command to clipboard"
          >
            {copied ? (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
                <span aria-live="polite">Copied!</span>
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <rect x="9" y="9" width="13" height="13" rx="2"/>
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                </svg>
                Copy
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  )
}

export default Hero
