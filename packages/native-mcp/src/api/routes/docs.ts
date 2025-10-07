/**
 * Documentation endpoints
 * Note: Native docs are fetched from GitHub markdown files
 */

import type {Env} from "../types";

import {Hono} from "hono";

import {CACHE_CONTROL} from "../constants";
import {getDataService} from "../services";

const docs = new Hono<{Bindings: Env}>();

// Types for documentation structure
interface DocSection {
  title: string;
  path: string;
  description: string;
}

interface DocCategory {
  name: string;
  docs: DocSection[];
}

// Get available documentation paths from GitHub README
// Only extracts links from ### sections within ## Documentation and ## Changelog
docs.get("/available", async (c) => {
  try {
    // Fetch README.md from heroui-native repository
    const branch = "alpha";
    const readmeUrl = `https://raw.githubusercontent.com/heroui-inc/heroui-native/refs/heads/${branch}/README.md`;
    const response = await fetch(readmeUrl);

    if (!response.ok) {
      return c.json(
        {
          error: "Failed to fetch documentation list",
          status: response.status,
        },
        404,
      );
    }

    const content = await response.text();

    // Parse the README to extract documentation structure
    const categories: DocCategory[] = [];
    let currentCategory: DocCategory | null = null;

    const lines = content.split("\n");
    let inDocumentationSection = false;
    let inChangelogSection = false;

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Track when we enter the Documentation section
      if (trimmedLine === "## Documentation") {
        inDocumentationSection = true;
        inChangelogSection = false;
        continue;
      }

      // Track when we enter the Changelog section
      if (trimmedLine === "## Changelog") {
        inDocumentationSection = false;
        inChangelogSection = true;
        // Add changelog link as its own category
        categories.push({
          name: "Changelog",
          docs: [
            {
              title: "Changelog",
              path: "/docs/changelog",
              description: "History of changes to HeroUI Native",
            },
          ],
        });
        continue;
      }

      // Exit both sections when we hit another ## heading
      if (trimmedLine.startsWith("## ") &&
          trimmedLine !== "## Documentation" &&
          trimmedLine !== "## Changelog") {
        inDocumentationSection = false;
        inChangelogSection = false;
        continue;
      }

      // Only process ### sections within Documentation or Changelog
      if (!inDocumentationSection && !inChangelogSection) {
        continue;
      }

      // Category header (starts with ###) - only within allowed sections
      if (trimmedLine.startsWith("### ")) {
        const categoryName = trimmedLine.substring(4).trim();
        currentCategory = {
          name: categoryName,
          docs: [],
        };
        categories.push(currentCategory);
      }
      // Documentation entry (starts with -) - only within allowed sections
      else if (trimmedLine.startsWith("- [") && currentCategory) {
        // Parse format: - [Title](path) - Description
        // or: - [Title](path)
        const match = trimmedLine.match(/^- \[([^\]]+)\]\(([^)]+)\)(?:\s*-\s*(.+))?$/);
        if (match) {
          const [, title, githubPath, description = ""] = match;

          // Convert GitHub path to doc path
          let docPath = "";
          if (githubPath.includes("/providers/")) {
            // Core documentation
            if (githubPath.includes("provider.md")) {
              docPath = "/docs/core/provider";
            } else if (githubPath.includes("theme.md#custom-fonts")) {
              docPath = "/docs/core/custom-fonts";
            } else if (githubPath.includes("theme.md")) {
              docPath = "/docs/core/theming";
            }
          } else if (githubPath.includes("/components/")) {
            // Component documentation
            const componentName = githubPath.match(/\/components\/([^/]+)\//)?.[1];
            if (componentName) {
              docPath = `/docs/components/${componentName}`;
            }
          }

          if (docPath) {
            currentCategory.docs.push({
              title,
              path: docPath,
              description: description || title,
            });
          }
        }
      }
    }

    // Set cache headers
    c.header("Cache-Control", CACHE_CONTROL.VERSIONED);

    return c.json({
      baseUrl: "https://github.com/heroui-inc/heroui-native",
      categories,
      total: categories.reduce((acc, cat) => acc + cat.docs.length, 0),
    });
  } catch (error) {
    console.error("Error fetching available docs:", error);

    return c.json(
      {
        error: "Internal server error while fetching documentation list",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

// Helper function to convert doc path to GitHub file path
function getGithubPath(docPath: string): string | null {
  const pathMap: Record<string, string> = {
    "/docs/core/provider": "src/providers/hero-ui-native/provider.md",
    "/docs/core/theming": "src/providers/theme/theme.md",
    "/docs/core/custom-fonts": "src/providers/theme/theme.md",
    "/docs/changelog": "CHANGELOG.md",
  };

  // Check direct mapping first
  if (pathMap[docPath]) {
    return pathMap[docPath];
  }

  // Handle component paths
  if (docPath.startsWith("/docs/components/")) {
    const componentName = docPath.replace("/docs/components/", "");

    return `src/components/${componentName}/${componentName}.md`;
  }

  return null;
}

// Get documentation content from GitHub
docs.get("/content", async (c) => {
  try {
    const path = c.req.query("path");

    if (!path) {
      return c.json(
        {
          error: "Invalid request",
          details: "path query parameter is required",
        },
        400,
      );
    }

    const githubPath = getGithubPath(path);

    if (!githubPath) {
      return c.json(
        {
          error: "Documentation not found",
          details: `No documentation available for path: ${path}`,
        },
        404,
      );
    }

    // Fetch from GitHub
    const branch = "alpha";
    const githubUrl = `https://raw.githubusercontent.com/heroui-inc/heroui-native/refs/heads/${branch}/${githubPath}`;

    const response = await fetch(githubUrl);

    if (!response.ok) {
      return c.json(
        {
          error: "Failed to fetch documentation",
          details: `GitHub returned ${response.status} for ${githubPath}`,
        },
        404,
      );
    }

    const content = await response.text();

    // Set cache headers
    c.header("Cache-Control", CACHE_CONTROL.VERSIONED);

    return c.json({
      path,
      url: githubUrl
        .replace("raw.githubusercontent.com", "github.com")
        .replace("/refs/heads/", "/blob/"),
      content,
      contentType: "markdown",
    });
  } catch (error) {
    console.error("Error fetching documentation:", error);

    return c.json(
      {
        error: "Failed to fetch documentation",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

// Get documentation for a specific component (legacy endpoint)
docs.get("/:component", async (c) => {
  try {
    const componentName = c.req.param("component");
    const version = c.req.query("version");
    const service = await getDataService(c.env);

    const results = await service.getComponents([componentName], version);
    const latestVersion = await service.getLatestVersion();

    if (!results[0].data) {
      return c.json(
        {
          error: "Documentation not found",
          details: `No documentation available for component: ${componentName}`,
        },
        404,
      );
    }

    const component = results[0].data;

    // Format documentation as markdown
    let documentation = `# ${componentName}\n\n`;

    if (component.description) {
      documentation += `${component.description}\n\n`;
    }

    // Add import statement
    documentation += `## Import\n\n`;
    documentation += "```tsx\n";
    documentation += `import { ${componentName} } from 'heroui-native';\n`;
    documentation += "```\n\n";

    // Add props section
    if (component.props && Object.keys(component.props).length > 0) {
      documentation += `## Props\n\n`;
      documentation += "| Prop | Type | Default | Required | Description |\n";
      documentation += "|------|------|---------|----------|-------------|\n";

      Object.entries(component.props).forEach(([propName, prop]: [string, any]) => {
        const defaultVal = prop.default ? `\`${prop.default}\`` : "-";
        const required = prop.required ? "Yes" : "No";
        const description = prop.description || "-";

        documentation += `| ${propName} | \`${prop.type}\` | ${defaultVal} | ${required} | ${description} |\n`;
      });

      documentation += "\n";
    }

    // Add sub-components section
    if (component.subComponents && Object.keys(component.subComponents).length > 0) {
      documentation += `## Sub-components\n\n`;
      Object.values(component.subComponents).forEach((sub: any) => {
        documentation += `- **${sub.name}**: ${sub.description || "Sub-component"}\n`;
      });
      documentation += "\n";
    }

    // Add examples section
    if (component.examples && component.examples.length > 0) {
      documentation += `## Examples\n\n`;
      component.examples.forEach((example: any) => {
        documentation += `### ${example.name}\n\n`;
        documentation += "```tsx\n";
        documentation += example.code || example.content || "";
        documentation += "\n```\n\n";
      });
    }

    // Add anatomy if available
    if (component.anatomy) {
      documentation += `## Component Anatomy\n\n`;
      documentation += "```tsx\n";
      documentation += component.anatomy;
      documentation += "\n```\n\n";
    }

    // Set cache headers
    c.header("Cache-Control", version ? CACHE_CONTROL.VERSIONED : CACHE_CONTROL.LATEST);

    return c.json({
      component: componentName,
      documentation,
      version: version || latestVersion || "unknown",
      latestVersion: latestVersion || "unknown",
    });
  } catch (error) {
    console.error("Error getting component documentation:", error);

    return c.json(
      {
        error: "Failed to get documentation",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

export {docs};
