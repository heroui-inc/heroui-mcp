/* eslint-disable @typescript-eslint/no-explicit-any */
import type {HonoContext} from "../types/context";

import {Hono} from "hono";

import {getThemeService} from "../services/theme";
import {AnalyticsErrorEvent, AnalyticsEvent} from "../types/analytics";
import {getApp} from "../utils/get-client";

const themes = new Hono<HonoContext>();

// Get theme variables - always returns default theme with both modes
themes.get("/variables", async (c) => {
  const endpoint = "get-theme-variables";
  const startTime = Date.now();
  const analytics = c.get("analytics");
  const app = getApp(c);

  try {
    const service = await getThemeService(c.env);
    const latestVersion = await service.getLatestVersion();

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
        app,
        theme: themeName,
        mode: "both",
        latestVersion,
        responseTime: Date.now() - startTime,
      },
    });

    const optimized = (themeData as any).optimized;
    if (optimized) {
      return c.json({
        theme: themeName,
        common: optimized.common,
        light: optimized.light,
        dark: optimized.dark,
        latestVersion,
      });
    }

    const common = {
      base: themeData.light.base,
      calculated: themeData.light.calculated,
    };

    return c.json({
      theme: themeName,
      common,
      light: {
        semantic: themeData.light.semantic,
      },
      dark: {
        semantic: themeData.dark.semantic,
      },
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
        app,
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
