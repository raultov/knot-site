import { useState } from 'react'
import GitHubIcon from '@/components/GitHubIcon'
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
          <picture>
            <source
              type="image/webp"
              srcSet="/logo-dark-560.webp 560w, /logo-dark-720.webp 720w"
              sizes="(max-width: 768px) 280px, 360px"
            />
            <img
              src="/logo-dark.png"
              alt="Knot — Codebase Indexer for AI Agents"
              className="hero__brand-img"
              width="720"
              height="800"
              fetchPriority="high"
              decoding="async"
            />
          </picture>
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
            <GitHubIcon />
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
