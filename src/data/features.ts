import type { Feature } from './types'

export const features: readonly Feature[] = [
  {
    id: 'semantic-structural-search',
    title: 'Semantic + Structural Search',
    description:
      'Find code by meaning, class names, docstrings, or architectural patterns. Powered by Qdrant vector embeddings and Neo4j graph traversal.',
  },
  {
    id: 'multi-language-support',
    title: 'Multi-Language Support',
    description:
      'Java, Kotlin, C#, TypeScript, JavaScript, Python, Rust, Groovy, C/C++, HTML, CSS, SCSS, Markdown, Varnish Cache (VCL), plus build system files (Maven, Gradle, Jenkins, Cargo, MSBuild/NuGet). Full cross-language linking plus hierarchical full-body search across Markdown documentation.',
  },
  {
    id: 'incremental-indexing',
    title: 'Incremental Indexing',
    description:
      'SHA-256 file hashing skips unchanged files. Real-time watch mode re-indexes in seconds. Tune CPU and memory via environment variables to fit any machine.',
  },
  {
    id: 'mcp-cli',
    title: 'MCP + CLI',
    description:
      'Model Context Protocol server for AI agents (Claude, Gemini, ChatGPT, Cursor). Standalone CLI for scripts and CI/CD pipelines.',
  },
  {
    id: 'dual-database-architecture',
    title: 'Dual-Database Architecture',
    description:
      'Vector search (Qdrant) for semantic understanding, graph database (Neo4j) for architectural relationships and call chains.',
  },
  {
    id: 'cross-repo-dependency-resolution',
    title: 'Cross-Repo Dependency Resolution',
    description:
      'Auto-discovers dependencies between indexed repositories. Transitive call chain resolution across project boundaries.',
  },
  {
    id: 'measured-token-efficiency',
    title: 'Measured Token Efficiency',
    description:
      '81.7% fewer tokens than grepping and reading the code — 5.5× cheaper across nine real exploration tasks on three indexed repositories. Measured with tiktoken on the exact tool output an LLM receives, not claimed.',
  },
]
