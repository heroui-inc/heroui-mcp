/**
 * Utility for reading migration documentation from the docs site
 */

const DEFAULT_DOCS_BASE_URL = "https://v3.heroui.com/docs/react/migration";

function getDocsSiteUrl(filename: string, baseUrl?: string): string {
  const docsBase = baseUrl || DEFAULT_DOCS_BASE_URL;

  // Migration docs are now directly under react/migration/
  return `${docsBase}/${filename}`;
}

/**
 * Read migration doc from the docs site
 * The docs site automatically resolves <include> tags via Fumadocs remarkInclude
 * @param filename - The filename to fetch (e.g., "agent-guide-incremental.mdx", "hooks.mdx", "index.mdx")
 * @param baseUrl - Optional base URL for the docs site (defaults to production URL)
 */
export async function readMigrationDoc(filename: string, baseUrl?: string): Promise<string> {
  const docUrl = getDocsSiteUrl(filename, baseUrl);
  const response = await fetch(docUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${filename}: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

/**
 * Get the source URL for a migration doc (for display purposes)
 * @param filename - The filename to get URL for
 * @param baseUrl - Optional base URL for the docs site (defaults to production URL)
 */
export function getMigrationDocSourceUrl(filename: string, baseUrl?: string): string {
  return getDocsSiteUrl(filename, baseUrl);
}
