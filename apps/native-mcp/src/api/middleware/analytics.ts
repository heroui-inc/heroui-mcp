import type {HonoContext} from "../types/context";
import type {Context, Next} from "hono";

import {AnalyticsService} from "../services/analytics";

export const analyticsMiddleware = async (c: Context<HonoContext>, next: Next) => {
  const cf = c.req.raw.cf;

  let metadata: Record<string, unknown> | undefined = undefined;

  if (cf) {
    metadata = {};

    metadata.city = cf.city;
    // https://github.com/Netrvin/cloudflare-colo-list
    metadata.colo = cf.colo;
    metadata.country = cf.country;
    metadata.region = cf.region;
    metadata.timezone = cf.timezone;
  }

  const clientVersion = c.get("clientVersion");

  metadata = {
    ...(metadata || {}),
    version: c.get("serverVersion"),
    ...(clientVersion && {clientVersion}),
    ...{versionMatch: clientVersion && c.get("serverVersion") === clientVersion},
  };

  const analytics = new AnalyticsService({bindings: c.env, metadata});

  c.set("analytics", analytics);

  try {
    await next();
  } finally {
    await analytics.shutdown();
  }
};
