import { lazy, Suspense, useEffect, useSyncExternalStore } from 'react'
import Header from '@/components/Header'
import Hero from '@/components/Hero'
import Footer from '@/components/Footer'
import ConsentModal from '@/components/ConsentModal'
import Contact from '@/components/Contact'
import { router } from '@/state/router'
import { useWebMcp } from '@/webmcp/useWebMcp'
import { knotTools } from '@/webmcp/registry'
import '@/styles/App.css'

const Updates = lazy(() => import('@/components/Updates'))
const TokenEfficiency = lazy(() => import('@/components/TokenEfficiency'))
const Features = lazy(() => import('@/components/Features'))
const Demo = lazy(() => import('@/components/Demo'))
const KnotServer = lazy(() => import('@/components/KnotServer'))
const Installation = lazy(() => import('@/components/Installation'))

// Contact is NOT lazy: it is the first content of its sub-page, and a
// Suspense fallback swap at the top of the page caused a massive CLS (0.82).

const sectionFallback = (
  <section className="app__fallback">
    <div className="container">
      <p className="app__fallback-text">Loading…</p>
    </div>
  </section>
)

function App() {
  // Register the Web-MCP tools on every page of the site: an agent that opens
  // the landing page gets the tools without having to visit a dedicated page.
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
      {page === 'contact' ? (
        <main>
          <Contact />
        </main>
      ) : (
        <main>
          <Hero />
          <Suspense fallback={sectionFallback}>
            <TokenEfficiency />
          </Suspense>
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
