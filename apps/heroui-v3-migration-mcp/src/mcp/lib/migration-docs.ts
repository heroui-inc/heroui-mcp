/**
 * Utility for reading migration documentation from GitHub
 */

const GITHUB_BRANCH = "docs/migration";
const GITHUB_REPO = "heroui-inc/heroui";
const MIGRATION_DOCS_PATH = "apps/docs/content/docs/v2-to-v3-migration";

function getGitHubRawUrl(filename: string): string {
  return `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}/${MIGRATION_DOCS_PATH}/${filename}`;
}

/**
 * Read migration doc from GitHub
 */
export async function readMigrationDoc(filename: string): Promise<string> {
  const docUrl = getGitHubRawUrl(filename);
  const response = await fetch(docUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${filename}: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

/**
 * Get the source URL for a migration doc (for display purposes)
 */
export function getMigrationDocSourceUrl(filename: string): string {
  return getGitHubRawUrl(filename);
}
