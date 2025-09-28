/* eslint-disable @typescript-eslint/no-explicit-any */
import type {Env} from "../types";

import {Hono} from "hono";

import {getAnalytics, getThemeService, initAnalytics} from "../services";

const docs = new Hono<{Bindings: Env}>();

// Get documentation guide
docs.get("/:guide", async (c) => {
  const guideName = c.req.param("guide");
  const startTime = Date.now();
  initAnalytics(c.env);
  const analytics = getAnalytics();

  const validGuides = [
    "theming",
    "colors",
    "styling",
    "animation",
    "composition",
    "design-principles",
    "quick-start",
  ];

  // Convert dash-case to camelCase for the key
  const guideKey = guideName.replace(/-([a-z])/g, (g) => g[1].toUpperCase());

  if (!validGuides.includes(guideName)) {
    return c.json({error: `Invalid guide. Must be one of: ${validGuides.join(", ")}`}, 400);
  }

  try {
    const service = await getThemeService(c.env);
    const guide = await service.getGuide(guideKey as any);

    if (!guide) {
      return c.json({error: `Guide ${guideName} not found`}, 404);
    }

    const responseTime = Date.now() - startTime;
    analytics?.trackFeatureUsage("api-user", "design-guide", {
      guide: guideName,
      responseTime,
    });

    return c.json(guide);
  } catch (error) {
    console.error(`Error getting guide ${guideName}:`, error);

    return c.json(
      {
        error: `Failed to get guide ${guideName}`,
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

export {docs};
