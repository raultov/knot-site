#!/usr/bin/env node
/**
 * Refresh the release feed and the agent-facing assets for a new upstream
 * release, and report what changed to the workflow that runs it.
 *
 * Triggered from knot and knot-server (repository_dispatch, `upstream-release`),
 * on demand, and once a day as a safety net. See
 * .github/workflows/update-release-feed.yml.
 *
 * Steps:
 *  1. Re-run scripts/fetch-updates.mjs (this script runs the child process so
 *     the previously committed feed can be kept verbatim when nothing changed).
 *  2. Retry while an expected `EXPECT_REPO`/`EXPECT_VERSION` is still missing:
 *     raw.githubusercontent.com caches for up to ~5 minutes, so the tag can
 *     exist while the CHANGELOG it serves is still the previous revision.
 *  3. If the entries did not change, restore the previous file byte for byte
 *     (fetch-updates always rewrites `generatedAt`) and report changed=false.
 *  4. Otherwise bump the patch version of package.json, regenerate llms.txt,
 *     index.html (JSON-LD + app-version) and sitemap.xml, and report the commit
 *     message through $GITHUB_OUTPUT.
 *
 * Exit code 1 means the feed is stale and the workflow must not commit: a
 * failed upstream fetch, a repo that fell back to its committed entries
 * (`staleRepos`), or an expected version that never showed up.
 */
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { appendFile, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { setTimeout as sleep } from 'node:timers/promises'
import {
  bumpPatch,
  buildCommitMessage,
  entriesEqual,
  hasVersion,
  latestVersions,
} from './release-feed.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const FEED_FILE = join(ROOT, 'src', 'data', 'updates.json')
const PACKAGE_FILE = join(ROOT, 'package.json')
const INDEX_FILE = join(ROOT, 'index.html')
const FETCH_SCRIPT = join(__dirname, 'fetch-updates.mjs')
const ASSETS_SCRIPT = join(__dirname, 'generate-agent-assets.mjs')

const MAX_ATTEMPTS = positiveInt(process.env.SYNC_MAX_ATTEMPTS, 5)
const RETRY_DELAY_MS = positiveInt(process.env.SYNC_RETRY_DELAY_MS, 60_000)

const EXPECT_REPO = (process.env.EXPECT_REPO ?? '').trim()
const EXPECT_VERSION = (process.env.EXPECT_VERSION ?? '').replace(/^v/, '').trim()

function positiveInt(value, fallback) {
  const parsed = Number.parseInt(value ?? '', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

/** Exposes a step output to the workflow; prints it when run locally. */
async function setOutput(name, value) {
  const line = `${name}=${String(value).replace(/\r?\n/g, ' ')}\n`
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, line, 'utf-8')
  else console.log(`[sync-release-feed] ${name}=${String(value)}`)
}

function parseFeed(raw) {
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function runFetch() {
  const result = spawnSync(process.execPath, [FETCH_SCRIPT], {
    cwd: ROOT,
    stdio: 'inherit',
    env: process.env,
  })
  return result.status === 0
}

/**
 * Runs fetch-updates until the feed is usable: the fetch succeeded, no repo
 * fell back to its committed entries, and the expected version (if any) is
 * present. Sleeps RETRY_DELAY_MS between attempts.
 */
async function fetchWithRetry(previousRaw) {
  let lastReason = ''

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    if (!runFetch()) {
      lastReason = 'scripts/fetch-updates.mjs exited non-zero'
    } else {
      const feed = parseFeed(await readFile(FEED_FILE, 'utf-8'))
      if (!feed) {
        lastReason = `${FEED_FILE} is not valid JSON`
      } else if (feed.staleRepos?.length) {
        lastReason = `reused stale entries for ${feed.staleRepos.join(', ')}`
      } else if (EXPECT_REPO && EXPECT_VERSION && !hasVersion(feed, EXPECT_REPO, EXPECT_VERSION)) {
        lastReason = `${EXPECT_REPO} v${EXPECT_VERSION} is not in the feed yet`
      } else {
        return { feed, attempts: attempt }
      }
    }

    if (attempt < MAX_ATTEMPTS) {
      console.warn(
        `[sync-release-feed] Attempt ${attempt}/${MAX_ATTEMPTS} failed (${lastReason}); retrying in ${Math.round(RETRY_DELAY_MS / 1000)}s`,
      )
      await sleep(RETRY_DELAY_MS)
    }
  }

  // Nothing usable: put the committed feed back so a failed run leaves no diff.
  if (previousRaw) await writeFile(FEED_FILE, previousRaw, 'utf-8')
  throw new Error(`${lastReason} (after ${MAX_ATTEMPTS} attempts)`)
}

async function main() {
  const previousRaw = existsSync(FEED_FILE) ? await readFile(FEED_FILE, 'utf-8') : ''
  const previous = parseFeed(previousRaw)

  const { feed, attempts } = await fetchWithRetry(previousRaw)

  if (entriesEqual(previous, feed)) {
    // Same entries, so most likely only `generatedAt` moved. Restore the
    // committed bytes (fetch-updates just rewrote the file) to leave no diff.
    if (previousRaw) await writeFile(FEED_FILE, previousRaw, 'utf-8')
    console.log('[sync-release-feed] Release feed is already up to date; nothing to commit')
    await setOutput('changed', 'false')
    await setOutput('attempts', String(attempts))
    return
  }

  const before = latestVersions(previous)
  const after = latestVersions(feed)

  const pkg = JSON.parse(await readFile(PACKAGE_FILE, 'utf-8'))
  const appVersion = bumpPatch(pkg.version)
  pkg.version = appVersion
  await writeFile(PACKAGE_FILE, JSON.stringify(pkg, null, 2) + '\n', 'utf-8')

  const assets = spawnSync(process.execPath, [ASSETS_SCRIPT], {
    cwd: ROOT,
    stdio: 'inherit',
    env: process.env,
  })
  if (assets.status !== 0) {
    throw new Error('scripts/generate-agent-assets.mjs failed; assets may be stale')
  }
  // generate-agent-assets logs and keeps the previous assets on failure instead
  // of exiting non-zero, so prove that it really rewrote index.html.
  const indexHtml = await readFile(INDEX_FILE, 'utf-8')
  if (!indexHtml.includes(`<!-- app-version: ${appVersion} -->`)) {
    throw new Error(`index.html does not carry app-version ${appVersion}; assets are stale`)
  }

  const message = buildCommitMessage(before, after, appVersion)
  console.log(`[sync-release-feed] Commit message: ${message}`)
  await setOutput('changed', 'true')
  await setOutput('message', message)
  await setOutput('app_version', appVersion)
  await setOutput('attempts', String(attempts))
}

main().catch((err) => {
  console.error(`[sync-release-feed] ${err.message ?? err}`)
  process.exitCode = 1
})
