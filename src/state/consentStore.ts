/**
 * Consent store: bridges agent-initiated actions that need human approval
 * with a confirmation modal.
 *
 * The Web-MCP `requestUserInteraction()` pauses the agent, but the actual
 * consent UX is ours: a tool calls `consentStore.request(reason)` and awaits
 * the promise; the modal renders the pending request and resolves it when
 * the human clicks Allow or Deny.
 */

export interface ConsentRequest {
  id: number
  reason: string
}

type PendingConsent = ConsentRequest & {
  resolve: (approved: boolean) => void
}

let pending: PendingConsent | null = null
let nextId = 1
let snapshot: ConsentRequest | null = null
const listeners = new Set<() => void>()

function emit() {
  snapshot = pending ? { id: pending.id, reason: pending.reason } : null
  for (const listener of listeners) listener()
}

export const consentStore = {
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
  getSnapshot() {
    return snapshot
  },
  request(reason: string): Promise<boolean> {
    return new Promise((resolve) => {
      pending = { id: nextId++, reason, resolve }
      emit()
    })
  },
  respond(approved: boolean) {
    if (!pending) return
    const { resolve } = pending
    pending = null
    emit()
    resolve(approved)
  },
}
