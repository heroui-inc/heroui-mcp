import type {HonoContext} from "../types/context";

import {Hono} from "hono";

import {getComponentService} from "../services/component";
import {getThemeService} from "../services/theme";
import {AnalyticsErrorEvent, AnalyticsEvent} from "../types/analytics";

const ctx = new Hono<HonoContext>();

// Get initialization context (components, themes, examples, docs paths)
ctx.get("/", async (c) => {
  const endpoint = "get-ctx";
  const startTime = Date.now();
  const analytics = c.get("analytics");

  try {
    const componentService = await getComponentService(c.env);
    const themeService = await getThemeService(c.env);

    // Fetch all context data in parallel
    const [components, examples, themes, docsResponse, version] = await Promise.allSettled([
      componentService.listComponents(),
      componentService.listExamples(),
      themeService.getAvailableThemes(),
      fetch("https://v3.heroui.com/native/llms.txt").then((res) => res.text()),
      componentService.getLatestVersion(),
    ]);

    // Extract component list
    const componentList = components.status === "fulfilled" ? components.value : [];

    // Extract examples list
    const exampleList = examples.status === "fulfilled" ? examples.value : [];

    // Extract theme list
    const themeList = themes.status === "fulfilled" ? themes.value : ["default"];

    // Parse documentation paths from llms.txt
    const docPaths: string[] = [];

    if (docsResponse.status === "fulfilled") {
      const content = docsResponse.value;
      const lines = content.split("\n");

      for (const line of lines) {
        const trimmedLine = line.trim();

        // Skip empty lines and main headers
        if (!trimmedLine || trimmedLine === "# Docs") continue;

        // Match documentation entries: - [Title](https://v3.heroui.com/docs/native/...)
        if (trimmedLine.startsWith("- ")) {
          const match = trimmedLine.match(/^- \[([^\]]+)\]\(([^)]+)\)/);
          if (match) {
            const url = match[2];
            // Only include Native documentation URLs
            if (url.includes("/docs/native/")) {
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
