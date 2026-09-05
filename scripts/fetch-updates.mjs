#!/usr/bin/env node
/**
 * Fetch the latest CHANGELOG entries from raultov/knot and raultov/knot-server
 * and write a curated JSON feed consumed by src/components/Updates.tsx.
 *
 * - Fetches CHANGELOG.md (raw) and the GitHub Releases API (for dates when
 *   the CHANGELOG does not declare them, e.g. raultov/knot).
 * - Keeps the top N entries per repo (PER_REPO_LIMIT), sorts the merged list
 *   by date (descending), and writes src/data/updates.json.
 * - Never fails the build: if all fetches fail and a previous updates.json
 *   exists, it is left untouched. If no previous file exists, an empty feed
 *   is written so the React bundle can still compile.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUT_DIR = join(ROOT, 'src', 'data')
const OUT_FILE = join(OUT_DIR, 'updates.json')

const PER_REPO_LIMIT = 5

const SOURCES = [
  {
    repo: 'knot',
    changelogUrl: 'https://raw.githubusercontent.com/raultov/knot/master/CHANGELOG.md',
    releasesUrl: 'https://api.github.com/repos/raultov/knot/releases?per_page=30',
    changelogLink: 'https://github.com/raultov/knot/blob/master/CHANGELOG.md',
  },
  {
    repo: 'knot-server',
    changelogUrl: 'https://raw.githubusercontent.com/raultov/knot-server/master/CHANGELOG.md',
    releasesUrl: 'https://api.github.com/repos/raultov/knot-server/releases?per_page=30',
    changelogLink: 'https://github.com/raultov/knot-server/blob/master/CHANGELOG.md',
  },
]

const USER_AGENT = 'knot-site-changelog-fetcher (+https://github.com/raultov/knot-site)'

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.text()
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/vnd.github+json' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.json()
}

function parseKnotChangelog(md) {
  const sections = []
  const re = /^##\s+(v\d+\.\d+\.\d+)\s+[—–-]\s+(.+?)\s*$/gm
  let match
  while ((match = re.exec(md)) !== null) {
    const start = match.index + match[0].length
    const rest = md.slice(start)
    const next = rest.search(/^##\s+/m)
    const body = (next === -1 ? rest : rest.slice(0, next)).trim()
    sections.push({
      version: match[1].replace(/^v/, ''),
      title: match[2].trim(),
      body,
    })
  }
  return sections
}

function parseKnotServerChangelog(md) {
  const sections = []
  const re = /^##\s+\[(\d+\.\d+\.\d+)\]\s+-\s+(\d{4}-\d{2}-\d{2})/gm
  let match
  while ((match = re.exec(md)) !== null) {
    const start = match.index + match[0].length
    const rest = md.slice(start)
    const next = rest.search(/^##\s+/m)
    const body = (next === -1 ? rest : rest.slice(0, next)).trim()
    const headingMatch = body.match(/^###\s+(.+)$/m)
    const title = headingMatch ? stripMarkdown(headingMatch[1]) : ''
    sections.push({
      version: match[1],
      date: match[2],
      title,
      body,
    })
  }
  return sections
}

function stripMarkdown(s) {
  return s
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

function truncateWords(text, max) {
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  const safe = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut
  return safe.replace(/[\s,;:.-]+$/, '') + '…'
}

function stripLabel(line) {
  return line.replace(/^\*\*[^*]+\*\*:\s*/, '').trim()
}

function extractSummary(body) {
  const lines = body
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  for (const line of lines) {
    if (line.startsWith('#')) continue
    const cleaned = stripMarkdown(stripLabel(line.replace(/^[-*]\s+/, '')))
    if (cleaned.length < 30) continue
    const sentence = cleaned.split(/(?<=[.!?])\s+/)[0]
    if (sentence) return truncateWords(sentence, 200)
  }
  return truncateWords(stripMarkdown(lines[0] ?? ''), 200)
}

function extractHighlights(body, max = 4) {
  const out = []
  for (const raw of body.split('\n')) {
    const line = raw.trim()
    if (!/^[-*]\s+/.test(line)) continue
    const cleaned = stripMarkdown(stripLabel(line.replace(/^[-*]\s+/, '')))
    if (cleaned) out.push(cleaned)
    if (out.length >= max) break
  }
  return out
}

async function loadExisting() {
  if (!existsSync(OUT_FILE)) return null
  try {
    return JSON.parse(await readFile(OUT_FILE, 'utf-8'))
  } catch {
    return null
  }
}

