import type {HonoContext} from "../types/context";
import type {Context} from "hono";

/**
 * Extracts the app type from request query parameters.
 * Defaults to "react-mcp" if not specified.
 *
 * @param c - Hono context
 * @returns The app identifier (e.g., "skills", "react-mcp")
 */
export function getApp(c: Context<HonoContext>): string {
  const app = c.req.query("app");

  // If app is provided, use it; otherwise default to "react-mcp"
  return app || "react-mcp";
}
