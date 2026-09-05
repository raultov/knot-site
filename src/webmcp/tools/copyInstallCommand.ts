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
 * The flow: the consent modal asks the human, and only an explicit Allow (a
 * real user activation, which the promise chain preserves) lets the clipboard
 * write succeed.
 *
 * No shipping browser exposes a hook to pause the agent first: as of Chrome
 * 152 `ModelContext` is just registerTool/getTools/executeTool/ontoolchange,
 * with neither `requestUserInput` nor `requestUserInteraction`. The modal is
 * therefore the entire trust boundary.
 */
export const copyInstallCommand: WebMcpTool<CopyInstallCommandInput> = {
  name: 'copy-install-command',
  description:
    'Copies a Knot install command to the clipboard. Requires explicit user approval through a consent dialog.',
  inputSchema: copyInstallCommandSchema,
  annotations: { readOnlyHint: false, consequentialHint: true },
  execute: async (input, options) => {
    if (options?.signal?.aborted) {
      return errorText('The invocation was cancelled before it started.')
    }
    const { product = 'knot' } = input

    const productName = product === 'knot-server' ? 'Knot Server' : 'Knot'
    const approved = await consentStore.request(
      `An agent asked to copy the ${productName} install command to your clipboard.`,
      options?.signal,
    )

    if (options?.signal?.aborted) {
      return errorText('The invocation was cancelled while waiting for user consent.')
    }

    if (!approved) {
      return errorText(
        'The user declined the clipboard write. The command can still be retrieved with get-install-command.',
      )
    }

    const command = product === 'knot-server' ? knotServerInstallCommand : knotInstallCommand
    try {
      await navigator.clipboard.writeText(command)
    } catch {
      return errorText(
        'The browser blocked the clipboard write. Instruct the user to press the Copy button in the Installation section.',
      )
    }

    return plainText('Install command copied to the clipboard.')
  },
}
