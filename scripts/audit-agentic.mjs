#!/usr/bin/env node
/**
 * Lighthouse wrapper for the "Agentic Browsing" work streams.
 *
 * Critical requirement: run in a CLEAN Chrome profile, because the original
 * "Accessibility tree is not well-formed" failure was traced to an element
 * injected by a browser extension (GUID tag names, tabindex="1"), not to any
 * code shipped by knot-site. Extensions operate outside the page CSP, so a
 * normal developer profile can poison the audit.
 *
 * Modes:
 *   node scripts/audit-agentic.mjs [url] [phase]
 *   - no url: boots `vite preview` (port 4173) and audits http://localhost:4173
 *   - url: audits the given URL (e.g. https://www.knot.kz) directly
 *   - phase: label for the report directory (default: manual)
 *
 * Output: .lighthouse/<phase>/ with .report.json and .report.html so every
 * phase of the plan keeps a before/after artifact for the talk.
 */
import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const TARGET = process.argv[2] ?? 'http://localhost:4173'
const PHASE = process.argv[3] ?? 'manual'
const OUT_DIR = join(ROOT, '.lighthouse', PHASE)

const CHROME_FLAGS = [
  '--headless=new',
  '--disable-extensions',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-features=ExtensionsToolbarMenu,ExtensionManifestV2Disabled',
  '--disable-background-networking',
  '--disable-component-extensions-with-background-pages',
  '--disable-sync',
]

const CATEGORIES = [
  'agentic-browsing',
  'performance',
  'accessibility',
  'best-practices',
  'seo',
]

let preview = null

function startPreview() {
  if (TARGET.startsWith('http://localhost:4173')) {
    preview = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], {
      cwd: ROOT,
      stdio: 'ignore',
    })
  }
}

async function waitForServer(url) {
  const deadline = Date.now() + 30_000
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {
      // server not up yet
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error(`Server did not come up at ${url} within 30s`)
}

async function runLighthouse() {
  await mkdir(OUT_DIR, { recursive: true })
  const lh = join(ROOT, 'node_modules', '.bin', 'lighthouse')
  const args = [
    TARGET,
    '--chrome-flags=' + CHROME_FLAGS.join(' '),
    '--only-categories=' + CATEGORIES.join(','),
    '--output=json,html',
    `--output-path=${join(OUT_DIR, 'report')}`,
    '--quiet',
  ]
  const exitCode = await new Promise((resolve) => {
    const child = spawn(lh, args, { cwd: ROOT, stdio: 'inherit' })
    child.on('close', resolve)
  })
  if (exitCode !== 0) {
    throw new Error(`lighthouse exited with code ${exitCode}`)
  }
}

async function main() {
  try {
    startPreview()
    await waitForServer(TARGET)
    await runLighthouse()
    console.log(`[audit-agentic] Reports written to ${OUT_DIR}`)
  } finally {
    preview?.kill()
  }
}

main().catch((err) => {
  console.error('[audit-agentic] Fatal:', err.message ?? err)
  if (preview) preview.kill()
  process.exitCode = 1
})
