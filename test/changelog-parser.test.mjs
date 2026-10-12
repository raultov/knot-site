import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  parseKnotChangelog,
  parseKnotServerChangelog,
  extractSummary,
  extractHighlights,
  validateTitle,
} from '../scripts/changelog-parser.mjs'

// ─── Fixtures copied from real CHANGELOGs ────────────────────────────────────

// Origin: raultov/knot CHANGELOG.md (lines 8-17)
const KNOT_V1_11_3_FIXTURE = `## v1.11.3

- **Fixed(resolve)**: Reference resolution determinism across \`HashMap\` iteration orders. Replaced "first match wins" scans with deterministic candidate ranking (\`pick_deterministic_candidate\`) ordering candidates by same-file locality, lexicographical FQN, and UUID tie-breaking for:
  - FQN substring matching in receiver calls (\`resolve_receiver_call\`)
  - Class name suffix matching in class hierarchies (\`lookup_method_in_class_hierarchy\` & \`lookup_init_in_class_hierarchy\`)
  - Basename matching in VCL include references (\`resolve_vcl_include\`)
- **Fixed(resolve)**: Order-independent alias cycle collapsing in \`collapse_alias_cycles\`. Path-compresses the entire walk (including tails leading into cycles) in \`chain_terminal\` to ensure canonical representative mapping regardless of key iteration order.
- **Docs**: Documented reference resolution determinism contract in \`README.md\`.
- **Test(unit)**: Added 5 regression tests in \`src/pipeline/ingest/resolve/mod.rs\` and \`aliases.rs\` covering FQN substring collisions, same-file preference, class suffix collisions, VCL basename collisions, and alias tail-into-cycle independence.
`

// Origin: raultov/knot CHANGELOG.md (lines 20-27)
const KNOT_V1_11_2_FIXTURE = `## v1.11.2

- **Fixed**: Deterministic UUID v5 generation for HTML/JSX markup entities (\`HtmlId\`, \`HtmlClass\`, \`HtmlElement\`).
  Previously created with random \`Uuid::new_v4()\`, markup entities now derive stable v5 UUIDs from entity parameters, eliminating Qdrant and Neo4j churn on incremental re-indexing.
- **Fixed**: UUID v5 collision disambiguation pass (\`disambiguate_entity_uuids\`) for distinct entities sharing identical identity keys (\`{repo_name}:{file_path}:{fqn}:{start_line}\`).
  Entities colliding on base identity (such as TypeScript arrow-function constants exported as both a \`constant\` and \`function\`, same-line re-exports, or duplicate HTML classes) are deterministically ordered and assigned disambiguated v5 UUIDs (\`{base identity}:{kind label}:{name}#{n}\`).
- **Compatibility & Self-Healing**: Non-colliding entities retain their existing UUIDs bit-for-bit, preserving index state version compatibility without forcing a full re-index (\`--clean\` remains optional; existing indexes self-heal file by file upon re-indexing).
`

// Origin: raultov/knot CHANGELOG.md (lines 30-36)
const KNOT_V1_11_1_FIXTURE = `## v1.11.1

- **Fixed**: \`list_files\` no longer fabricates a total in its truncation notice.
  The reply carries \`total_matches\` — exact when the scan consumed every
  candidate, flagged by \`total_is_lower_bound\` when it stopped at the cap — and
  the notice renders \`Showing first 2000 of 3471 files\` or
  \`Showing first 2000 of more than 2000 files\` instead of the invented \`N + 1\`.
`

// Origin: raultov/knot CHANGELOG.md (lines 321-332)
const KNOT_V1_9_4_FIXTURE = `## v1.9.4 — Deterministic \`find_callers\` Target Grouping

Fix release: ensures \`find_callers\` Markdown output rendered by the CLI and MCP tools is fully deterministic across process runs and cluster nodes.

- **Fixed**: \`find_callers\` Markdown output is now deterministic. The
  \`### Target:\` sections inside each relationship bucket were grouped in a
  \`HashMap\` and rendered in process-random order (SipHash keys are seeded per
  process), so the same query against the same graph could render targets in
  a different order across runs and across nodes. The grouping now uses a
  \`BTreeMap\` keyed by \`target_file_path:start_line\`, pinning a stable sorted
  order. Pinned by \`test_format_references_result_target_order_is_deterministic\`.
`

// Origin: raultov/knot-server CHANGELOG.md (lines 12-16)
const KNOT_SERVER_0_8_3_FIXTURE = `## [0.8.3] - 2026-10-06

### Changed
- **Upgrade \`knot\` to 1.11.3.** Updated the \`knot\` dependency from 1.11.2 to 1.11.3 to pick up upstream patch fixes; no API or indexing changes required.
`

// Origin: raultov/knot-server CHANGELOG.md (lines 17-25)
const KNOT_SERVER_0_8_2_FIXTURE = `## [0.8.2] - 2026-10-04

### Changed
- **Upgrade \`knot\` to 1.11.2.** Updated the \`knot\` dependency to 1.11.2 to pick up upstream patch fixes.
- **Update toolchain pin in Dockerfile.** Updated default Rust toolchain pin to 1.98.0 in Dockerfile.

### Documentation
- **Update batch size defaults in README.md.** Updated default \`KNOT_SERVER_BATCH_SIZE\` references from 64 to 128 in documentation tables.
`

