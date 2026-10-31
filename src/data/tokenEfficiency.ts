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
    knotTokens: 771,
    readTokens: 12262,
    reduction: 93.7,
  },
  {
    repo: 'spring-ai',
    language: 'Java',
    task: 'callers',
    question: 'Who uses ToolCallingManager?',
    knotTokens: 3352,
    readTokens: 43707,
    reduction: 92.3,
  },
  {
    repo: 'spring-ai',
    language: 'Java',
    task: 'explore',
    question: 'Structure of DefaultChatClient.java',
    knotTokens: 4033,
    readTokens: 9675,
    reduction: 58.3,
  },
  {
    repo: 'puppeteer',
    language: 'TypeScript',
    task: 'discovery',
    question: 'How is a CDP session created?',
    knotTokens: 335,
    readTokens: 4706,
    reduction: 92.9,
  },
  {
    repo: 'puppeteer',
    language: 'TypeScript',
    task: 'callers',
    question: 'Who calls createCDPSession?',
    knotTokens: 690,
    readTokens: 42857,
    reduction: 98.4,
  },
  {
    repo: 'puppeteer',
    language: 'TypeScript',
    task: 'explore',
    question: 'Structure of the Page API',
    knotTokens: 5865,
    readTokens: 27522,
    reduction: 78.7,
  },
  {
    repo: 'knot',
    language: 'Rust',
    task: 'discovery',
    question: 'How are call intents resolved?',
    knotTokens: 766,
    readTokens: 37110,
    reduction: 97.9,
  },
  {
    repo: 'knot',
    language: 'Rust',
    task: 'callers',
    question: 'Who calls format_references_result?',
    knotTokens: 330,
    readTokens: 18830,
    reduction: 98.2,
  },
  {
    repo: 'knot',
    language: 'Rust',
    task: 'explore',
    question: 'Structure of the graph query module',
    knotTokens: 12231,
    readTokens: 28281,
    reduction: 56.8,
  },
]

export const tokenEfficiencyTotal: TokenEfficiencyTotal = {
  tasks: 9,
  knotTokens: 28373,
  readTokens: 224950,
  reduction: 87.4,
  factor: '7.9×',
  saved: 196577,
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
  'knot cost scales with the number of results, not with repository size. Callers answers list the references made from production code and count those made from test code (+N in tests). Listing them too (include_tests) brings the total saving to 80.4%: ToolCallingManager has 394 references, 320 of them in tests.',
  'The explore rows for large files are the least favourable, because signatures plus docstrings are a large fraction of a well-documented file.',
] as const

/** Repositories the benchmark ran on, as indexed. */
export const tokenEfficiencyCorpus = [
  { repo: 'spring-ai', files: 2490, entities: 27740 },
  { repo: 'puppeteer', files: 1286, entities: 11733 },
  { repo: 'knot', files: 390, entities: 8166 },
] as const

export const tokenEfficiencyMethodologyUrl =
  'https://github.com/raultov/knot/blob/master/README.md#-token-efficiency--measured-not-claimed'
