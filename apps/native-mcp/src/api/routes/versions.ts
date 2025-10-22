/**
 * Version management endpoints
 */

import type {HonoContext} from "../types/context";

import {Hono} from "hono";

import {getComponentService} from "../services/component";
import {getThemeService} from "../services/theme";
import {AnalyticsErrorEvent, AnalyticsEvent} from "../types/analytics";

const versions = new Hono<HonoContext>();

// Get version information
versions.get("/", async (c) => {
  const endpoint = "get-versions";
  const startTime = Date.now();
  const analytics = c.get("analytics");

  try {
    const dataService = await getComponentService(c.env);
    const themeService = await getThemeService(c.env);

    // Get latest versions for both components and theme
    const componentsVersion = await dataService.getLatestVersion();
    const themeVersion = await themeService.getLatestVersion();
    const availableVersions = await dataService.listVersions();

    analytics.track({
      event: AnalyticsEvent.GET_VERSIONS,
      properties: {
        endpoint,
        componentsVersion,
        themeVersion,
        availableCount: availableVersions.length,
        responseTime: Date.now() - startTime,
      },
    });

    return c.json({
      latest: {
        components: componentsVersion || "unknown",
        theme: themeVersion || "unknown",
      },
      available: availableVersions,
      count: availableVersions.length,
    });
  } catch (error) {
    analytics.trackError({
      error,
      errorEvent: AnalyticsErrorEvent.GET_VERSIONS_ERROR,
      fallbackMessage: "Failed to get version information",
      properties: {
        endpoint,
        responseTime: Date.now() - startTime,
      },
    });

    return c.json(
      {
        error: "Failed to get version information",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

export {versions};
