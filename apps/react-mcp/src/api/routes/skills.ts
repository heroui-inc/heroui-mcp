import type {HonoContext} from "../types/context";

import {Hono} from "hono";

import {getSkillService} from "../services/skill";
import {AnalyticsErrorEvent, AnalyticsEvent} from "../types/analytics";
import {getApp} from "../utils/get-client";

const skills = new Hono<HonoContext>();

// Get every skill the MCP server publishes, with all of its files
skills.get("/", async (c) => {
  const endpoint = "get-skills";
  const startTime = Date.now();
  const analytics = c.get("analytics");
  const app = getApp(c);

  try {
    const service = await getSkillService(c.env);
    const dataset = await service.getSkills();

    if (!dataset) {
      return c.json({error: "Skills not available"}, 503);
    }

    analytics.track({
      event: AnalyticsEvent.GET_SKILLS,
      properties: {
        endpoint,
        apiVersion: "v1",
        app,
        skills: Object.keys(dataset.skills),
        version: dataset.version,
        responseTime: Date.now() - startTime,
      },
    });

    return c.json(dataset);
  } catch (error) {
    analytics.trackError({
      error,
      errorEvent: AnalyticsErrorEvent.GET_SKILLS_ERROR,
      fallbackMessage: "Failed to get skills",
      properties: {
        endpoint,
        apiVersion: "v1",
        app,
        responseTime: Date.now() - startTime,
      },
    });

    return c.json(
      {
        error: "Failed to get skills",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

export {skills};
