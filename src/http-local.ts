#!/usr/bin/env node
/**
 * Local development server for Hono app
 * This wrapper allows running the Hono app locally with Node.js
 */

import { serve } from "@hono/node-server"
import app from "./http.js"

const port = process.env.PORT ? Number(process.env.PORT) : 3000

serve({
  fetch: app.fetch,
  port,
}, (info) => {
  console.info(`HeroUI MCP Server running on http://localhost:${info.port}`)
})