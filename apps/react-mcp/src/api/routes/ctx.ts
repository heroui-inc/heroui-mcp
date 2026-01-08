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

    const [components, themes, docsData, version] = await Promise.allSettled([
      componentService.listComponents(LIBRARY_NAME),
      themeService.getAvailableThemes(),
      componentService.getDocsPaths(),
      componentService.getLatestVersion(LIBRARY_NAME),
    ]);

    const componentList = components.status === "fulfilled" ? components.value : [];
    const themeList = themes.status === "fulfilled" ? themes.value : ["default"];

    let docPaths: string[] = [];
    let docCategories: DocCategory[] = [];
    if (docsData.status === "fulfilled" && docsData.value) {
      docCategories = docsData.value.categories;
      docPaths = docsData.value.paths;
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
