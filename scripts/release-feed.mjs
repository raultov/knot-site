/**
 * Pure helpers behind the automated release-feed refresh
 * (scripts/sync-release-feed.mjs, orchestrated by
 * .github/workflows/update-release-feed.yml).
 *
 * No I/O here on purpose: test/release-feed.test.mjs covers these functions
 * directly with inline fixtures.
 */

/** Upstream repositories, in the order they are named in a commit message. */
export const REPOS = ['knot', 'knot-server']

/**
 * Latest version per repository. `src/data/updates.json` is sorted newest
 * first per repository, so the first entry of each repo is its latest one.
 */
export function latestVersions(feed) {
  const latest = {}
  for (const entry of feed?.entries ?? []) {
    if (!entry?.repo || !entry.version) continue
    if (!(entry.repo in latest)) latest[entry.repo] = entry.version
  }
  return latest
}

/** Whether the feed already carries a given repo+version pair. */
export function hasVersion(feed, repo, version) {
  const wanted = String(version ?? '')
    .replace(/^v/, '')
    .trim()
  if (!wanted) return false
  return (feed?.entries ?? []).some((e) => e.repo === repo && e.version === wanted)
}

/**
 * Whether two feeds carry the same entries. `generatedAt`, `source` and
 * `staleRepos` are metadata and change on every run, so only `entries` counts.
 */
export function entriesEqual(a, b) {
  return JSON.stringify(a?.entries ?? []) === JSON.stringify(b?.entries ?? [])
}

/** Repos whose latest version differs between two feed states, in REPOS order. */
export function changedRepos(previous, next) {
  const before = previous ?? {}
  const after = next ?? {}
  const repos = [...REPOS, ...Object.keys(after).filter((r) => !REPOS.includes(r))]
  return repos
    .filter((repo) => after[repo] && after[repo] !== before[repo])
    .map((repo) => ({ repo, version: after[repo] }))
}

/**
 * Increments the patch component of an `x.y.z` version ("0.8.22" -> "0.8.23").
 * Anything else is a configuration error, not a value to guess at.
 */
export function bumpPatch(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(String(version ?? '').trim())
  if (!match) throw new Error(`Not an x.y.z version: ${version}`)
  return `${match[1]}.${match[2]}.${Number(match[3]) + 1}`
}

/**
 * Commit message of the bot, matching the shape of the manual commits:
 * `feat(updates): update release feed to knot v1.16.1 and knot-server v0.10.1, bump to v0.8.22`
 * When the entries changed without a new upstream version (a CHANGELOG edit),
 * the message says so instead of inventing one.
 */
export function buildCommitMessage(previous, next, appVersion) {
  const parts = changedRepos(previous, next).map(({ repo, version }) => `${repo} v${version}`)
  let head
  if (parts.length === 0) head = 'refresh release feed'
  else if (parts.length === 1) head = `update release feed to ${parts[0]}`
  else head = `update release feed to ${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}`
  return `feat(updates): ${head}, bump to v${appVersion}`
}
