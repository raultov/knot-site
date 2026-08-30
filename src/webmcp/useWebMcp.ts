import { useEffect, useState } from 'react'
import type { WebMcpTool } from './types'

/**
 * Feature-detect for the Web-MCP API. Exposed separately so non-hook code
 * (e.g. a debug status line) uses the same check as the hook.
 */
export function isWebMcpAvailable(): boolean {
  if (typeof document !== 'undefined' && document.modelContext) return true
  if (typeof navigator !== 'undefined' && navigator.modelContext) return true
  return false
}

function getModelContext() {
  if (typeof document !== 'undefined' && document.modelContext) return document.modelContext
  if (typeof navigator !== 'undefined' && navigator.modelContext) return navigator.modelContext
  return null
}

/**
 * Registers Web-MCP tools with `navigator.modelContext` when the API exists.
 *
 * Lifecycle is tied to the tab via a single AbortController: navigating away
 * (or unmounting) aborts the signal and the browser unregisters every tool.
 * That is the live proof of the spec limitation "tools live while the page
 * lives" used in the talk.
 *
 * Called once from App so the tools are available on EVERY page of the site,
 * not only when the Tools section is open.
 *
 * @returns true when the Web-MCP API is available (lets the UI feature-detect).
 */
export function useWebMcp(tools: readonly WebMcpTool[]): boolean {
  const [available] = useState(isWebMcpAvailable)

  useEffect(() => {
    const modelContext = getModelContext()
    if (!modelContext) return

    const controller = new AbortController()
    for (const tool of tools) {
      try {
        const result = modelContext.registerTool(tool, { signal: controller.signal })
        // In the latest W3C draft, registerTool is asynchronous and returns a Promise
        if (result && typeof (result as Promise<void>).catch === 'function') {
          ;(result as Promise<void>).catch((err: unknown) => {
            if (err instanceof Error && err.name === 'AbortError') return // Expected during React StrictMode unmount
            console.warn(`[webmcp] Failed to register tool "${tool.name}":`, err)
          })
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return
        console.warn(`[webmcp] Failed to register tool "${tool.name}":`, err)
      }
    }

    return () => {
      controller.abort()
    }
  }, [tools])

  return available
}
