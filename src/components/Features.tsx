import '../styles/Features.css'

interface Feature {
  icon: string
  title: string
  description: string
}

const features: Feature[] = [
  {
    icon: '🔍',
    title: 'Semantic + Structural Search',
    description:
      'Find code by meaning, class names, docstrings, or architectural patterns. Powered by Qdrant vector embeddings and Neo4j graph traversal.',
  },
  {
    icon: '🌐',
    title: 'Multi-Language Support',
    description:
      'Java, Kotlin, TypeScript, JavaScript, Rust, Python, Groovy, C/C++, HTML, CSS, SCSS, and build system files. Full cross-language linking.',
  },
  {
    icon: '⚡',
    title: 'Incremental Indexing',
    description:
      'SHA-256 file hashing skips unchanged files. Real-time watch mode re-indexes in seconds. Parallel streaming pipeline for maximum throughput.',
  },
  {
    icon: '🔗',
    title: 'MCP + CLI',
    description:
      'Model Context Protocol server for AI agents (Claude, Gemini, ChatGPT, Cursor). Standalone CLI for scripts and CI/CD pipelines.',
  },
  {
    icon: '📊',
    title: 'Dual-Database Architecture',
    description:
      'Vector search (Qdrant) for semantic understanding, graph database (Neo4j) for architectural relationships and call chains.',
  },
  {
    icon: '🛡️',
    title: 'Cross-Repo Dependency Resolution',
    description:
      'Auto-discovers dependencies between indexed repositories. Transitive call chain resolution across project boundaries.',
  },
]

function Features() {
  return (
    <section id="features" className="features">
      <div className="container">
        <h2 className="section-title">Why Knot?</h2>
        <p className="section-subtitle">
          Purpose-built for AI agents that need deep codebase understanding — not just text search.
        </p>

        <div className="features__grid">
          {features.map((f) => (
            <div key={f.title} className="features__card">
              <div className="features__icon">{f.icon}</div>
              <h3 className="features__card-title">{f.title}</h3>
              <p className="features__card-desc">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Features
