import { lazy, Suspense, useEffect, useSyncExternalStore } from 'react'
import Header from '@/components/Header'
import Hero from '@/components/Hero'
import Footer from '@/components/Footer'
import ConsentModal from '@/components/ConsentModal'
import AgentTools from '@/components/AgentTools'
import Contact from '@/components/Contact'
import { router } from '@/state/router'
import { useWebMcp } from '@/webmcp/useWebMcp'
import { knotTools } from '@/webmcp/registry'
import '@/styles/App.css'

const Updates = lazy(() => import('@/components/Updates'))
const Features = lazy(() => import('@/components/Features'))
const Demo = lazy(() => import('@/components/Demo'))
const KnotServer = lazy(() => import('@/components/KnotServer'))
const Installation = lazy(() => import('@/components/Installation'))

// AgentTools and Contact are NOT lazy: they are the first content of their
// sub-pages, and a Suspense fallback swap at the top of the page caused a
// massive CLS (0.82). Their data (registry + tools) is already in the main
// bundle because App registers it via useWebMcp, so the cost is negligible.

const sectionFallback = (
  <section className="app__fallback">
    <div className="container">
      <p className="app__fallback-text">Loading…</p>
    </div>
  </section>
)

function App() {
  // Register the Web-MCP tools on every page of the site: an agent that opens
  // the landing page gets the tools without having to visit /#/agent-tools.
  useWebMcp(knotTools)

  const { page, section } = useSyncExternalStore(
    router.subscribe,
    router.getSnapshot,
    router.getSnapshot,
  )

  useEffect(() => {
    if (page === 'home' && section) {
      document.getElementById(section)?.scrollIntoView({ block: 'start' })
    } else {
      window.scrollTo(0, 0)
    }
  }, [page, section])

  return (
    <>
      <Header />
      {page === 'agent-tools' ? (
        <main>
          <AgentTools />
        </main>
      ) : page === 'contact' ? (
        <main>
          <Contact />
        </main>
      ) : (
        <main>
          <Hero />
          <Suspense fallback={sectionFallback}>
            <Updates />
          </Suspense>
          <Suspense fallback={sectionFallback}>
            <Features />
          </Suspense>
          <Suspense fallback={sectionFallback}>
            <Demo />
          </Suspense>
          <Suspense fallback={sectionFallback}>
            <KnotServer />
          </Suspense>
          <Suspense fallback={sectionFallback}>
            <Installation />
          </Suspense>
        </main>
      )}
      <Footer />
      <ConsentModal />
    </>
  )
}

export default App
