import type { WebMcpTool } from '@/webmcp/types'
import { installationStore } from '@/state/installationStore'
import { knotSections, knotServerSections } from '@/data/install'
import { dockerRunCommand } from '@/data/site'
import type { InstallSection } from '@/data/types'
import { getInstallCommandSchema, type GetInstallCommandInput } from '@/webmcp/schemas'
import { errorText, plainText } from './format'

/**
 * Tool #5 — the pedagogical piece. Unlike the other four, it does not just
 * return data: it switches the Installation tab and scrolls the UI to the
 * section that shows the command. That is something the declarative API
 * cannot do, which justifies the imperative one.
 *
 * Honest gray zone (worth showing on stage): it mutates the UI but not
 * persistent state, so `readOnlyHint` is deliberately left UNSET. The spec
 * does not settle this case.
 */

function findSnippet(
  sections: readonly InstallSection[],
  heading: string,
  label: string,
): string | undefined {
  const section = sections.find((s) => s.heading === heading)
  return section?.snippets?.find((s) => s.label === label)?.code
}

function findOptionSnippet(
  sections: readonly InstallSection[],
  heading: string,
  optionTitle: string,
  label: string,
): string | undefined {
  const section = sections.find((s) => s.heading === heading)
  const option = section?.options?.find((o) => o.title === optionTitle)
  return option?.snippets.find((s) => s.label === label)?.code
}

function applyTuning(command: string, tuning: NonNullable<GetInstallCommandInput['tuning']>) {
  let tuned = command
  if (tuning.cores !== undefined) {
    tuned = tuned.replace(
      /KNOT_SERVER_RAYON_THREADS=\d+/,
      `KNOT_SERVER_RAYON_THREADS=${tuning.cores}`,
    )
  }
  if (tuning.ramGb !== undefined) {
    tuned = tuned.replace(/KNOT_SERVER_BATCH_SIZE=\d+/, `KNOT_SERVER_BATCH_SIZE=${tuning.ramGb * 16}`)
  }
  return tuned
}

function scrollToInstall() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  // setTimeout instead of requestAnimationFrame: rAF is throttled in
  // background tabs, and the delay lets the tab transition commit before the
  // scroll target's final position is known.
  setTimeout(() => {
    document.getElementById('install')?.scrollIntoView({
      behavior: reduced ? 'auto' : 'smooth',
      block: 'start',
    })
  }, 150)
}

export const getInstallCommand: WebMcpTool<GetInstallCommandInput> = {
  name: 'get-install-command',
  description:
    'Returns the exact install command for a Knot product and method, and switches the page to the Installation section showing it. The docker method for knot-server supports optional resource tuning.',
  inputSchema: getInstallCommandSchema,
  execute: async (input) => {
    const { product, method, tuning } = input

    let label: string
    let command: string | undefined

    if (product === 'knot') {
      if (method === 'curl') {
        label = 'Install binaries (curl)'
        command = findSnippet(knotSections, 'Install', 'Install binaries')
      } else if (method === 'compose') {
        label = 'Start Qdrant & Neo4j (docker compose)'
        command = findSnippet(knotSections, 'Prerequisites', 'Start Qdrant & Neo4j')
      } else {
        return errorText(
          'The knot CLI has no Docker image on this site. Use method curl or compose.',
        )
      }
    } else {
      if (method === 'curl') {
        label = 'Install via curl'
        command = findOptionSnippet(
          knotServerSections,
          'Install',
          'Option A — Download binaries',
          'Install via curl',
        )
      } else if (method === 'compose') {
        label = 'Download docker-compose.yml'
        command = findOptionSnippet(
          knotServerSections,
          'Install',
          'Option C — Docker Compose (all-in-one)',
          'Download docker-compose.yml',
        )
      } else {
        label = tuning ? 'docker run with resource tuning' : 'Pull from Docker Hub'
        command = tuning
          ? applyTuning(dockerRunCommand, tuning)
          : findOptionSnippet(
              knotServerSections,
              'Install',
              'Option B — Docker image',
              'Pull from Docker Hub',
            )
      }
    }

    if (!command) {
      return errorText(`No command found for ${product} / ${method}.`)
    }

    // Mutate the UI: switch the tab the agent "cares about" into view.
    installationStore.setActiveTab(product === 'knot-server' ? 'server' : 'knot')
    scrollToInstall()

    return plainText(`# ${label}\n\n\`\`\`bash\n${command}\n\`\`\``)
  },
}