describe('Changelog parser - knot', () => {
  it('knot heading without title derives clean title and retains first bullet in body', () => {
    const sections = parseKnotChangelog(KNOT_V1_11_3_FIXTURE)
    assert.equal(sections.length, 1)
    const section = sections[0]
    assert.equal(section.version, '1.11.3')

    // Title invariants
    assert.equal(section.title, 'Reference resolution determinism across HashMap iteration orders')
    assert.ok(!section.title.includes('**'), 'title must not contain **')
    assert.ok(!section.title.includes('`'), 'title must not contain backticks')
    assert.ok(!section.title.endsWith(':'), 'title must not end with a colon')

    // Body includes the first bullet
    assert.ok(
      section.body.includes('Reference resolution determinism across'),
      'body must retain the first bullet text',
    )

    // Summary is from top-level bullets, not sub-bullets, and not identical to title
    const summary = extractSummary(section.body, section.titleInfo)
    assert.ok(summary.length >= 30, 'summary must be substantial')
    assert.notEqual(summary, section.title, 'summary must not be identical to title')
    assert.ok(!summary.includes('FQN substring matching'), 'summary must not be a sub-bullet')
    assert.ok(!summary.endsWith(':'), 'summary must not end with a colon')

    // Highlights must contain only top-level bullets (no sub-bullets)
    const highlights = extractHighlights(section.body)
    assert.ok(highlights.length > 0, 'must have highlights')
    for (const h of highlights) {
      assert.ok(!h.includes('FQN substring matching'), 'highlights must not include sub-bullet')
      assert.ok(!h.includes('Class name suffix matching'), 'highlights must not include sub-bullet')
      assert.ok(!h.includes('Basename matching'), 'highlights must not include sub-bullet')
      assert.ok(!h.endsWith(':'), 'highlight must not end with a colon')
    }
  })

  it('knot v1.11.2 derives clean title and summary from multi-line first bullet', () => {
    const sections = parseKnotChangelog(KNOT_V1_11_2_FIXTURE)
    assert.equal(sections.length, 1)
    const section = sections[0]
    assert.equal(section.version, '1.11.2')
    assert.equal(section.title, 'Deterministic UUID v5 generation for HTML/JSX markup entities…')
    const summary = extractSummary(section.body, section.titleInfo)
    assert.ok(
      summary.includes('Previously created with random Uuid::new_v4()'),
      'summary should come from second sentence of bullet 0',
    )
    assert.notEqual(summary, section.title)
  })

  it('knot v1.11.1 derives clean title without markdown and strips `list_files` backticks', () => {
    const sections = parseKnotChangelog(KNOT_V1_11_1_FIXTURE)
    assert.equal(sections.length, 1)
    const section = sections[0]
    assert.equal(section.version, '1.11.1')
    assert.equal(section.title, 'list_files no longer fabricates a total in its truncation notice')
  })

  it('knot heading with "— title" keeps the heading title with Markdown stripped', () => {
    const sections = parseKnotChangelog(KNOT_V1_9_4_FIXTURE)
    assert.equal(sections.length, 1)
    const section = sections[0]
    assert.equal(section.version, '1.9.4')
    assert.equal(section.title, 'Deterministic find_callers Target Grouping')
    assert.ok(!section.title.includes('`'), 'title must have markdown stripped')
    assert.ok(!section.title.includes('**'), 'title must not contain **')
  })
})

describe('Changelog parser - knot-server', () => {
  it('knot-server section derives title from first bullet bold lead, never "Changed"', () => {
    const sections = parseKnotServerChangelog(KNOT_SERVER_0_8_3_FIXTURE)
    assert.equal(sections.length, 1)
    const section = sections[0]
    assert.equal(section.version, '0.8.3')
    assert.equal(section.date, '2026-10-06')

    // Must never be bare "Changed"
    assert.notEqual(section.title, 'Changed')
    assert.equal(section.title, 'Upgrade knot to 1.11.3')
    assert.ok(!section.title.includes('`'), 'title must have markdown stripped')
    assert.ok(!section.title.includes('**'), 'title must not contain **')
    assert.ok(!section.title.endsWith(':'), 'title must not end with a colon')

    // Summary must not be identical to title
    const summary = extractSummary(section.body, section.titleInfo)
    assert.notEqual(summary, section.title)
    assert.ok(
      summary.includes('Updated the knot dependency from 1.11.2 to 1.11.3'),
      'summary should come from rest of bullet',
    )
  })

  it('knot-server 0.8.2 derives title from first bullet bold lead', () => {
    const sections = parseKnotServerChangelog(KNOT_SERVER_0_8_2_FIXTURE)
    assert.equal(sections.length, 1)
    const section = sections[0]
    assert.equal(section.version, '0.8.2')
    assert.equal(section.title, 'Upgrade knot to 1.11.2')
    assert.notEqual(section.title, 'Changed')
  })
})

describe('Title validation guards', () => {
  it('rejects invalid titles', () => {
    assert.throws(() => validateTitle(''), /Title is missing or empty/)
    assert.throws(() => validateTitle('Changed'), /bare change-type word/)
    assert.throws(() => validateTitle('Fixed'), /bare change-type word/)
    assert.throws(() => validateTitle('Added'), /bare change-type word/)
    assert.throws(() => validateTitle('**Bold Title**'), /raw bold Markdown/)
    assert.throws(() => validateTitle('Title with `code`'), /raw code Markdown/)
    assert.throws(() => validateTitle('Title ending with:'), /ends with a colon/)
  })

  it('accepts valid titles', () => {
    assert.doesNotThrow(() =>
      validateTitle('Reference resolution determinism across HashMap iteration orders'),
    )
    assert.doesNotThrow(() => validateTitle('Upgrade knot to 1.11.3'))
    assert.doesNotThrow(() => validateTitle('Deterministic find_callers Target Grouping'))
  })
})
