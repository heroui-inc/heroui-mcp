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
    const version = c.req.query("version");

    const service = await getThemeService(c.env);
    const themeSystem = await service.getThemeSystem(version);
    const latestVersion = await service.getLatestVersion();

    if (!themeSystem) {
      analytics.trackError({
        error: "Theme system not found",
        errorEvent: AnalyticsErrorEvent.GET_THEMES_ERROR,
        properties: {
          endpoint,
          version,
          responseTime: Date.now() - startTime,
        },
      });

      return c.json(
        {
          error: "Theme system not found",
          details: version ? `No theme data for version ${version}` : "No theme data available",
        },
        404,
      );
    }

    const actualVersion = version || latestVersion || "unknown";

    analytics.track({
      event: AnalyticsEvent.GET_THEMES,
      properties: {
        endpoint,
        version: actualVersion,
        themes: Object.keys(themeSystem.themes),
        latestVersion: latestVersion || "unknown",
        responseTime: Date.now() - startTime,
      },
    });

    // Set cache headers
    c.header("Cache-Control", version ? CACHE_CONTROL.VERSIONED : CACHE_CONTROL.LATEST);

    return c.json({
      version: actualVersion,
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
  let version: string | undefined;

  try {
    themeName = c.req.query("theme") || "default";
    mode = c.req.query("mode") as "light" | "dark" | undefined;
    version = c.req.query("version");

    const service = await getThemeService(c.env);
    const latestVersion = await service.getLatestVersion();
    const actualVersion = version || latestVersion || "unknown";

    const theme = await service.getTheme(themeName, version);

    if (!theme) {
      analytics.trackError({
        error: `Theme not found`,
        errorEvent: AnalyticsErrorEvent.GET_THEME_VARIABLES_ERROR,
        properties: {
          endpoint,
          themeName,
          version: actualVersion,
          latestVersion: latestVersion || "unknown",
          responseTime: Date.now() - startTime,
        },
      });

      return c.json(
        {error: `Theme "${themeName}" not found${version ? ` for version ${version}` : ""}`},
        404,
      );
    }

    analytics.track({
      event: AnalyticsEvent.GET_THEME_VARIABLES,
      properties: {
        endpoint,
        theme: themeName,
        mode: mode || "both",
        version: actualVersion,
        latestVersion: latestVersion || "unknown",
        responseTime: Date.now() - startTime,
      },
    });

    // Set cache headers
    c.header("Cache-Control", version ? CACHE_CONTROL.VERSIONED : CACHE_CONTROL.LATEST);

    // Return filtered by mode
    if (mode === "light") {
      return c.json({
        theme: themeName,
        mode: "light",
        colors: theme.light.colors,
        version: actualVersion,
        latestVersion: latestVersion || "unknown",
      });
    } else if (mode === "dark") {
      return c.json({
        theme: themeName,
        mode: "dark",
        colors: theme.dark.colors,
        version: actualVersion,
        latestVersion: latestVersion || "unknown",
      });
    } else {
      // Return both modes
      return c.json({
        theme: themeName,
        light: theme.light,
        dark: theme.dark,
        borderRadius: theme.borderRadius,
        opacity: theme.opacity,
        version: actualVersion,
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
        version,
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
