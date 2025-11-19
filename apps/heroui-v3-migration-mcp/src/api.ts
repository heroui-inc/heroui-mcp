/**
 * HeroUI v3 Migration MCP API Server
 *
 * This is a Cloudflare Worker that serves migration instructions
 * from HeroUI v2 to v3 via Streamable HTTP transport
 */

export {default, app} from "./api/index";
