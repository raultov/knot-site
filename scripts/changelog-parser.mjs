/**
 * Changelog parser utilities for knot and knot-server.
 *
 * Provides pure parsing helpers, title derivation, summary extraction,
 * top-level highlight collection, and title validation guards.
 */

export const CHANGE_TYPES = new Set([
  'added',
  'changed',
  'fixed',
  'removed',
  'deprecated',
  'security',
])

const LABEL_PREFIX_RE =
  /^(?:Fixed|Fix|Feat|Feature|Refactor|Test|Tests|Chore|Docs|Added|Changed|Deprecated|Removed|Security|Hardened)(?:\s*\([^)]*\))?$/i

/**
 * Strips inline Markdown formatting (links, bold, code backticks)
 * and normalizes whitespace.
 */
export function stripMarkdown(s) {
  if (!s) return ''
  return s
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Truncates text to max characters on a word boundary,
 * appending an ellipsis if truncated.
 */
export function truncateWords(text, max) {
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  const safe = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut
  return safe.replace(/[\s,;:.-]+$/, '') + '…'
}

/**
 * Specialized word-boundary truncation for titles (~80 chars),
 * avoiding trailing broken parentheses.
 */
export function truncateTitleWords(text, max = 80) {
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  let safe = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut
  const openParens = (safe.match(/\(/g) || []).length
  const closeParens = (safe.match(/\)/g) || []).length
  if (openParens > closeParens) {
    const lastOpen = safe.lastIndexOf('(')
    if (lastOpen > max * 0.5) {
      safe = safe.slice(0, lastOpen)
    }
  }
  return safe.replace(/[\s,;:.(/-]+$/, '') + '…'
}

/**
 * Strips category/conventional-commit labels like `**Fixed(resolve)**:` or `**Fixed**:`
 */
export function stripLabel(line) {
  return line.replace(/^\*\*[^*]+\*\*:\s*/, '').trim()
}

/**
 * Parses top-level bullets from a Markdown section body,
 * skipping nested sub-bullets (lines starting with whitespace followed by - or *).
 * Gathers multi-line continuation lines for each top-level bullet.
 */
export function parseTopLevelBullets(body) {
  if (!body) return []
  const lines = body.split(/\r?\n/)
  const bullets = []
  let current = null

  for (const raw of lines) {
    if (/^[-*][ \t]+/.test(raw)) {
      if (current) {
        bullets.push(finalizeBullet(current))
      }
      const text = raw.replace(/^[-*][ \t]+/, '').trim()
      current = {
        leadLine: text,
        lines: [text],
      }
    } else if (current) {
      if (/^[ \t]+[-*][ \t]+/.test(raw)) {
        continue
      }
      if (/^#{1,6}[ \t]+/.test(raw) || /^(?:---|\*\*\*|___)\s*$/.test(raw)) {
        bullets.push(finalizeBullet(current))
        current = null
        continue
      }
      if (raw.trim() === '') {
        continue
      }
      current.lines.push(raw.trim())
    }
  }
  if (current) {
    bullets.push(finalizeBullet(current))
  }
  return bullets
}

function finalizeBullet(b) {
  const fullText = b.lines.join(' ')
  return {
    leadLine: b.leadLine,
    fullText,
  }
}

function cleanTitle(s) {
  const stripped = stripMarkdown(s)
  const noPunct = stripped.replace(/[\s,;:.-]+$/, '')
  return truncateTitleWords(noPunct, 80)
}

function isValidTitle(t) {
  if (!t || t.length < 5) return false
  if (t.includes('**') || t.includes('`')) return false
  if (t.endsWith(':')) return false
  if (CHANGE_TYPES.has(t.trim().toLowerCase())) return false
  return true
}

/**
 * Validates a release title against quality invariants:
 * - not empty
 * - no raw markdown (** or backticks)
 * - never ends with a colon (:)
 * - never a bare change-type heading (Added, Changed, Fixed, etc.)
 */
export function validateTitle(title) {
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    throw new Error('Title is missing or empty')
  }
  if (title.includes('**')) {
    throw new Error(`Title contains raw bold Markdown (**): "${title}"`)
  }
  if (title.includes('`')) {
    throw new Error(`Title contains raw code Markdown (\`): "${title}"`)
  }
  if (title.endsWith(':')) {
    throw new Error(`Title ends with a colon (:): "${title}"`)
  }
  if (CHANGE_TYPES.has(title.trim().toLowerCase())) {
    throw new Error(`Title is a bare change-type word: "${title}"`)
  }
}

/**
 * Derives a release title from the first top-level bullet.
 * - Bold lead if present (e.g. `**Upgrade \`knot\` to 1.11.3.**`)
 * - Otherwise the first sentence without the `**Label**:` prefix
 * Truncates on word boundary (~80 chars, with …), strips trailing punctuation and markdown.
 */
export function deriveTitle(bullets) {
  for (let i = 0; i < bullets.length; i++) {
    const b = bullets[i]
    const boldMatch = b.leadLine.match(/^\*\*([^*]+)\*\*(.*)$/)
    if (boldMatch) {
      const boldContent = boldMatch[1].trim()
      const isLabel =
        LABEL_PREFIX_RE.test(boldContent) || CHANGE_TYPES.has(boldContent.toLowerCase())
      if (!isLabel) {
        const title = cleanTitle(boldContent)
        if (isValidTitle(title)) {
          return { title, bulletIndex: i, consumedKind: 'bold_lead', boldText: boldContent }
        }
      }
    }

    const withoutLabel = stripLabel(b.fullText)
    const sentences = withoutLabel.split(/(?<=[.!?])\s+/)
    for (const s of sentences) {
      if (s.trim().endsWith(':')) continue
      const title = cleanTitle(s)
      if (isValidTitle(title)) {
        return { title, bulletIndex: i, consumedKind: 'first_sentence', titleSentence: s }
      }
    }
  }
  return { title: '', bulletIndex: -1, consumedKind: 'none' }
}

function extractSentenceFromText(text, title) {
  const cleaned = stripMarkdown(text)
  if (!cleaned) return null
  const sentences = cleaned.split(/(?<=[.!?])\s+/)
  for (const s of sentences) {
    const trimmed = s.trim()
    if (trimmed.length < 30) continue
    if (trimmed.endsWith(':')) continue
    const noPunct = trimmed.replace(/[\s,;:.-]+$/, '')
    if (noPunct.toLowerCase() === title.toLowerCase()) continue
    return truncateWords(trimmed, 200)
  }
  return null
}

/**
 * Extracts a release summary from top-level bullets only.
 * If the first bullet gave the title, extracts from the rest of that bullet
 * or falls back to the next bullet. Never identical to the title.
 */
export function extractSummary(body, titleInfo) {
  const bullets = parseTopLevelBullets(body)
  if (bullets.length === 0) return ''

  const resolvedTitleInfo =
    typeof titleInfo === 'string'
      ? { title: titleInfo, bulletIndex: -1, consumedKind: 'none' }
      : (titleInfo ?? { title: '', bulletIndex: -1, consumedKind: 'none' })

  const title = resolvedTitleInfo.title ?? ''

  if (resolvedTitleInfo.bulletIndex === 0) {
    const b0 = bullets[0]
    let restText = ''
    if (resolvedTitleInfo.consumedKind === 'bold_lead') {
      restText = b0.fullText.replace(/^\*\*[^*]+\*\*(?:\.|:)?\s*/, '').trim()
    } else if (resolvedTitleInfo.consumedKind === 'first_sentence') {
      const withoutLabel = stripLabel(b0.fullText)
      const sentences = withoutLabel.split(/(?<=[.!?])\s+/)
      if (sentences.length > 1) {
        restText = sentences.slice(1).join(' ').trim()
      }
    }

    if (restText) {
      const candidate = extractSentenceFromText(restText, title)
      if (candidate) return candidate
    }

    for (let i = 1; i < bullets.length; i++) {
      const withoutLabel = stripLabel(bullets[i].fullText)
      const candidate = extractSentenceFromText(withoutLabel, title)
      if (candidate) return candidate
    }
  } else {
    for (let i = 0; i < bullets.length; i++) {
      if (i === resolvedTitleInfo.bulletIndex) continue
      const withoutLabel = stripLabel(bullets[i].fullText)
      const candidate = extractSentenceFromText(withoutLabel, title)
      if (candidate) return candidate
    }
  }

  for (const b of bullets) {
    const text = stripMarkdown(stripLabel(b.fullText))
    if (text && text !== title && !text.endsWith(':')) {
      return truncateWords(text, 200)
    }
  }
  return truncateWords(stripMarkdown(stripLabel(bullets[0]?.fullText ?? '')), 200)
}

/**
 * Extracts highlights from top-level bullets only (ignores nested sub-bullets).
 */
export function extractHighlights(body, max = 4) {
  const bullets = parseTopLevelBullets(body)
  const out = []
  for (const b of bullets) {
    const cleaned = stripMarkdown(stripLabel(b.fullText))
    const sanitized = cleaned
      .replace(/:\s*$/, '')
      .replace(/\s+(?:for|to|with|and|or)$/i, '')
      .trim()
    if (sanitized) {
      out.push(sanitized)
    }
    if (out.length >= max) break
  }
  return out
}

/**
 * Parses the raultov/knot CHANGELOG.md format.
 * Matches heading line on the same line only: ## v1.x.y [— title]
 * If no title is in the heading, derives title from the first top-level bullet.
 */
export function parseKnotChangelog(md) {
  const sections = []
  const re = /^##[ \t]+(v\d+\.\d+\.\d+)(?:[ \t]+[—–-][ \t]+([^\r\n]+?))?[ \t]*$/gm
  let match
  while ((match = re.exec(md)) !== null) {
    const start = match.index + match[0].length
    const rest = md.slice(start)
    const next = rest.search(/^##[ \t]+/m)
    const body = (next === -1 ? rest : rest.slice(0, next)).trim()
    const version = match[1].replace(/^v/, '')
    const bullets = parseTopLevelBullets(body)

    const hasHeadingTitle = Boolean(match[2] && match[2].trim())
    const titleInfo = hasHeadingTitle
      ? { title: stripMarkdown(match[2].trim()), bulletIndex: -1, consumedKind: 'heading' }
      : deriveTitle(bullets)
    const title = titleInfo.title

    validateTitle(title)

    sections.push({
      version,
      title,
      body,
      titleInfo,
    })
  }
  return sections
}

/**
 * Parses the raultov/knot-server CHANGELOG.md format (Keep a Changelog).
 * Derives title from the first top-level bullet (e.g. bold lead).
 */
export function parseKnotServerChangelog(md) {
  const sections = []
  const re = /^##[ \t]+\[(\d+\.\d+\.\d+)\](?:\s+-\s+(\d{4}-\d{2}-\d{2}))?[ \t]*$/gm
  let match
  while ((match = re.exec(md)) !== null) {
    const start = match.index + match[0].length
    const rest = md.slice(start)
    const next = rest.search(/^##[ \t]+/m)
    const body = (next === -1 ? rest : rest.slice(0, next)).trim()
    const version = match[1]
    const date = match[2] ?? null
    const bullets = parseTopLevelBullets(body)

    const titleInfo = deriveTitle(bullets)
    const title = titleInfo.title

    validateTitle(title)

    sections.push({
      version,
      date,
      title,
      body,
      titleInfo,
    })
  }
  return sections
}
