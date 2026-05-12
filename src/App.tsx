import { lazy, Suspense } from 'react'
import Header from '@/components/Header'
import Hero from '@/components/Hero'
import Footer from '@/components/Footer'
import '@/styles/App.css'

const Features = lazy(() => import('@/components/Features'))
const Demo = lazy(() => import('@/components/Demo'))
const KnotServer = lazy(() => import('@/components/KnotServer'))
const Installation = lazy(() => import('@/components/Installation'))

const sectionFallback = (
  <section className="app__fallback">
    <div className="container">
      <p className="app__fallback-text">Loading…</p>
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
