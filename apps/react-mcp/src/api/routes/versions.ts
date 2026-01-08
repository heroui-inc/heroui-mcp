import type {HonoContext} from "../types/context";

import {Hono} from "hono";

import packageJson from "../../../package.json";
import {getComponentService} from "../services/component";
import {AnalyticsErrorEvent, AnalyticsEvent} from "../types/analytics";

const versions = new Hono<HonoContext>();

// Get version information
versions.get("/", async (c) => {
  const endpoint = "get-versions";
  const startTime = Date.now();
  const analytics = c.get("analytics");

  try {
    const service = await getComponentService(c.env);
    const latestVersion = (await service.getLatestVersion("heroui-react")) || "latest";

    analytics.track({
      event: AnalyticsEvent.GET_VERSIONS,
      properties: {
        endpoint,
        latestVersion,
        mcpVersion: packageJson.version,
        responseTime: Date.now() - startTime,
      },
    });

    return c.json({
      herouiReact: {
        latest: latestVersion,
        versions: [latestVersion],
      },
      mcp: {
        current: packageJson.version,
      },
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
