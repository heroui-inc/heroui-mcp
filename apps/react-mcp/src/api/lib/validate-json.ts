import type {z} from "zod";

import {zValidator} from "@hono/zod-validator";

export function validateJson<T extends z.ZodType>(schema: T) {
  return zValidator("json", schema, (result, c) => {
    if (!result.success) {
      // Zod 4 makes issues non-enumerable; preserve the API's structured errors.
      return c.json(
        {
          success: false,
          error: {
            name: result.error.name,
            message: result.error.message,
            issues: result.error.issues,
          },
        },
        400,
      );
    }
  });
}