async function buildEntries() {
  const entries = []
  const errors = []

  for (const src of SOURCES) {
    try {
      const [changelog, releases] = await Promise.all([
        fetchText(src.changelogUrl),
        fetchJson(src.releasesUrl),
      ])

      const dateByVersion = new Map()
      for (const r of releases) {
        if (!r.tag_name || !r.published_at) continue
        dateByVersion.set(r.tag_name.replace(/^v/, ''), r.published_at.slice(0, 10))
      }

      const sections =
        src.repo === 'knot'
          ? parseKnotChangelog(changelog)
          : parseKnotServerChangelog(changelog)

      // The upstream CHANGELOG can repeat a section (e.g. a cherry-picked fix
      // documented twice); keep the first occurrence per repo+version+title
      // BEFORE applying the per-repo limit so duplicates do not steal slots.
      const seen = new Set()
      let repoCount = 0
      for (const section of sections) {
        const key = `${src.repo}|${section.version}|${section.title ?? ''}`
        if (seen.has(key)) continue
        seen.add(key)
        entries.push({
          repo: src.repo,
          version: section.version,
          title: section.title ?? '',
          date: section.date ?? dateByVersion.get(section.version) ?? null,
          summary: extractSummary(section.body),
          highlights: extractHighlights(section.body),
          changelogUrl: src.changelogLink,
        })
        repoCount += 1
        if (repoCount >= PER_REPO_LIMIT) break
      }
    } catch (err) {
      errors.push(`${src.repo}: ${err.message}`)
    }
  }

  return { entries, errors }
}

/**
 * Semver comparison, newest first. Versions here always match \d+.\d+.\d+
 * because that is what both CHANGELOG parsers accept.
 */
function compareVersionsDesc(a, b) {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < 3; i += 1) {
    const diff = (pb[i] ?? 0) - (pa[i] ?? 0)
    if (diff !== 0) return diff
  }
  return 0
}

/**
 * Not every CHANGELOG entry has a published GitHub release to take a date from
 * (knot 1.7.0 and 1.7.1 never got one). Sorting those last would bury them
 * behind genuinely older releases, so each dateless entry borrows the date of
 * its nearest neighbour in the same repo — newer first, older as a fallback —
 * and keeps its semver position from there. `sortDate` never reaches the feed.
 */
function assignSortDates(entries) {
  const byRepo = new Map()
  for (const entry of entries) {
    if (!byRepo.has(entry.repo)) byRepo.set(entry.repo, [])
    byRepo.get(entry.repo).push(entry)
  }

  for (const group of byRepo.values()) {
    group.sort((a, b) => compareVersionsDesc(a.version, b.version))

    let newer = null
    for (const entry of group) {
      if (entry.date) newer = entry.date
      entry.sortDate = entry.date ?? newer
    }
    // Entries above the newest dated release have nothing newer to inherit.
    let older = null
    for (let i = group.length - 1; i >= 0; i -= 1) {
      if (group[i].sortDate) older = group[i].sortDate
      else group[i].sortDate = older
    }
  }
}

async function writeFeed(entries) {
  await mkdir(OUT_DIR, { recursive: true })
  const out = {
    generatedAt: new Date().toISOString(),
    source: 'https://github.com/raultov/knot + https://github.com/raultov/knot-server',
    entries,
  }
  await writeFile(OUT_FILE, JSON.stringify(out, null, 2) + '\n', 'utf-8')
}

async function main() {
  const { entries, errors } = await buildEntries()

  if (entries.length === 0) {
    const existing = await loadExisting()
    if (existing?.entries?.length) {
      console.warn('[fetch-updates] Fetch failed; keeping existing updates.json')
      for (const e of errors) console.warn(`[fetch-updates]   - ${e}`)
      return
    }
    console.warn('[fetch-updates] Fetch failed and no existing data; writing empty feed')
    for (const e of errors) console.warn(`[fetch-updates]   - ${e}`)
  } else {
    assignSortDates(entries)
    entries.sort((a, b) => {
      if (a.sortDate && b.sortDate && a.sortDate !== b.sortDate) {
        return b.sortDate.localeCompare(a.sortDate)
      }
      if (a.sortDate && !b.sortDate) return -1
      if (!a.sortDate && b.sortDate) return 1
      if (a.repo !== b.repo) return a.repo.localeCompare(b.repo)
      return compareVersionsDesc(a.version, b.version)
    })
    for (const entry of entries) delete entry.sortDate
  }

  await writeFeed(entries)
  console.log(`[fetch-updates] Wrote ${entries.length} entries to ${OUT_FILE}`)
  for (const e of errors) console.warn(`[fetch-updates] ${e}`)
}

main().catch(async (err) => {
  console.error('[fetch-updates] Fatal:', err.message ?? err)
  const existing = await loadExisting()
  if (existing?.entries?.length) {
    console.warn('[fetch-updates] Keeping existing updates.json')
    return
  }
  await writeFeed([])
  console.warn('[fetch-updates] Wrote empty feed as fallback')
})
