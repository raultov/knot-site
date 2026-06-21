import { useMouseTrack } from '@/hooks/useMouseTrack'
import '@/styles/Features.css'

const features = [
  {
    title: 'Semantic + Structural Search',
    description:
      'Find code by meaning, class names, docstrings, or architectural patterns. Powered by Qdrant vector embeddings and Neo4j graph traversal.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
        <path d="M7 11h8M11 7v8" />
      </svg>
    ),
  },
  {
    title: 'Multi-Language Support',
    description:
      'Java, Kotlin, TypeScript, JavaScript, Python, Rust, Groovy, C/C++, HTML, CSS, SCSS, Markdown, and build system files. Full cross-language linking plus hierarchical full-body search across Markdown documentation.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M2 12h20M12 2a14.8 14.8 0 0 1 3 10 14.8 14.8 0 0 1-3 10M12 2a14.8 14.8 0 0 0-3 10 14.8 14.8 0 0 0 3 10" />
      </svg>
    ),
  },
  {
    title: 'Incremental Indexing',
    description:
      'SHA-256 file hashing skips unchanged files. Real-time watch mode re-indexes in seconds. Tune CPU and memory via environment variables to fit any machine.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m13 2 3 6h-8l3-6" />
        <path d="M6 12h12l-3 6H9l-3-6" />
        <path d="m9 18 3 4 3-4" />
      </svg>
    ),
  },
  {
    title: 'MCP + CLI',
    description:
      'Model Context Protocol server for AI agents (Claude, Gemini, ChatGPT, Cursor). Standalone CLI for scripts and CI/CD pipelines.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    ),
  },
  {
    title: 'Dual-Database Architecture',
    description:
      'Vector search (Qdrant) for semantic understanding, graph database (Neo4j) for architectural relationships and call chains.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 7v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7" />
        <ellipse cx="12" cy="12" rx="9" ry="3" />
        <path d="M3 7a9 3 0 0 0 18 0" />
      </svg>
    ),
  },
  {
    title: 'Cross-Repo Dependency Resolution',
    description:
      'Auto-discovers dependencies between indexed repositories. Transitive call chain resolution across project boundaries.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 22s-8-4.5-8-11.8V5l8-3 8 3v5.2c0 7.3-8 11.8-8 11.8" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
] as const

type Feature = (typeof features)[number]

function FeatureCard({ title, description, icon }: Feature) {
  const cardRef = useMouseTrack<HTMLDivElement>()
  return (
    <div ref={cardRef} className="features__card reveal">
      <div className="features__icon">{icon}</div>
      <h3 className="features__card-title">{title}</h3>
      <p className="features__card-desc">{description}</p>
    </div>
  )
}

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
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default Features
