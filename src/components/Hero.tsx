import GitHubIcon from '@/components/GitHubIcon'
import CopyButton from '@/components/CopyButton'
import { knotInstallCommand } from '@/data/site'
import { tokenEfficiencyTotal } from '@/data/tokenEfficiency'
import '@/styles/Hero.css'

function Hero() {
  const installCmd = knotInstallCommand

  return (
    <section className="hero" aria-labelledby="hero-title">
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

        <h1 className="hero__title" id="hero-title">
          High-performance codebase indexer <span className="hero__highlight">for AI agents</span>
        </h1>

        <p className="hero__subtitle">
          Knot extracts structural and semantic information from source code, enabling AI agents to
          understand, analyze, and navigate large code repositories with vector search and graph
          databases — answering each question with a targeted result instead of a wall of source
          files, which is what makes the difference in tokens spent per exploration.
        </p>

        <a className="hero__proof" href="#token-efficiency">
          <strong className="hero__proof-value">{tokenEfficiencyTotal.reduction}% fewer tokens</strong>
          <span className="hero__proof-text">
            than grep + reading the code, across {tokenEfficiencyTotal.tasks} real tasks — measured,
            not claimed
          </span>
          <span className="hero__proof-arrow" aria-hidden="true">
            →
          </span>
        </a>

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
            <span className="hero__install-dots" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <span className="hero__install-label">Quick Install</span>
          </div>
          <pre className="hero__install-code">
            <code>{installCmd}</code>
          </pre>
          <CopyButton
            text={installCmd}
            label="Copy install command to clipboard"
            className="hero__install-copy"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              width="16"
              height="16"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
            Copy
          </CopyButton>
        </div>
      </div>
    </section>
  )
}

export default Hero
