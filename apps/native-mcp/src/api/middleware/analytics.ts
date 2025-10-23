import type {HonoContext} from "../types/context";
import type {Context, Next} from "hono";

import {AnalyticsService} from "../services/analytics";

export const analyticsMiddleware = async (c: Context<HonoContext>, next: Next) => {
  const cf = c.req.raw.cf;
  const user = c.get("user");
  const distinctId = user?.id;

  let metadata: Record<string, unknown> | undefined = undefined;

  if (cf) {
    metadata = {};

    metadata.city = cf.city;
    // https://github.com/Netrvin/cloudflare-colo-list
    metadata.colo = cf.colo;
    metadata.country = cf.country;
    metadata.region = cf.region;
    metadata.timezone = cf.timezone;

    console.log("cf:", metadata);
  }

  const analytics = new AnalyticsService({bindings: c.env, metadata, distinctId});

  c.set("analytics", analytics);

  try {
    await next();
  } finally {
    await analytics.shutdown();
  }
};
