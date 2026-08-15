import { useState } from 'react'
import type { ReactNode } from 'react'

interface CopyButtonProps {
  text: string
  label: string
  className?: string
  children?: ReactNode
}

/**
 * Unified copy-to-clipboard button.
 *
 * The copied state is rendered in a sibling `<span role="status">` OUTSIDE
 * the `<button>`: a button whose aria-label replaces its content as the
 * accessible name swallows inner live regions, making the announcement
 * unreliable. Keeping the live region as a sibling fixes that.
 *
 * The timeout-based reset and the clipboard call were previously duplicated
 * in Hero.tsx, Installation.tsx and KnotServer.tsx.
 */
function CopyButton({ text, label, className, children }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <span className={`copybutton ${className ?? ''}`}>
      <button onClick={handleCopy} aria-label={label}>
        {children}
      </button>
      <span className="copybutton__status" role="status">
        {copied ? 'Copied!' : ''}
      </span>
    </span>
  )
}

export default CopyButton
