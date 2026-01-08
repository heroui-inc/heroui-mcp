/**
 * Theme-related API endpoints
 */

import type {HonoContext} from "../types/context";

import {Hono} from "hono";

import {CACHE_CONTROL} from "../constants";
import {getThemeService} from "../services/theme";
import {AnalyticsErrorEvent, AnalyticsEvent} from "../types/analytics";

const themes = new Hono<HonoContext>();

// Get all themes list
themes.get("/", async (c) => {
  const endpoint = "get-themes";
  const startTime = Date.now();
  const analytics = c.get("analytics");

  try {
    const service = await getThemeService(c.env);
    const themeSystem = await service.getThemeSystem();
    const latestVersion = await service.getLatestVersion();

    if (!themeSystem) {
      analytics.trackError({
        error: "Theme system not found",
        errorEvent: AnalyticsErrorEvent.GET_THEMES_ERROR,
        properties: {
          endpoint,
          responseTime: Date.now() - startTime,
        },
      });

      return c.json({error: "Theme system not found"}, 404);
    }

    analytics.track({
      event: AnalyticsEvent.GET_THEMES,
      properties: {
        endpoint,
        themes: Object.keys(themeSystem.themes),
        latestVersion: latestVersion || "unknown",
        responseTime: Date.now() - startTime,
      },
    });

    c.header("Cache-Control", CACHE_CONTROL.LATEST);

    return c.json({
      version: latestVersion || themeSystem.version || "latest",
      themes: Object.keys(themeSystem.themes),
      latestVersion: latestVersion || "unknown",
    });
  } catch (error) {
    analytics.trackError({
      error,
      errorEvent: AnalyticsErrorEvent.GET_THEMES_ERROR,
      fallbackMessage: "Failed to get themes",
      properties: {
        endpoint,
        responseTime: Date.now() - startTime,
      },
    });

    return c.json(
      {
        error: "Failed to get themes",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

// Get theme variables with dynamic filtering
themes.get("/variables", async (c) => {
  const endpoint = "get-theme-variables";
  const startTime = Date.now();
  const analytics = c.get("analytics");

  let themeName: string | undefined;
  let mode: "light" | "dark" | undefined;

  try {
    themeName = c.req.query("theme") || "default";
    mode = c.req.query("mode") as "light" | "dark" | undefined;

    const service = await getThemeService(c.env);
    const latestVersion = await service.getLatestVersion();

    const theme = await service.getTheme(themeName);

    if (!theme) {
      analytics.trackError({
        error: `Theme not found`,
        errorEvent: AnalyticsErrorEvent.GET_THEME_VARIABLES_ERROR,
        properties: {
          endpoint,
          themeName,
          latestVersion: latestVersion || "unknown",
          responseTime: Date.now() - startTime,
        },
      });

      return c.json({error: `Theme "${themeName}" not found`}, 404);
    }

    analytics.track({
      event: AnalyticsEvent.GET_THEME_VARIABLES,
      properties: {
        endpoint,
        theme: themeName,
        mode: mode || "both",
        latestVersion: latestVersion || "unknown",
        responseTime: Date.now() - startTime,
      },
    });

    c.header("Cache-Control", CACHE_CONTROL.LATEST);

    if (mode === "light") {
      return c.json({
        theme: themeName,
        mode: "light",
        colors: theme.light.colors,
        latestVersion: latestVersion || "unknown",
      });
    } else if (mode === "dark") {
      return c.json({
        theme: themeName,
        mode: "dark",
        colors: theme.dark.colors,
        latestVersion: latestVersion || "unknown",
      });
    } else {
      return c.json({
        theme: themeName,
        light: theme.light,
        dark: theme.dark,
        borderRadius: theme.borderRadius,
        opacity: theme.opacity,
        latestVersion: latestVersion || "unknown",
      });
    }
  } catch (error) {
    analytics.trackError({
      error,
      errorEvent: AnalyticsErrorEvent.GET_THEME_VARIABLES_ERROR,
      fallbackMessage: "Failed to get theme variables",
      properties: {
        endpoint,
        responseTime: Date.now() - startTime,
        themeName,
        mode,
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
