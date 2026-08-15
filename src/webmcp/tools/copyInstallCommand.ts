import type { WebMcpTool } from '@/webmcp/types'
import { consentStore } from '@/state/consentStore'
import { knotInstallCommand, knotServerInstallCommand } from '@/data/site'
import { copyInstallCommandSchema, type CopyInstallCommandInput } from '@/webmcp/schemas'
import { errorText, plainText } from './format'

/**
 * Tool #6 — trust boundary.
 *
 * `clipboard.write` requires transient user activation, which an agent does
 * not have. So consent here is not ceremony: it is a technical requirement.
 * The flow: `requestUserInteraction()` pauses the agent, the consent modal
 * asks the human, and only an explicit Allow (a real user activation, which
 * the promise chain preserves) lets the clipboard write succeed.
 */
export const copyInstallCommand: WebMcpTool<CopyInstallCommandInput> = {
  name: 'copy-install-command',
  description:
    'Copies a Knot install command to the clipboard. Requires explicit user approval through a consent dialog.',
  inputSchema: copyInstallCommandSchema,
  annotations: { readOnlyHint: false },
  execute: async (input) => {
    const { product = 'knot' } = input

    const modelContext = navigator.modelContext
    if (!modelContext?.requestUserInteraction) {
      return errorText('User interaction requests are not supported in this browser.')
    }

    await modelContext.requestUserInteraction()

    const productName = product === 'knot-server' ? 'Knot Server' : 'Knot'
    const approved = await consentStore.request(
      `An agent asked to copy the ${productName} install command to your clipboard.`,
    )

    if (!approved) {
      return errorText('The user declined the clipboard write.')
    }

    const command = product === 'knot-server' ? knotServerInstallCommand : knotInstallCommand
    await navigator.clipboard.writeText(command)

    return plainText('Install command copied to the clipboard.')
  },
}
