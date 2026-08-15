import type { ReactNode } from 'react'
import type { features } from '@/data/features'

export type FeatureId = (typeof features)[number]['id']

/**
 * Record<FeatureId, ReactNode>: adding a feature to src/data/features.ts
 * without adding its icon here is a compile error. The type is the contract
 * between the data layer and the visual layer.
 */
export const featureIcons: Record<FeatureId, ReactNode> = {
  'semantic-structural-search': (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
      <path d="M7 11h8M11 7v8" />
    </svg>
  ),
  'multi-language-support': (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M2 12h20M12 2a14.8 14.8 0 0 1 3 10 14.8 14.8 0 0 1-3 10M12 2a14.8 14.8 0 0 0-3 10 14.8 14.8 0 0 0 3 10" />
    </svg>
  ),
  'incremental-indexing': (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m13 2 3 6h-8l3-6" />
      <path d="M6 12h12l-3 6H9l-3-6" />
      <path d="m9 18 3 4 3-4" />
    </svg>
  ),
  'mcp-cli': (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
  'dual-database-architecture': (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 7v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7" />
      <ellipse cx="12" cy="12" rx="9" ry="3" />
      <path d="M3 7a9 3 0 0 0 18 0" />
    </svg>
  ),
  'cross-repo-dependency-resolution': (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s-8-4.5-8-11.8V5l8-3 8 3v5.2c0 7.3-8 11.8-8 11.8" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
}
