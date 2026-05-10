import { lazy, Suspense } from 'react'
import Header from '@/components/Header'
import Hero from '@/components/Hero'
import Footer from '@/components/Footer'

const Features = lazy(() => import('@/components/Features'))
const Demo = lazy(() => import('@/components/Demo'))
const KnotServer = lazy(() => import('@/components/KnotServer'))
const Installation = lazy(() => import('@/components/Installation'))

const sectionFallback = (
  <section style={{ padding: 'clamp(60px, 8vw, 100px) 0', textAlign: 'center' }}>
    <div className="container">
      <p style={{ color: 'var(--text-muted)' }}>Loading…</p>
    </div>
  </section>
)

function App() {
  return (
    <>
      <Header />
      <main>
        <Hero />
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
      <Footer />
    </>
  )
}

export default App
