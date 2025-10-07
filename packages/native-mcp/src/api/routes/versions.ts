/**
 * Version management endpoints
 */

import type {Env} from "../types";

import {Hono} from "hono";

import {getDataService, getThemeService} from "../services";

const versions = new Hono<{Bindings: Env}>();

// Get version information
versions.get("/", async (c) => {
  try {
    const dataService = await getDataService(c.env);
    const themeService = await getThemeService(c.env);

    // Get latest versions for both components and theme
    const componentsVersion = await dataService.getLatestVersion();
    const themeVersion = await themeService.getLatestVersion();
    const availableVersions = await dataService.listVersions();

    return c.json({
      latest: {
        components: componentsVersion || "unknown",
        theme: themeVersion || "unknown",
      },
      available: availableVersions,
      count: availableVersions.length,
    });
  } catch (error) {
    console.error("Error getting versions:", error);

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