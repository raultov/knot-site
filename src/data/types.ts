/**
 * Shared data-layer types. Everything in src/data/ must stay plain,
 * serializable data — no React, no JSX — so the build-time generators
 * (llms.txt, JSON-LD) and the Web-MCP tools can consume the exact same
 * structures that feed the UI.
 */

export interface Feature {
  id: string
  title: string
  description: string
}

export interface Snippet {
  lang: string
  label: string
  code: string
}

export interface InstallOption {
  title: string
  subtitle: string
  snippets: Snippet[]
}

export interface InstallSection {
  step: string
  heading: string
  description: string
  snippets?: Snippet[]
  options?: InstallOption[]
}

export type Product = 'knot' | 'server'
