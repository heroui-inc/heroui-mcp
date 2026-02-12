import type {HonoContext} from "../types/context";

import {zValidator} from "@hono/zod-validator";
import {Hono} from "hono";
import {z} from "zod";

import {getComponentService} from "../services/component";
import {AnalyticsErrorEvent, AnalyticsEvent} from "../types/analytics";
import {componentNameToKebab} from "../utils/component-name";

const ComponentsRequestSchema = z.object({
  components: z
    .array(z.string().trim().min(1, "Component name cannot be empty"))
    .min(1, "Components array cannot be empty")
    .refine(
      (components) => components.every((c) => c.trim().length > 0),
      "All component names must be non-empty strings",
    ),
});

const components = new Hono<HonoContext>();

// List all components
components.get("/", async (c) => {
  const endpoint = "list-components";
  const startTime = Date.now();
  const analytics = c.get("analytics");

  try {
    const service = await getComponentService(c.env);
    const ctxData = await service.getContext();
    const componentsList = ctxData?.components?.sort() || [];
    const latestVersion = ctxData?.version || "unknown";

    analytics.track({
      event: AnalyticsEvent.LIST_COMPONENTS,
      properties: {
        endpoint,
        apiVersion: "v1",
        componentsCount: componentsList.length,
        latestVersion,
        responseTime: Date.now() - startTime,
      },
    });

    return c.json({
      latestVersion: latestVersion || "unknown",
      components: componentsList,
      count: componentsList.length,
    });
  } catch (error) {
    analytics.trackError({
      error,
      errorEvent: AnalyticsErrorEvent.LIST_COMPONENTS_ERROR,
      fallbackMessage: "Failed to list components",
      properties: {
        endpoint,
        apiVersion: "v1",
        responseTime: Date.now() - startTime,
      },
    });

    return c.json(
      {
        error: "Failed to list components",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

// Get component documentation (batch)
components.post("/docs", zValidator("json", ComponentsRequestSchema), async (c) => {
  const endpoint = "get-component-docs-batch";
  const startTime = Date.now();
  const {components: componentNames} = c.req.valid("json");
  const analytics = c.get("analytics");

  try {
    const docResults = await Promise.all(
      componentNames.map(async (component) => {
        const kebabName = componentNameToKebab(component);
        const docUrl = `https://v3.heroui.com/docs/native/components/${kebabName}.mdx`;

        try {
          const response = await fetch(docUrl);

          if (!response.ok) {
            let errorBody: string | null = null;
            try {
              errorBody = await response.text();

              if (errorBody && errorBody.length > 300) {
                errorBody =
                  errorBody.substring(0, 150) + "..." + errorBody.substring(errorBody.length - 150);
              }
            } catch {
              // Ignore if we can't read the body
            }

            analytics.trackError({
              error: new Error(`${response.status}: ${response.statusText}`),
              errorEvent: AnalyticsErrorEvent.GET_COMPONENT_DOCS_ERROR,
              properties: {
                endpoint,
                apiVersion: "v1",
                component,
                url: docUrl,
                status: response.status,
                statusText: response.statusText,
                errorBody,
                responseTime: Date.now() - startTime,
              },
            });

            const errorMessage =
              response.status === 404 || response.status === 500
                ? "Component not found"
                : `${response.status} ${response.statusText}`;

            return {
              component,
              error: errorMessage,
              status: response.status,
              statusText: response.statusText,
              url: docUrl,
            };
          }

          const content = await response.text();
          const contentType = response.headers.get("content-type") || "text/plain";

          analytics.track({
            event: AnalyticsEvent.GET_COMPONENT_DOCS,
            properties: {
              endpoint,
              apiVersion: "v1",
              component,
              url: docUrl,
              length: content.length,
              responseTime: Date.now() - startTime,
            },
          });

          return {
            component,
            path: `/docs/native/components/${kebabName}`,
            url: docUrl,
            content,
            contentType,
          };
        } catch (error) {
          analytics.trackError({
            error,
            errorEvent: AnalyticsErrorEvent.GET_COMPONENT_DOCS_ERROR,
            properties: {
              endpoint,
              apiVersion: "v1",
              component,
              url: docUrl,
              responseTime: Date.now() - startTime,
            },
          });

          const errMsg = error instanceof Error ? error.message : String(error);
          const errorMessage =
            errMsg.includes("404") ||
            errMsg.includes("500") ||
            errMsg.toLowerCase().includes("not found") ||
            errMsg.toLowerCase().includes("internal server error")
              ? "Component not found"
              : errMsg;

          return {
            component,
            error: errorMessage,
            url: docUrl,
          };
        }
      }),
    );

    const failedComponents = docResults.filter((result) => result.error);

    if (failedComponents.length > 0) {
      analytics.trackError({
        error: failedComponents.map((result) => `${result.component}: ${result.error}`).join(", "),
        errorEvent: AnalyticsErrorEvent.GET_COMPONENT_DOCS_ERROR,
        properties: {
          endpoint,
          apiVersion: "v1",
          components: componentNames,
          failedComponents: failedComponents.map((result) => result.component),
          responseTime: Date.now() - startTime,
        },
      });
    }

    return c.json({results: docResults});
  } catch (error) {
    analytics.trackError({
      error,
      errorEvent: AnalyticsErrorEvent.GET_COMPONENT_DOCS_ERROR,
      fallbackMessage: "Failed to get component documentation",
      properties: {
        endpoint,
        apiVersion: "v1",
        components: componentNames,
        responseTime: Date.now() - startTime,
      },
    });

    return c.json(
      {
        error: "Failed to get component documentation",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

export {components};
