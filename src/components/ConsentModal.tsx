import { useEffect, useRef, useSyncExternalStore } from 'react'
import { consentStore } from '@/state/consentStore'
import '@/styles/ConsentModal.css'

/**
 * Confirmation modal for agent-initiated actions that touch the user's
 * machine (clipboard writes). The decision is ALWAYS human: the pending
 * promise only resolves when Allow or Deny is clicked, or Escape denies.
 */
function ConsentModal() {
  const pending = useSyncExternalStore(
    consentStore.subscribe,
    consentStore.getSnapshot,
    consentStore.getSnapshot,
  )
  const allowRef = useRef<HTMLButtonElement>(null)
  const restoreFocusRef = useRef<HTMLElement | null>(null)
  const wasOpenRef = useRef(false)

  useEffect(() => {
    if (pending && !wasOpenRef.current) {
      restoreFocusRef.current = document.activeElement as HTMLElement | null
      allowRef.current?.focus()
    }
    if (!pending && wasOpenRef.current) {
      restoreFocusRef.current?.focus?.()
      restoreFocusRef.current = null
    }
    wasOpenRef.current = !!pending
  }, [pending])

  useEffect(() => {
    if (!pending) return
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        consentStore.respond(false)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [pending])

  if (!pending) return null

  return (
    <div className="consent__backdrop">
      <div
        className="consent__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="consent-title"
        aria-describedby="consent-desc"
      >
        <h3 className="consent__title" id="consent-title">
          An agent needs your permission
        </h3>
        <p className="consent__desc" id="consent-desc">
          {pending.reason}
        </p>
        <div className="consent__actions">
          <button
            ref={allowRef}
            className="consent__btn consent__btn--allow"
            onClick={() => consentStore.respond(true)}
          >
            Allow
          </button>
          <button
            className="consent__btn consent__btn--deny"
            onClick={() => consentStore.respond(false)}
          >
            Deny
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConsentModal
