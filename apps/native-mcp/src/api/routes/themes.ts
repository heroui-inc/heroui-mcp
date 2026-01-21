import type {HonoContext} from "../types/context";

import {Hono} from "hono";

import {getThemeService} from "../services/theme";
import {AnalyticsErrorEvent, AnalyticsEvent} from "../types/analytics";

const themes = new Hono<HonoContext>();

// Get theme variables - always returns default theme with both modes
themes.get("/variables", async (c) => {
  const endpoint = "get-theme-variables";
  const startTime = Date.now();
  const analytics = c.get("analytics");

  try {
    const service = await getThemeService(c.env);
    const latestVersion = (await service.getLatestVersion()) || "unknown";

    // Always return default theme with both modes
    const themeName = "default";
    const themeData = await service.getTheme(themeName);
    if (!themeData) {
      return c.json({error: `Theme ${themeName} not found`}, 404);
    }

    analytics.track({
      event: AnalyticsEvent.GET_THEME_VARIABLES,
      properties: {
        endpoint,
        apiVersion: "v1",
        theme: themeName,
        mode: "both",
        latestVersion,
        responseTime: Date.now() - startTime,
      },
    });

    return c.json({
      theme: themeName,
      light: themeData.light,
      dark: themeData.dark,
      borderRadius: themeData.borderRadius,
      opacity: themeData.opacity,
      latestVersion,
    });
  } catch (error) {
    analytics.trackError({
      error,
      errorEvent: AnalyticsErrorEvent.GET_THEME_VARIABLES_ERROR,
      fallbackMessage: "Failed to get theme variables",
      properties: {
        endpoint,
        apiVersion: "v1",
        responseTime: Date.now() - startTime,
      },
    });

    return c.json(
      {
        error: "Failed to get theme variables",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

export {themes};
