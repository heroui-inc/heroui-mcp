import {cors} from "hono/cors";

export const corsMiddleware = cors({
  origin: "*", // Allow all origins since this is a public API
  credentials: false,
  allowHeaders: ["Content-Type", "Accept", "X-API-Key"],
});
