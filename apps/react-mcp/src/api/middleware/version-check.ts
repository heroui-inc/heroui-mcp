import type {HonoContext} from "../types/context";
import type {Context, Next} from "hono";

import packageJson from "../../../package.json";

export const versionCheckMiddleware = async (
  c: Context<HonoContext>,
  next: Next,
): Promise<void> => {
  const clientVersion = c.req.header("X-Client-Version");
  const serverVersion = packageJson.version;

  c.set("clientVersion", clientVersion || undefined);
  c.set("serverVersion", serverVersion);
  c.header("X-Server-Version", serverVersion);

  await next();

  const contentType = c.res.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    return;
  }

  // Skip version checking for skills
  const userAgent = c.req.header("User-Agent") || "";
  const isSkill = userAgent.includes("Skill");

  if (isSkill) {
    return;
  }

  const body = await c.res.clone().json();
  const versionMatch = serverVersion === clientVersion || false;
  const wrappedBody = versionMatch
    ? body
    : {
        ...(body as Record<string, unknown>),
        _warning: `⚠️ You are using an outdated MCP client. Please restart the MCP and make sure to use @heroui/react-mcp@latest to always get the latest version.\n\nCurrent version: ${clientVersion || "unknown"}\nLatest version: ${serverVersion}`,
      };

  c.res = c.json(wrappedBody, c.res.status as any);
};
