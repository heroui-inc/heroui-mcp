import type {HonoContext} from "../types/context";

import {zValidator} from "@hono/zod-validator";
import {Hono} from "hono";
import {z} from "zod";

import {ThemeDataInputSchema} from "../../shared/schemas/theme";
import {AnalyticsErrorEvent, AnalyticsEvent} from "../types/analytics";
import {callPlatformApi} from "../utils/call-platform-api";
import {formatThemeValidationError} from "../utils/format-theme-error";

const customThemes = new Hono<HonoContext>();

// Request schemas
const createThemeSchema = z.object({
  name: z.string().min(1).max(100),
  library: z.enum(["react", "native"]),
  themeData: ThemeDataInputSchema,
});

const updateThemeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  themeData: ThemeDataInputSchema.optional(),
});

/**
 * POST /custom-themes
 * Create a new custom theme
 */
customThemes.post(
  "/",
  zValidator("json", createThemeSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          error: "VALIDATION_ERROR",
          message: formatThemeValidationError(result.error),
          hint: "Use get_theme_info tool with theme='default' to see the expected structure",
        },
        400,
      );
    }
  }),
  async (c) => {
    const endpoint = "create-custom-theme";
    const startTime = Date.now();
    const analytics = c.get("analytics");
    const userId = c.get("userId");

    if (!userId) {
      return c.json(
        {
          error: "UNAUTHORIZED",
          message: "Authentication required",
        },
        401,
      );
    }

    try {
      const {name, library, themeData} = c.req.valid("json");

      // themeData is already validated and transformed to ThemeDefinition by ThemeDataInputSchema
      // Convert to JSON string for storage
      const themeDataJson = JSON.stringify(themeData);

      // Forward API key to Platform API
      const apiKey = c.req.header("X-API-Key");
      if (!apiKey) {
        return c.json(
          {
            error: "UNAUTHORIZED",
            message: "API key required",
          },
          401,
        );
      }

      const {response, json: result} = await callPlatformApi(c.env, "/themes", {
        method: "POST",
        headers: {
          "X-API-Key": apiKey,
        },
        body: JSON.stringify({
          name,
          library,
          themeData: themeDataJson,
        }),
      });

      if (!response.ok) {
        const errorResult = result as {
          success?: boolean;
          error?: {code?: string; message?: string; issues?: unknown};
        };

        // Check if it's a validation error from Platform API
        let errorMessage = errorResult.error?.message || "Failed to create theme";
        if (errorResult.error?.issues) {
          try {
            const zodError = z.ZodError.create(errorResult.error.issues as z.ZodIssue[]);
            errorMessage = formatThemeValidationError(zodError);
          } catch {
            // If parsing fails, use the original message
          }
        }

        analytics.trackError({
          error: errorMessage,
          errorEvent: AnalyticsErrorEvent.GET_THEMES_ERROR,
          properties: {
            endpoint,
            responseTime: Date.now() - startTime,
          },
        });

        return c.json(
          {
            error: errorResult.error?.code || "INTERNAL_ERROR",
            message: errorMessage,
            hint: "Use get_theme_info tool with theme='default' to see the expected structure",
          },
          (response.status as 400 | 401 | 403 | 404 | 500) || 500,
        );
      }

      const successResult = result as {success: boolean; data?: {id?: string}};
      analytics.track({
        event: AnalyticsEvent.GET_THEMES,
        properties: {
          endpoint,
          themeId: successResult.data?.id,
          library,
          responseTime: Date.now() - startTime,
        },
      });

      return c.json(result, (response.status as 200 | 201) || 201);
    } catch (error) {
      analytics.trackError({
        error,
        errorEvent: AnalyticsErrorEvent.GET_THEMES_ERROR,
        fallbackMessage: "Failed to create theme",
        properties: {
          endpoint,
          responseTime: Date.now() - startTime,
        },
      });

      return c.json(
        {
          error: "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "Failed to create theme",
        },
        500,
      );
    }
  },
);

/**
 * GET /custom-themes
 * List all custom themes for the authenticated user
 */
