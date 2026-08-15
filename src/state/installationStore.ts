import type { Product } from '@/data/types'

/**
 * Minimal external store for the Installation tab, consumed with
 * `useSyncExternalStore` — the correct React 19 primitive for state that
 * lives outside the component tree.
 *
 * Why it exists: an agent cannot call your `useState`. Exposing a capability
 * (`get-install-command` mutates the UI) to an entity without a UI forces the
 * state out of the component. Same architectural pressure as Phase 1, applied
 * to state instead of data.
 */

let activeTab: Product = 'knot'
let snapshot: { activeTab: Product } = { activeTab }
const listeners = new Set<() => void>()

function emit() {
  snapshot = { activeTab }
  for (const listener of listeners) listener()
}

export const installationStore = {
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
  getSnapshot() {
    return snapshot
  },
  setActiveTab(tab: Product) {
    if (tab === activeTab) return
    activeTab = tab
    emit()
  },
}
