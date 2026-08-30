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

/** One measured exploration task of the token efficiency benchmark. */
export interface TokenEfficiencyRow {
  repo: string
  language: string
  task: 'discovery' | 'callers' | 'explore'
  question: string
  /** Tokens an agent spends answering it through knot / knot-server. */
  knotTokens: number
  /** Tokens an agent spends answering it with grep + reading source files. */
  readTokens: number
  /** Percentage of tokens saved, as published (one decimal). */
  reduction: number
}

export interface TokenEfficiencyTotal {
  tasks: number
  knotTokens: number
  readTokens: number
  reduction: number
  /** Human-readable ratio, e.g. `5.5×`. */
  factor: string
  saved: number
}
