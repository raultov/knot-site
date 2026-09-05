/**
 * Consent store: bridges agent-initiated actions that need human approval
 * with a confirmation modal.
 *
 * Web-MCP has no hook to pause the agent before asking, so awaiting this
 * promise is what pauses it: a tool calls `consentStore.request(reason)` and
 * blocks; the modal renders the pending request and resolves it when the
 * human clicks Allow or Deny.
 */

export interface ConsentRequest {
  id: number
  reason: string
}

type PendingConsent = ConsentRequest & {
  resolve: (approved: boolean) => void
  settled: boolean
}

let pending: PendingConsent | null = null
let nextId = 1
let snapshot: ConsentRequest | null = null
const listeners = new Set<() => void>()

function emit() {
  snapshot = pending ? { id: pending.id, reason: pending.reason } : null
  for (const listener of listeners) listener()
}

function settle(entry: PendingConsent, approved: boolean) {
  if (entry.settled) return
  entry.settled = true
  if (pending === entry) {
    pending = null
    emit()
  }
  entry.resolve(approved)
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
  request(reason: string, signal?: AbortSignal): Promise<boolean> {
    // If a request is already pending, deny the superseded request to prevent dangling promises
    if (pending) settle(pending, false)

    if (signal?.aborted) return Promise.resolve(false)

    return new Promise((resolve) => {
      const entry: PendingConsent = { id: nextId++, reason, resolve, settled: false }
      pending = entry

      if (signal) {
        signal.addEventListener('abort', () => settle(entry, false), { once: true })
      }

      emit()
    })
  },
  respond(approved: boolean) {
    if (pending) settle(pending, approved)
  },
}
