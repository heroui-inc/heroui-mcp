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

    const [components, examples, themes, docsData, version] = await Promise.allSettled([
      componentService.listComponents(),
      componentService.listExamples(),
      themeService.getAvailableThemes(),
      componentService.getDocsPaths(),
      componentService.getLatestVersion(),
    ]);

    const componentList = components.status === "fulfilled" ? components.value : [];
    const exampleList = examples.status === "fulfilled" ? examples.value : [];
    const themeList = themes.status === "fulfilled" ? themes.value : ["default"];

    const docPaths: string[] = [];
    if (docsData.status === "fulfilled" && docsData.value) {
      docPaths.push(...docsData.value.paths);
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
