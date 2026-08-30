/**
 * Minimal hash router for the Contact sub-page.
 *
 * Hash-based on purpose: the site is a static SPA served by Cloudflare Pages
 * with a CSP that already fits it, and hash routing needs no server config,
 * no new dependency, and coexists with the in-page section anchors of the
 * landing page.
 *
 * Hash grammar:
 *   #/contact     → contact page
 *   anything else (e.g. #install, #features, #/) → landing page; the part
 *   after `#` (without the slash) is the section to scroll to.
 */

export type Page = 'home' | 'contact'

export interface RouteSnapshot {
  page: Page
  /** Section id to scroll to when the page is home, null otherwise. */
  section: string | null
}

function pageFromHash(hash: string): Page {
  if (hash.startsWith('#/contact')) return 'contact'
  return 'home'
}

function sectionFromHash(hash: string): string | null {
  if (hash.startsWith('#/')) return null
  return hash.length > 1 ? hash.slice(1) : null
}

function readFromLocation(): RouteSnapshot {
  const hash = window.location.hash
  return { page: pageFromHash(hash), section: sectionFromHash(hash) }
}

let snapshot: RouteSnapshot = readFromLocation()
const listeners = new Set<() => void>()

window.addEventListener('hashchange', () => {
  snapshot = readFromLocation()
  for (const listener of listeners) listener()
})

export const router = {
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
  getSnapshot() {
    return snapshot
  },
}
