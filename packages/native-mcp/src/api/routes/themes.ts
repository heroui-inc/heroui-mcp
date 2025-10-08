/**
 * Theme-related API endpoints
 */

import type {Env} from "../types";

import {Hono} from "hono";

import {CACHE_CONTROL} from "../constants";
import {getAnalytics, getThemeService, initAnalytics} from "../services";

const themes = new Hono<{Bindings: Env}>();

// Get all themes list
themes.get("/", async (c) => {
  try {
    const version = c.req.query("version");
    const startTime = Date.now();
    initAnalytics(c.env);
    const analytics = getAnalytics();

    const service = await getThemeService(c.env);
    const themeSystem = await service.getThemeSystem(version);
    const latestVersion = await service.getLatestVersion();

    if (!themeSystem) {
      return c.json(
        {
          error: "Theme system not found",
          details: version ? `No theme data for version ${version}` : "No theme data available",
        },
        404,
      );
    }

    const actualVersion = version || latestVersion || "unknown";
    const responseTime = Date.now() - startTime;

    analytics?.trackFeatureUsage("api-user", "theme-list", {
      version: actualVersion,
      responseTime,
    });

    // Set cache headers
    c.header("Cache-Control", version ? CACHE_CONTROL.VERSIONED : CACHE_CONTROL.LATEST);

    return c.json({
      version: actualVersion,
      themes: Object.keys(themeSystem.themes),
      latestVersion: latestVersion || "unknown",
    });
  } catch (error) {
    console.error("Error getting themes:", error);

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
  try {
    const themeName = c.req.query("theme") || "default";
    const mode = c.req.query("mode") as "light" | "dark" | undefined;
    const version = c.req.query("version");
    const startTime = Date.now();
    initAnalytics(c.env);
    const analytics = getAnalytics();

    const service = await getThemeService(c.env);
    const latestVersion = await service.getLatestVersion();
    const actualVersion = version || latestVersion || "unknown";

    const theme = await service.getTheme(themeName, version);

    if (!theme) {
      return c.json(
        {error: `Theme "${themeName}" not found${version ? ` for version ${version}` : ""}`},
        404,
      );
    }

    const responseTime = Date.now() - startTime;

    analytics?.trackFeatureUsage("api-user", "theme-variables", {
      theme: themeName,
      mode: mode || "both",
      version: actualVersion,
      responseTime,
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
    console.error("Error getting theme variables:", error);

    return c.json(
      {
        error: "Failed to get theme variables",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

// Get available versions
themes.get("/versions", async (c) => {
  try {
    const startTime = Date.now();
    initAnalytics(c.env);
    const analytics = getAnalytics();

    const service = await getThemeService(c.env);
    const latestVersion = await service.getLatestVersion();

    const responseTime = Date.now() - startTime;

    analytics?.trackFeatureUsage("api-user", "theme-versions", {
      responseTime,
    });

    return c.json({
      latest: latestVersion || "unknown",
      versions: [latestVersion || "unknown"],
    });
  } catch (error) {
    console.error("Error getting theme versions:", error);

    return c.json(
      {
        error: "Failed to get theme versions",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

export {themes};
