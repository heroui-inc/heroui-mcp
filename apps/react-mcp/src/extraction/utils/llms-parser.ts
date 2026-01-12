/**
 * llms.txt parser utilities
 * Extracts component URLs and metadata from llms.txt content
 */

export interface ComponentUrl {
  title: string;
  url: string;
  description?: string;
  category?: string;
}

export interface DocUrl {
  title: string;
  url: string;
  description?: string;
  category?: string;
}

/**
 * Parse llms.txt content and extract component URLs only
 */
export function parseLlmsTxt(content: string): ComponentUrl[] {
  const components: ComponentUrl[] = [];
  const lines = content.split("\n");
  let currentCategory: string | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines and headers
    if (!trimmed || trimmed.startsWith("#")) {
      // Extract category from headers
      if (trimmed.startsWith("### ")) {
        currentCategory = trimmed.substring(4).trim();
      }
      continue;
    }

    // Parse component links: - [Button](/docs/react/components/button): Description
    const match = trimmed.match(/^- \[([^\]]+)\]\(([^)]+)\)(?:\s*:\s*(.+))?$/);
    if (match) {
      const [, title, url, description] = match;

      // Only include component URLs
      if (url.startsWith("/docs/react/components/")) {
        components.push({
          title,
          url,
          description,
          category: currentCategory || undefined,
        });
      }
    }
  }

  return components;
}

/**
 * Parse llms.txt content and extract all documentation URLs
 */
export function parseAllDocsFromLlmsTxt(content: string): DocUrl[] {
  const docs: DocUrl[] = [];
  const lines = content.split("\n");
  let currentCategory: string | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines and headers
    if (!trimmed || trimmed.startsWith("#")) {
      // Extract category from headers
      if (trimmed.startsWith("### ")) {
        currentCategory = trimmed.substring(4).trim();
      }
      continue;
    }

    // Parse doc links: - [Title](/docs/react/...): Description
    const match = trimmed.match(/^- \[([^\]]+)\]\(([^)]+)\)(?:\s*:\s*(.+))?$/);
    if (match) {
      const [, title, url, description] = match;

      // Extract path from URL (handle both full URLs and relative paths)
      let path = url;
      if (url.startsWith("https://v3.heroui.com")) {
        path = url.replace("https://v3.heroui.com", "");
      }

      // Include all React docs
      if (path.startsWith("/docs/react/")) {
        docs.push({
          title,
          url: path,
          description,
          category: currentCategory || undefined,
        });
      }
    }
  }

  return docs;
}
