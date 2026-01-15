import type {AnalyticsClient} from "../types/analytics";
import type {HonoContext} from "../types/context";
import type {Context} from "hono";

/**
 * Extracts the client type from request query parameters.
 * Defaults to "mcp" if not specified or invalid.
 *
 * @param c - Hono context
 * @returns The client type ("mcp" or "skills")
 */
export function getClient(c: Context<HonoContext>): AnalyticsClient {
  const client = c.req.query("client");

  if (client === "skills") {
    return "skills";
  }

  // Default to "mcp" for backward compatibility
  return "mcp";
}
