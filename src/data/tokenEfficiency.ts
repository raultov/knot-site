/**
 * Token efficiency benchmark — measured, not claimed.
 *
 * Source of truth: the "Token Efficiency" table published in the knot and
 * knot-server READMEs, produced by scripts/token_savings_benchmark.py and
 * stored in .perf_metrics/token_savings.json of the knot repository.
 *
 * Both sides count the exact bytes an LLM would receive as tool output, with
 * OpenAI's cl100k_base tokenizer (tiktoken).
 */
import type { TokenEfficiencyRow, TokenEfficiencyTotal } from './types'

export const tokenEfficiencyRows: readonly TokenEfficiencyRow[] = [
  {
    repo: 'spring-ai',
    language: 'Java',
    task: 'discovery',
    question: 'How does the chat client run the advisor chain?',
    knotTokens: 1092,
    readTokens: 10168,
    reduction: 89.3,
  },
  {
    repo: 'spring-ai',
    language: 'Java',
    task: 'callers',
    question: 'Who uses ToolCallingManager?',
    knotTokens: 8808,
    readTokens: 15554,
    reduction: 43.4,
  },
  {
    repo: 'spring-ai',
    language: 'Java',
    task: 'explore',
    question: 'Structure of DefaultChatClient.java',
    knotTokens: 4865,
    readTokens: 7838,
    reduction: 37.9,
  },
  {
    repo: 'puppeteer',
    language: 'TypeScript',
    task: 'discovery',
    question: 'How is a CDP session created?',
    knotTokens: 609,
    readTokens: 4149,
    reduction: 85.3,
  },
  {
    repo: 'puppeteer',
    language: 'TypeScript',
    task: 'callers',
    question: 'Who calls createCDPSession?',
    knotTokens: 1004,
    readTokens: 39878,
    reduction: 97.5,
  },
  {
    repo: 'puppeteer',
    language: 'TypeScript',
    task: 'explore',
    question: 'Structure of the Page API',
    knotTokens: 7287,
    readTokens: 25300,
    reduction: 71.2,
  },
  {
    repo: 'knot',
    language: 'Rust',
    task: 'discovery',
    question: 'How are call intents resolved?',
    knotTokens: 594,
    readTokens: 14824,
    reduction: 96.0,
  },
  {
    repo: 'knot',
    language: 'Rust',
    task: 'callers',
    question: 'Who calls format_references_result?',
    knotTokens: 461,
    readTokens: 10949,
    reduction: 95.8,
  },
  {
    repo: 'knot',
    language: 'Rust',
    task: 'explore',
    question: 'Structure of the graph query module',
    knotTokens: 978,
    readTokens: 12103,
    reduction: 91.9,
  },
]

export const tokenEfficiencyTotal: TokenEfficiencyTotal = {
  tasks: 9,
  knotTokens: 25698,
  readTokens: 140763,
  reduction: 81.7,
  factor: '5.5×',
  saved: 115065,
}

/** How each side of the benchmark is produced, per task type. */
export const tokenEfficiencyMethodology = [
  {
    task: 'discovery',
    knotSide: 'knot search "<question>" --repo <r>',
    serverSide: 'GET /api/repos/{id}/search?q=<question>',
    baseline: 'rg -l <keyword> plus a full read of the files that answer the question',
  },
  {
    task: 'callers',
    knotSide: 'knot callers "<symbol>" --repo <r>',
    serverSide: 'GET /api/repos/{id}/callers?entity=<symbol>',
    baseline: 'rg -n "\\b<symbol>\\b" plus a full read of the first 5 distinct files with hits',
  },
  {
    task: 'explore',
    knotSide: 'knot explore "<file>" --repo <r>',
    serverSide: 'GET /api/repos/{id}/explore?path=<file>',
    baseline: 'full read of the file',
  },
] as const

/**
 * Why the published numbers are a lower bound, and where knot is weakest.
 * Mirrors the caveats section of the README — publishing the weak spots is
 * part of the point of a measured benchmark.
 */
export const tokenEfficiencyNotes = [
  'The baseline is deliberately generous: greps are restricted to the source files of the language, so no changelogs, generated docs or node_modules inflate it.',
  'For discovery the baseline gets oracle file selection — it reads only the files that actually answer the question, with zero wasted reads.',
  'For callers the baseline stops at 5 files, while a rigorous impact analysis would need every file with a textual hit.',
  'knot cost scales with the number of results, not with repository size. The weakest row (ToolCallingManager, 43%) is a symbol with 156 references: knot enumerates all of them with exact call sites, while the capped baseline reads 5 files and still cannot tell a call from a comment.',
] as const

/** Repositories the benchmark ran on, as indexed. */
export const tokenEfficiencyCorpus = [
  { repo: 'spring-ai', files: 2406, entities: 25733 },
  { repo: 'puppeteer', files: 1832, entities: 19310 },
  { repo: 'knot', files: 222, entities: 4000 },
] as const

export const tokenEfficiencyMethodologyUrl =
  'https://github.com/raultov/knot/blob/master/README.md#-token-efficiency--measured-not-claimed'
