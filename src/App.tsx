import Header from './components/Header'
import Hero from './components/Hero'
import Features from './components/Features'
import Demo from './components/Demo'
import KnotServer from './components/KnotServer'
import Installation from './components/Installation'
import Footer from './components/Footer'

function App() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Features />
        <Demo />
        <KnotServer />
        <Installation />
      </main>
      <Footer />
    </>
  )
}

export default App
