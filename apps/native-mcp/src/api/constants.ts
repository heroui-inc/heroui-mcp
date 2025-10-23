/**
 * API Constants for HeroUI Native MCP
 */

export const API_VERSION = "1.0.0";

// R2 bucket paths
export const R2_PATHS = {
  COMPONENTS: "native/components",
  THEME: "native/theme",
  LATEST: "native/latest",
} as const;

// Cache control settings
export const CACHE_CONTROL = {
  // Cache for 1 hour for versioned content (immutable)
  VERSIONED: "public, max-age=3600, s-maxage=86400",
  // Cache for 5 minutes for latest content
  LATEST: "public, max-age=300, s-maxage=600",
  // No cache for metadata
  METADATA: "no-cache, no-store, must-revalidate",
} as const;
