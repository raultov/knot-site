import { useSyncExternalStore, useTransition } from 'react'
import type { KeyboardEvent } from 'react'
import CopyButton from '@/components/CopyButton'
import { installationStore } from '@/state/installationStore'
import { knotSections, knotServerSections } from '@/data/install'
import type { InstallSection, Product, Snippet } from '@/data/types'
import '@/styles/Installation.css'

const PRODUCTS: Product[] = ['knot', 'server']

function CodeSnippet({ label, code }: Snippet) {
  return (
    <div className="install__card">
      <div className="install__card-header">
        <span className="install__card-label">{label}</span>
        <CopyButton text={code} label={`Copy ${label} snippet`} className="install__card-copy">
          Copy
        </CopyButton>
      </div>
      <pre className="install__card-code">
        <code>{code}</code>
      </pre>
    </div>
  )
}

interface InstallPanelProps {
  product: Product
  active: boolean
  sections: readonly InstallSection[]
}

function InstallPanel({ product, active, sections }: InstallPanelProps) {
  const tabId = `install-tab-${product}`

  return (
    <div
      id={`install-panel-${product}`}
      role="tabpanel"
      aria-labelledby={tabId}
      tabIndex={0}
      hidden={!active}
      className="install__sections"
    >
      {sections.map((section) => (
        <div key={section.step} className="install__section">
          <div className="install__section-header">
            <span className="install__step">{section.step}</span>
            <div>
              <h3 className="install__section-title">{section.heading}</h3>
              <p className="install__section-desc">{section.description}</p>
            </div>
          </div>

          {'snippets' in section && section.snippets && (
            <div className="install__section-snippets">
              {section.snippets.map((s, i) => (
                <CodeSnippet key={i} {...s} />
              ))}
            </div>
          )}

          {'options' in section && section.options && (
            <div
              className={`install__options ${section.options.length === 4 ? 'install__options--quad' : section.options.length === 3 ? 'install__options--triple' : ''}`}
            >
              {section.options.map((opt) => (
                <div key={opt.title} className="install__option">
                  <div className="install__option-header">
                    <h4 className="install__option-title">{opt.title}</h4>
                    <p className="install__option-subtitle">{opt.subtitle}</p>
                  </div>
                  <div className="install__section-snippets">
                    {opt.snippets.map((s, i) => (
                      <CodeSnippet key={i} {...s} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function Installation() {
  const { activeTab } = useSyncExternalStore(
    installationStore.subscribe,
    installationStore.getSnapshot,
  )
  const [, startTransition] = useTransition()

  const handleTab = (tab: Product) => {
    startTransition(() => installationStore.setActiveTab(tab))
  }

  const handleTabKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    event.preventDefault()
    const current = PRODUCTS.indexOf(activeTab)
    const next = PRODUCTS[(current + 1) % PRODUCTS.length]
    handleTab(next)
    document.getElementById(`install-tab-${next}`)?.focus()
  }

  return (
    <section id="install" className="install" aria-labelledby="install-title">
      <div className="container">
        <h2 className="section-title" id="install-title">
          Get started in seconds
        </h2>
        <p className="section-subtitle">
          One command to install, one to index, one to search. Knot is designed to get out of your
          way.
        </p>

        <div
          className="install__tabs"
          role="tablist"
          aria-label="Choose product"
          onKeyDown={handleTabKeyDown}
        >
          <button
            role="tab"
            id="install-tab-knot"
            aria-selected={activeTab === 'knot'}
            aria-controls="install-panel-knot"
            tabIndex={activeTab === 'knot' ? 0 : -1}
            className={`install__tab ${activeTab === 'knot' ? 'active' : ''}`}
            onClick={() => handleTab('knot')}
          >
            Knot
          </button>
          <button
            role="tab"
            id="install-tab-server"
            aria-selected={activeTab === 'server'}
            aria-controls="install-panel-server"
            tabIndex={activeTab === 'server' ? 0 : -1}
            className={`install__tab ${activeTab === 'server' ? 'active' : ''}`}
            onClick={() => handleTab('server')}
          >
            Knot Server
          </button>
        </div>

        <InstallPanel product="knot" active={activeTab === 'knot'} sections={knotSections} />
        <InstallPanel
          product="server"
          active={activeTab === 'server'}
          sections={knotServerSections}
        />

        <div className="install__footer">
          <a
            href={
              activeTab === 'knot'
                ? 'https://github.com/raultov/knot#readme'
                : 'https://github.com/raultov/knot-server#readme'
            }
            target="_blank"
            rel="noopener noreferrer"
          >
            Read the full documentation →
          </a>
        </div>
      </div>
    </section>
  )
}

export default Installation
