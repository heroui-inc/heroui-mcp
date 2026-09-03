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

const HEROUI_ORIGIN = /^https?:\/\/(?:www\.)?heroui\.com/;
const LOCALE_SEGMENT = /^\/([a-z]{2})(?=\/)/;
const DEFAULT_LOCALE = "en";

/**
 * Turn an llms.txt link into a locale-less docs path.
 *
 * The docs site serves every page under a locale prefix (e.g. /en/docs/react/button),
 * so only the default locale is kept — otherwise each translated page would duplicate
 * its English counterpart in the extracted dataset.
 */
function toDocPath(url: string): string | null {
  const path = url.replace(HEROUI_ORIGIN, "");
  const locale = path.match(LOCALE_SEGMENT);

  if (!locale) {
    return path;
  }

  return locale[1] === DEFAULT_LOCALE ? path.slice(locale[0].length) : null;
}

/**
 * Parse llms.txt content and extract component URLs only
 */
export function parseLlmsTxt(content: string): ComponentUrl[] {
  return parseAllDocsFromLlmsTxt(content).filter((doc) =>
    doc.url.startsWith("/docs/react/components/"),
  ) as ComponentUrl[];
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

    // Parse doc links: - [Title](https://heroui.com/en/docs/react/...): Description
    const match = trimmed.match(/^- \[([^\]]+)\]\(([^)]+)\)(?:\s*:\s*(.+))?$/);
    if (match) {
      const [, title, url, description] = match;

      const path = toDocPath(url);

      // Include all React docs
      if (path?.startsWith("/docs/react/")) {
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
