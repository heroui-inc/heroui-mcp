import type {HonoContext} from "../../types/context";

import {Hono} from "hono";

import {AnalyticsErrorEvent, AnalyticsEvent} from "../../types/analytics";
import {getLegacyComponentService} from "../services/component-adapter";
import {getLegacyThemeService} from "../services/theme-adapter";

const ctx = new Hono<HonoContext>();

// Get initialization context (components, themes, examples, docs paths)
ctx.get("/", async (c) => {
  const endpoint = "get-ctx";
  const startTime = Date.now();
  const analytics = c.get("analytics");

  try {
    const componentService = await getLegacyComponentService(c.env);
    const themeService = await getLegacyThemeService(c.env);

    // Fetch all context data in parallel
    const [components, examples, themes, docsResponse, version] = await Promise.allSettled([
      componentService.listComponents(),
      componentService.listExamples(),
      themeService.getAvailableThemes(),
      fetch("https://raw.githubusercontent.com/heroui-inc/heroui-native/beta/README.md").then(
        (res) => res.text(),
      ),
      componentService.getLatestVersion(),
    ]);

    // Extract component list
    const componentList = components.status === "fulfilled" ? components.value : [];

    // Extract examples list
    const exampleList = examples.status === "fulfilled" ? examples.value : [];

    // Extract theme list
    const themeList = themes.status === "fulfilled" ? themes.value : ["default"];

    // Parse documentation paths (simple extraction from README)
    const docPaths: string[] = [];

    if (docsResponse.status === "fulfilled") {
      const content = docsResponse.value;
      const lines = content.split("\n");
      let inDocSection = false;
      let inChangelogSection = false;

      for (const line of lines) {
        const trimmedLine = line.trim();

        // Track if we're in Documentation or Changelog sections
        if (trimmedLine.startsWith("## Documentation")) {
          inDocSection = true;
          inChangelogSection = false;
          continue;
        } else if (trimmedLine.startsWith("## Changelog")) {
          inChangelogSection = true;
          inDocSection = false;
          continue;
        } else if (trimmedLine.startsWith("## ") && !trimmedLine.startsWith("### ")) {
          // Reset when hitting another main section
          inDocSection = false;
          inChangelogSection = false;
        }

        // Extract links from these sections
        if (inDocSection || inChangelogSection) {
          // Match markdown links: [text](url)
          const linkMatches = trimmedLine.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g);
          for (const match of linkMatches) {
            const url = match[2];
            // Only include GitHub URLs
            if (url.startsWith("https://github.com/heroui-inc/heroui-native")) {
              docPaths.push(url);
            }
          }
        }
      }
    }

    // Extract version
    const latestVersion = version.status === "fulfilled" ? version.value : "unknown";

    analytics.track({
      event: AnalyticsEvent.GET_CTX,
      properties: {
        endpoint,
        apiVersion: "legacy",
        componentsCount: componentList.length,
        examplesCount: exampleList.length,
        themesCount: themeList.length,
        docPathsCount: docPaths.length,
        version: latestVersion,
        responseTime: Date.now() - startTime,
      },
    });

    const response: Record<string, unknown> = {
      components: componentList,
      examples: exampleList,
      themes: themeList,
      docs: {
        paths: docPaths,
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
        apiVersion: "legacy",
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
