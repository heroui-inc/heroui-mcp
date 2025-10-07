/**
 * Theme-related API endpoints
 */

import type {Env} from "../types";

import {Hono} from "hono";

import {CACHE_CONTROL} from "../constants";
import {getThemeService} from "../services";

const themes = new Hono<{Bindings: Env}>();

// Get theme system
themes.get("/", async (c) => {
  try {
    const version = c.req.query("version");
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

    // Set cache headers
    c.header("Cache-Control", version ? CACHE_CONTROL.VERSIONED : CACHE_CONTROL.LATEST);

    return c.json({
      ...themeSystem,
      requestedVersion: version,
      actualVersion: version || latestVersion || "unknown",
      latestVersion: latestVersion || "unknown",
    });
  } catch (error) {
    console.error("Error getting theme system:", error);

    return c.json(
      {
        error: "Failed to get theme system",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

// Get theme colors
themes.get("/colors", async (c) => {
  try {
    const version = c.req.query("version");
    const service = await getThemeService(c.env);

    const themeSystem = await service.getThemeSystem(version);
    const latestVersion = await service.getLatestVersion();

    if (!themeSystem) {
      return c.json(
        {
          error: "Theme colors not found",
          details: version ? `No theme data for version ${version}` : "No theme data available",
        },
        404,
      );
    }

    // Extract color variables from shared variables
    const colorVariables = themeSystem.sharedVariables.filter(
      (v) => v.category === "colors" || v.name.includes("color"),
    );

    // Set cache headers
    c.header("Cache-Control", version ? CACHE_CONTROL.VERSIONED : CACHE_CONTROL.LATEST);

    return c.json({
      colors: colorVariables,
      count: colorVariables.length,
      version: version || latestVersion || "unknown",
      latestVersion: latestVersion || "unknown",
    });
  } catch (error) {
    console.error("Error getting theme colors:", error);

    return c.json(
      {
        error: "Failed to get theme colors",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

// Get theme typography
themes.get("/typography", async (c) => {
  try {
    const version = c.req.query("version");
    const service = await getThemeService(c.env);

    const themeSystem = await service.getThemeSystem(version);
    const latestVersion = await service.getLatestVersion();

    if (!themeSystem) {
      return c.json(
        {
          error: "Typography system not found",
          details: version ? `No theme data for version ${version}` : "No theme data available",
        },
        404,
      );
    }

    // Extract typography variables from shared variables
    const typographyVariables = themeSystem.sharedVariables.filter(
      (v) =>
        v.category === "typography" ||
        v.name.includes("font") ||
        v.name.includes("text") ||
        v.name.includes("line-height"),
    );

    // Set cache headers
    c.header("Cache-Control", version ? CACHE_CONTROL.VERSIONED : CACHE_CONTROL.LATEST);

    return c.json({
      typography: typographyVariables,
      count: typographyVariables.length,
      version: version || latestVersion || "unknown",
      latestVersion: latestVersion || "unknown",
    });
  } catch (error) {
    console.error("Error getting typography:", error);

    return c.json(
      {
        error: "Failed to get typography system",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

// Get theme spacing
themes.get("/spacing", async (c) => {
  try {
    const version = c.req.query("version");
    const service = await getThemeService(c.env);

    const themeSystem = await service.getThemeSystem(version);
    const latestVersion = await service.getLatestVersion();

    if (!themeSystem) {
      return c.json(
        {
          error: "Spacing system not found",
          details: version ? `No theme data for version ${version}` : "No theme data available",
        },
        404,
      );
    }

    // Extract spacing variables from shared variables
    const spacingVariables = themeSystem.sharedVariables.filter(
      (v) =>
        v.category === "spacing" ||
        v.name.includes("spacing") ||
        v.name.includes("padding") ||
        v.name.includes("margin") ||
        v.name.includes("gap"),
    );

    // Set cache headers
    c.header("Cache-Control", version ? CACHE_CONTROL.VERSIONED : CACHE_CONTROL.LATEST);

    return c.json({
      spacing: spacingVariables,
      count: spacingVariables.length,
      version: version || latestVersion || "unknown",
      latestVersion: latestVersion || "unknown",
    });
  } catch (error) {
    console.error("Error getting spacing:", error);

    return c.json(
      {
        error: "Failed to get spacing system",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

// Get theme variables (raw CSS variables)
themes.get("/variables", async (c) => {
  try {
    const version = c.req.query("version");
    const service = await getThemeService(c.env);

    const themeSystem = await service.getThemeSystem(version);
    const latestVersion = await service.getLatestVersion();

    if (!themeSystem) {
      return c.json(
        {
          error: "Theme variables not found",
          details: version ? `No theme data for version ${version}` : "No theme data available",
        },
        404,
      );
    }

    // Return all shared variables
    const variables = themeSystem.sharedVariables;

    // Set cache headers
    c.header("Cache-Control", version ? CACHE_CONTROL.VERSIONED : CACHE_CONTROL.LATEST);

    return c.json({
      variables,
      count: variables.length,
      version: version || latestVersion || "unknown",
      latestVersion: latestVersion || "unknown",
    });
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

export {themes};