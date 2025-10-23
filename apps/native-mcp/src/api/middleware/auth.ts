import type {HonoContext} from "../types/context";
import type {Context, Next} from "hono";

export const authMiddleware = async (c: Context<HonoContext>, next: Next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader) {
    return next();
  }

  const token = authHeader?.split(" ")?.[1];

  if (!token || !authHeader.startsWith("Bearer ")) {
    return c.json({error: "Unauthorized - Malformed authorization header"}, 401);
  }

  // TODO: Verify token

  c.set("user", {id: "api-user"});

  return next();
};
