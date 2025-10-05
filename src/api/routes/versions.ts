import type {Env} from "../types";

import {Hono} from "hono";

import packageJson from "../../../package.json";
import {getAnalytics, getDataService, initAnalytics} from "../services";

const versions = new Hono<{Bindings: Env}>();

// Get version information
versions.get("/", async (c) => {
  const startTime = Date.now();
  initAnalytics(c.env);
  const analytics = getAnalytics();

  try {
    const service = await getDataService(c.env);
    const heroUIVersions = await service.listVersions("heroui");

    const responseTime = Date.now() - startTime;

    analytics?.trackFeatureUsage("api-user", "version-check", {
      endpoint: "all-versions",
      responseTime,
    });

    return c.json({
      heroui: {
        latest: heroUIVersions[0] || "unknown",
        versions: heroUIVersions,
      },
      mcp: {
        current: packageJson.version,
      },
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

// Check specific package version
versions.get("/:package", async (c) => {
  const pkg = c.req.param("package");
  const startTime = Date.now();
  initAnalytics(c.env);
  const analytics = getAnalytics();

  if (!["heroui", "mcp"].includes(pkg)) {
    return c.json({error: "Invalid package. Must be 'heroui' or 'mcp'"}, 400);
  }

  try {
    if (pkg === "mcp") {
      return c.json({
        package: "mcp",
        currentVersion: packageJson.version,
        latestVersion: packageJson.version,
        isLatest: true,
      });
    }

    const service = await getDataService(c.env);
    const library = pkg as "heroui";
    const versionList = await service.listVersions(library);
    const latestVersion = versionList[0] || "unknown";

    const responseTime = Date.now() - startTime;

    analytics?.trackFeatureUsage("api-user", "version-check", {
      package: pkg,
      responseTime,
    });

    return c.json({
      package: pkg,
      currentVersion: latestVersion, // In API context, we always serve latest
      latestVersion,
      isLatest: true,
      availableVersions: versionList,
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;

    analytics?.trackToolError("api-user", {
      toolName: "check-version",
      error: error instanceof Error ? error.message : "Unknown error",
      executionTime: responseTime,
    });

    console.error("Error checking version:", error);

    return c.json(
      {
        error: "Failed to check version",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

export {versions};
