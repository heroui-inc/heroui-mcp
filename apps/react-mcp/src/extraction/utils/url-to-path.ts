/**
 * URL to GitHub file path converter utilities
 * Handles conversion from documentation URLs to GitHub repository file paths
 */

import type {GitHubClient} from "../services/github-client";

/**
 * Convert documentation URL to GitHub file path
 * Handles category folders like (buttons), (forms), etc.
 *
 * Examples:
 * - /docs/react/components/button → apps/docs/content/docs/react/components/button.mdx
 * - /docs/react/components/button → apps/docs/content/docs/react/components/(buttons)/button.mdx
 */
export function urlToGitHubPath(url: string): string {
  // Remove leading slash and base path
  const path = url.replace(/^\/docs\/react\/components\//, "");
  const componentName = path.split("/").pop() || path;

  // Base path
  const basePath = "apps/docs/content/docs/react/components";

  // Try direct path first
  return `${basePath}/${componentName}.mdx`;
}

/**
 * Find the actual GitHub file path for a component URL
 * Handles category folders by searching GitHub directory
 */
export async function findComponentFilePath(
  github: GitHubClient,
  url: string,
  componentName: string,
): Promise<string | null> {
  const basePath = "apps/docs/content/docs/react/components";

  // Try direct path first
  const directPath = `${basePath}/${componentName}.mdx`;
  try {
    await github.fetchFile("heroui-inc", "heroui", directPath, "v3");

    return directPath;
  } catch {
    // File not found, search in category folders
  }

  // List directory to find category folders
  try {
    const items = await github.listFiles("heroui-inc", "heroui", basePath, "v3");
    const categoryDirs = items.filter(
      (item) => item.type === "dir" && item.name.startsWith("(") && item.name.endsWith(")"),
    );

    // Search in each category folder
    for (const dir of categoryDirs) {
      const categoryPath = `${basePath}/${dir.name}/${componentName}.mdx`;
      try {
        await github.fetchFile("heroui-inc", "heroui", categoryPath, "v3");

        return categoryPath;
      } catch {
        // Not in this category, continue
      }
    }
  } catch (error) {
    console.warn(`Failed to search category folders for ${componentName}:`, error);
  }

  return null;
}
