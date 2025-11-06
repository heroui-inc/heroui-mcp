import type {HonoContext} from "../types/context";

import {Hono} from "hono";

import {REACT_LIBRARY_NAME} from "../contants";
import {getComponentService} from "../services/component";
import {getThemeService} from "../services/theme";
import {AnalyticsErrorEvent, AnalyticsEvent} from "../types/analytics";

const ctx = new Hono<HonoContext>();

const LIBRARY_NAME = REACT_LIBRARY_NAME;

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

// Get initialization context (components, themes, docs paths)
ctx.get("/", async (c) => {
  const endpoint = "get-ctx";
  const startTime = Date.now();
  const analytics = c.get("analytics");

  try {
    const componentService = await getComponentService(c.env);
    const themeService = await getThemeService(c.env);

    // Fetch all context data in parallel
    const [components, themes, docsResponse, version] = await Promise.allSettled([
      componentService.listComponents(LIBRARY_NAME),
      themeService.getAvailableThemes(),
      fetch("https://v3.heroui.com/llms.txt").then((res) => res.text()),
      componentService.getLatestVersion(LIBRARY_NAME),
    ]);

    // Extract component list
    const componentList = components.status === "fulfilled" ? components.value : [];

    // Extract theme list
    const themeList = themes.status === "fulfilled" ? themes.value : ["default"];

    // Parse documentation paths
    let docPaths: string[] = [];
    let docCategories: DocCategory[] = [];

    if (docsResponse.status === "fulfilled") {
      const content = docsResponse.value;
      const categories: DocCategory[] = [];
      let currentCategory: DocCategory | null = null;

      const lines = content.split("\n");

      for (const line of lines) {
        const trimmedLine = line.trim();

        // Skip empty lines and main headers
        if (!trimmedLine || trimmedLine === "# Docs") continue;

        // Category header (starts with ##)
        if (trimmedLine.startsWith("## ")) {
          const categoryName = trimmedLine.substring(3).trim();
          currentCategory = {
            name: categoryName,
            docs: [],
          };
          categories.push(currentCategory);
        }
        // Documentation entry (starts with -)
        else if (trimmedLine.startsWith("- ") && currentCategory) {
          // Parse format: - [Title](path): Description
          const match = trimmedLine.match(/^- \[([^\]]+)\]\(([^)]+)\)(?:\s*:\s*(.+))?$/);
          if (match) {
            const [, title, path, description = ""] = match;
            currentCategory.docs.push({
              title,
              path,
              description,
            });
          }
        }
      }

      docCategories = categories;
      docPaths = categories.flatMap((cat) => cat.docs.map((doc) => doc.path));
    }

    // Extract version
    const latestVersion = version.status === "fulfilled" ? version.value : "unknown";

    analytics.track({
      event: AnalyticsEvent.GET_CTX,
      properties: {
        endpoint,
        componentsCount: componentList.length,
        themesCount: themeList.length,
        docPathsCount: docPaths.length,
        version: latestVersion,
        responseTime: Date.now() - startTime,
      },
    });

    const response: Record<string, unknown> = {
      components: componentList,
      themes: themeList,
      docs: {
        paths: docPaths,
        categories: docCategories,
      },
      version: latestVersion || "unknown",
      timestamp: Date.now(),
    };

    // Add user ID if authenticated (from auth middleware)
    const userId = c.get("userId");
    if (userId) {
      response.userId = userId;
    }

    return c.json(response);
  } catch (error) {
    analytics.trackError({
      error,
      errorEvent: AnalyticsErrorEvent.GET_CTX_ERROR,
      fallbackMessage: "Failed to get initialization context",
      properties: {
        endpoint,
        responseTime: Date.now() - startTime,
      },
    });

    return c.json(
      {
        error: "Failed to get initialization context",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

export {ctx};