customThemes.get("/", async (c) => {
  const endpoint = "list-custom-themes";
  const startTime = Date.now();
  const analytics = c.get("analytics");
  const userId = c.get("userId");

  if (!userId) {
    return c.json(
      {
        error: "UNAUTHORIZED",
        message: "Authentication required",
      },
      401,
    );
  }

  try {
    const library = c.req.query("library");
    const apiKey = c.req.header("X-API-Key");
    if (!apiKey) {
      return c.json(
        {
          error: "UNAUTHORIZED",
          message: "API key required",
        },
        401,
      );
    }

    const queryParams = new URLSearchParams();
    if (library === "react" || library === "native") {
      queryParams.append("library", library);
    }

    const path = `/themes${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

    const {response, json: result} = await callPlatformApi(c.env, path, {
      method: "GET",
      headers: {
        "X-API-Key": apiKey,
      },
    });

    if (!response.ok) {
      const errorResult = result as {success?: boolean; error?: {code?: string; message?: string}};
      analytics.trackError({
        error: errorResult.error?.message || "Failed to list themes",
        errorEvent: AnalyticsErrorEvent.GET_THEMES_ERROR,
        properties: {
          endpoint,
          responseTime: Date.now() - startTime,
        },
      });

      return c.json(
        {
          error: errorResult.error?.code || "INTERNAL_ERROR",
          message: errorResult.error?.message || "Failed to list themes",
        },
        (response.status as 400 | 401 | 403 | 404 | 500) || 500,
      );
    }

    const successResult = result as {success: boolean; data?: unknown[]};
    analytics.track({
      event: AnalyticsEvent.GET_THEMES,
      properties: {
        endpoint,
        themesCount: successResult.data?.length || 0,
        library,
        responseTime: Date.now() - startTime,
      },
    });

    return c.json(result, 200);
  } catch (error) {
    analytics.trackError({
      error,
      errorEvent: AnalyticsErrorEvent.GET_THEMES_ERROR,
      fallbackMessage: "Failed to list themes",
      properties: {
        endpoint,
        responseTime: Date.now() - startTime,
      },
    });

    return c.json(
      {
        error: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Failed to list themes",
      },
      500,
    );
  }
});

/**
 * GET /custom-themes/:id
 * Get a specific custom theme
 */
customThemes.get("/:id", async (c) => {
  const endpoint = "get-custom-theme";
  const startTime = Date.now();
  const analytics = c.get("analytics");
  const userId = c.get("userId");
  const themeId = c.req.param("id");

  if (!userId) {
    return c.json(
      {
        error: "UNAUTHORIZED",
        message: "Authentication required",
      },
      401,
    );
  }

  try {
    const apiKey = c.req.header("X-API-Key");
    if (!apiKey) {
      return c.json(
        {
          error: "UNAUTHORIZED",
          message: "API key required",
        },
        401,
      );
    }

    const {response, json: result} = await callPlatformApi(c.env, `/themes/${themeId}`, {
      method: "GET",
      headers: {
        "X-API-Key": apiKey,
      },
    });

    if (!response.ok) {
      const errorResult = result as {success?: boolean; error?: {code?: string; message?: string}};
      analytics.trackError({
        error: errorResult.error?.message || "Failed to get theme",
        errorEvent: AnalyticsErrorEvent.GET_THEMES_ERROR,
        properties: {
          endpoint,
          themeId,
          responseTime: Date.now() - startTime,
        },
      });

      return c.json(
        {
          error: errorResult.error?.code || "INTERNAL_ERROR",
          message: errorResult.error?.message || "Failed to get theme",
        },
        (response.status as 400 | 401 | 403 | 404 | 500) || 500,
      );
    }

    analytics.track({
      event: AnalyticsEvent.GET_THEMES,
      properties: {
        endpoint,
        themeId,
        responseTime: Date.now() - startTime,
      },
    });

    return c.json(result, 200);
  } catch (error) {
    analytics.trackError({
      error,
      errorEvent: AnalyticsErrorEvent.GET_THEMES_ERROR,
      fallbackMessage: "Failed to get theme",
      properties: {
        endpoint,
        themeId,
        responseTime: Date.now() - startTime,
      },
    });

    return c.json(
      {
        error: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Failed to get theme",
      },
      500,
    );
  }
});

/**
 * PUT /custom-themes/:id
 * Update a custom theme
 */
customThemes.put("/:id", zValidator("json", updateThemeSchema), async (c) => {
  const endpoint = "update-custom-theme";
  const startTime = Date.now();
  const analytics = c.get("analytics");
  const userId = c.get("userId");
  const themeId = c.req.param("id");

  if (!userId) {
    return c.json(
      {
        error: "UNAUTHORIZED",
        message: "Authentication required",
      },
      401,
    );
  }

  try {
    const {name, themeData} = c.req.valid("json");
    const apiKey = c.req.header("X-API-Key");
    if (!apiKey) {
      return c.json(
        {
          error: "UNAUTHORIZED",
          message: "API key required",
        },
        401,
      );
    }

    const updateData: {
      name?: string;
      themeData?: string;
    } = {};

    if (name !== undefined) {
      updateData.name = name;
    }

    if (themeData !== undefined) {
      // themeData is already validated and transformed to ThemeDefinition by ThemeDataInputSchema
      updateData.themeData = JSON.stringify(themeData);
    }

    const {response, json: result} = await callPlatformApi(c.env, `/themes/${themeId}`, {
      method: "PUT",
      headers: {
        "X-API-Key": apiKey,
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorResult = result as {success?: boolean; error?: {code?: string; message?: string}};
      analytics.trackError({
        error: errorResult.error?.message || "Failed to update theme",
        errorEvent: AnalyticsErrorEvent.GET_THEMES_ERROR,
        properties: {
          endpoint,
          themeId,
          responseTime: Date.now() - startTime,
        },
      });

      return c.json(
        {
          error: errorResult.error?.code || "INTERNAL_ERROR",
          message: errorResult.error?.message || "Failed to update theme",
        },
        (response.status as 400 | 401 | 403 | 404 | 500) || 500,
      );
    }

    analytics.track({
      event: AnalyticsEvent.GET_THEMES,
      properties: {
        endpoint,
        themeId,
        responseTime: Date.now() - startTime,
      },
    });

    return c.json(result, 200);
  } catch (error) {
    analytics.trackError({
      error,
      errorEvent: AnalyticsErrorEvent.GET_THEMES_ERROR,
      fallbackMessage: "Failed to update theme",
      properties: {
        endpoint,
        themeId,
        responseTime: Date.now() - startTime,
      },
    });

    return c.json(
      {
        error: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Failed to update theme",
      },
      500,
    );
  }
});

/**
 * DELETE /custom-themes/:id
 * Delete a custom theme
 */
customThemes.delete("/:id", async (c) => {
  const endpoint = "delete-custom-theme";
  const startTime = Date.now();
  const analytics = c.get("analytics");
  const userId = c.get("userId");
  const themeId = c.req.param("id");

  if (!userId) {
    return c.json(
      {
        error: "UNAUTHORIZED",
        message: "Authentication required",
      },
      401,
    );
  }

  try {
    const apiKey = c.req.header("X-API-Key");
    if (!apiKey) {
      return c.json(
        {
          error: "UNAUTHORIZED",
          message: "API key required",
        },
        401,
      );
    }

    const {response, json: result} = await callPlatformApi(c.env, `/themes/${themeId}`, {
      method: "DELETE",
      headers: {
        "X-API-Key": apiKey,
      },
    });

    if (!response.ok) {
      const errorResult = result as {success?: boolean; error?: {code?: string; message?: string}};
      analytics.trackError({
        error: errorResult.error?.message || "Failed to delete theme",
        errorEvent: AnalyticsErrorEvent.GET_THEMES_ERROR,
        properties: {
          endpoint,
          themeId,
          responseTime: Date.now() - startTime,
        },
      });

      return c.json(
        {
          error: errorResult.error?.code || "INTERNAL_ERROR",
          message: errorResult.error?.message || "Failed to delete theme",
        },
        (response.status as 400 | 401 | 403 | 404 | 500) || 500,
      );
    }

    analytics.track({
      event: AnalyticsEvent.GET_THEMES,
      properties: {
        endpoint,
        themeId,
        responseTime: Date.now() - startTime,
      },
    });

    return c.json(result, 200);
  } catch (error) {
    analytics.trackError({
      error,
      errorEvent: AnalyticsErrorEvent.GET_THEMES_ERROR,
      fallbackMessage: "Failed to delete theme",
      properties: {
        endpoint,
        themeId,
        responseTime: Date.now() - startTime,
      },
    });

    return c.json(
      {
        error: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Failed to delete theme",
      },
      500,
    );
  }
});

export {customThemes};
