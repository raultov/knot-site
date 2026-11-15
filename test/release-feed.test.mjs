import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  REPOS,
  bumpPatch,
  buildCommitMessage,
  changedRepos,
  entriesEqual,
  hasVersion,
  latestVersions,
} from '../scripts/release-feed.mjs'

// ─── Fixtures mirroring src/data/updates.json ───────────────────────────────

const FEED = {
  generatedAt: '2026-11-14T11:08:37.156Z',
  source: 'https://github.com/raultov/knot + https://github.com/raultov/knot-server',
  entries: [
    { repo: 'knot', version: '1.16.1', title: 'A', date: '2026-11-14' },
    { repo: 'knot', version: '1.16.0', title: 'B', date: '2026-11-14' },
    { repo: 'knot-server', version: '0.10.1', title: 'C', date: '2026-11-14' },
    { repo: 'knot-server', version: '0.10.0', title: 'D', date: '2026-11-14' },
  ],
}

/** Same entries, one newer release per named repo. */
function feedWith(releases) {
  const newer = Object.entries(releases).map(([repo, version]) => ({
    repo,
    version,
    title: `new ${version}`,
    date: '2026-11-15',
  }))
  return { ...FEED, generatedAt: '2026-11-15T00:00:00.000Z', entries: [...newer, ...FEED.entries] }
}

// ─── latestVersions ─────────────────────────────────────────────────────────

describe('latestVersions', () => {
  it('returns the first entry of each repo (the feed is sorted newest first)', () => {
    assert.deepEqual(latestVersions(FEED), { knot: '1.16.1', 'knot-server': '0.10.1' })
  })

  it('tolerates a missing feed and entries without a version', () => {
    assert.deepEqual(latestVersions(null), {})
    assert.deepEqual(latestVersions({}), {})
    assert.deepEqual(
      latestVersions({
        entries: [{ repo: 'knot' }, { version: '1.0.0' }, { repo: 'knot', version: '1.0.1' }],
      }),
      { knot: '1.0.1' },
    )
  })
})

// ─── hasVersion ────────────────────────────────────────────────────────────

describe('hasVersion', () => {
  it('finds a published version', () => {
    assert.equal(hasVersion(FEED, 'knot', '1.16.0'), true)
    assert.equal(hasVersion(FEED, 'knot', '1.16.2'), false)
  })

  it('accepts the tag form and ignores surrounding whitespace', () => {
    assert.equal(hasVersion(FEED, 'knot', 'v1.16.1'), true)
    assert.equal(hasVersion(FEED, 'knot', ' 1.16.1 '), true)
  })

  it('matches the repo too, not only the version', () => {
    assert.equal(hasVersion(FEED, 'knot-server', '1.16.1'), false)
  })

  it('is false for an empty version or a missing feed', () => {
    assert.equal(hasVersion(FEED, 'knot', ''), false)
    assert.equal(hasVersion(null, 'knot', '1.16.1'), false)
  })
})

// ─── entriesEqual ──────────────────────────────────────────────────────────

describe('entriesEqual', () => {
  it('ignores generatedAt, source and staleRepos', () => {
    const refreshed = { ...FEED, generatedAt: '2026-11-15T09:00:00.000Z', staleRepos: ['knot'] }
    assert.equal(entriesEqual(FEED, refreshed), true)
  })

  it('detects a new entry', () => {
    assert.equal(entriesEqual(FEED, feedWith({ knot: '1.16.2' })), false)
  })

  it('detects an edited entry with the same versions', () => {
    const edited = JSON.parse(JSON.stringify(FEED))
    edited.entries[0].summary = 'rewritten'
    assert.equal(entriesEqual(FEED, edited), false)
  })

  it('treats two missing feeds as equal and a missing one as different', () => {
    assert.equal(entriesEqual(null, undefined), true)
    assert.equal(entriesEqual(null, FEED), false)
  })
})

// ─── changedRepos ──────────────────────────────────────────────────────────

describe('changedRepos', () => {
  it('lists nothing when both repos keep their version', () => {
    assert.deepEqual(
      changedRepos(latestVersions(FEED), latestVersions({ ...FEED, generatedAt: 'later' })),
      [],
    )
  })

  it('lists a single changed repo', () => {
    const next = latestVersions(feedWith({ 'knot-server': '0.10.2' }))
    assert.deepEqual(changedRepos(latestVersions(FEED), next), [
      { repo: 'knot-server', version: '0.10.2' },
    ])
  })

  it('orders the repos like REPOS, whatever the feed order', () => {
    const next = latestVersions(feedWith({ 'knot-server': '0.10.2', knot: '1.16.2' }))
    assert.deepEqual(
      changedRepos(latestVersions(FEED), next).map((c) => c.repo),
      REPOS,
    )
  })
})

// ─── bumpPatch ─────────────────────────────────────────────────────────────

describe('bumpPatch', () => {
  it('increments the patch component', () => {
    assert.equal(bumpPatch('0.8.22'), '0.8.23')
    assert.equal(bumpPatch('1.0.9'), '1.0.10')
    assert.equal(bumpPatch(' 0.8.22 '), '0.8.23')
  })

  it('rejects anything that is not x.y.z', () => {
    assert.throws(() => bumpPatch('0.8'), /Not an x\.y\.z version/)
    assert.throws(() => bumpPatch('v0.8.22'), /Not an x\.y\.z version/)
    assert.throws(() => bumpPatch(undefined), /Not an x\.y\.z version/)
  })
})

// ─── buildCommitMessage ────────────────────────────────────────────────────

describe('buildCommitMessage', () => {
  it('names both repos when both released', () => {
    const next = latestVersions(feedWith({ knot: '1.16.2', 'knot-server': '0.10.2' }))
    assert.equal(
      buildCommitMessage(latestVersions(FEED), next, '0.8.23'),
      'feat(updates): update release feed to knot v1.16.2 and knot-server v0.10.2, bump to v0.8.23',
    )
  })

  it('names a single repo', () => {
    const next = latestVersions(feedWith({ knot: '1.16.2' }))
    assert.equal(
      buildCommitMessage(latestVersions(FEED), next, '0.8.23'),
      'feat(updates): update release feed to knot v1.16.2, bump to v0.8.23',
    )
  })

  it('says refresh when the entries changed without a new version', () => {
    assert.equal(
      buildCommitMessage(latestVersions(FEED), latestVersions(FEED), '0.8.23'),
      'feat(updates): refresh release feed, bump to v0.8.23',
    )
  })

  it('has a single line, usable as git commit -m', () => {
    const message = buildCommitMessage({}, latestVersions(feedWith({ knot: '1.16.2' })), '0.8.23')
    assert.equal(message.includes('\n'), false)
  })
})
