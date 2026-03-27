import type {HonoContext} from "../types/context";

import {zValidator} from "@hono/zod-validator";
import {Hono} from "hono";
import {z} from "zod";

import {HEROUI_REACT_GITHUB_BASE} from "../../extraction/constants";
import {REACT_LIBRARY_NAME} from "../contants";
import {getComponentService} from "../services/component";
import {AnalyticsErrorEvent, AnalyticsEvent} from "../types/analytics";
import {componentNameToKebab} from "../utils/component-name";
import {getApp} from "../utils/get-client";

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

const LIBRARY_NAME = REACT_LIBRARY_NAME;

// List components
components.get("/", async (c) => {
  const endpoint = "list-components";
  const startTime = Date.now();
  const analytics = c.get("analytics");
  const app = getApp(c);

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
        app,
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
        app,
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
  const app = getApp(c);

  try {
    const docResults = await Promise.all(
      componentNames.map(async (component) => {
        const kebabName = componentNameToKebab(component);
        const docUrl = `https://heroui.com/docs/react/components/${kebabName}.mdx`;

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
                app,
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
              app,
              component,
              url: docUrl,
              length: content.length,
              responseTime: Date.now() - startTime,
            },
          });

          return {
            component,
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
              app,
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
          app,
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
        app,
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

// Get component source code
components.post("/source", zValidator("json", ComponentsRequestSchema), async (c) => {
  const endpoint = "get-component-source";
  const startTime = Date.now();
  const {components: componentNames} = c.req.valid("json");
  const analytics = c.get("analytics");
  const app = getApp(c);

  try {
    const service = await getComponentService(c.env);
    const results = await service.getComponents(LIBRARY_NAME, componentNames);
    const latestVersion = await service.getLatestVersion();

    const baseUrl = HEROUI_REACT_GITHUB_BASE;

    const sourceResults = await Promise.all(
      results.map(async (result) => {
        if (result.error || !result.data || !result.data.links?.source) {
          return {
            component: result.component,
            error: result.error || "Source code not available",
          };
        }

        const sourceUrl = `${baseUrl}/packages/react/src/components/${result.data.links.source}`;

        try {
          let response: Response;
          try {
            response = await fetch(sourceUrl);
          } catch (fetchError) {
            analytics.trackError({
              error: fetchError,
              errorEvent: AnalyticsErrorEvent.GET_COMPONENT_SOURCE_CODE_ERROR,
              fallbackMessage: "Failed to fetch source code",
              properties: {
                endpoint,
                apiVersion: "v1",
                app,
                component: result.component,
                url: sourceUrl,
                filePath: result.data.links.source,
                responseTime: Date.now() - startTime,
              },
            });

            return {
              component: result.component,
              error: fetchError instanceof Error ? fetchError.message : String(fetchError),
            };
          }

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
              errorEvent: AnalyticsErrorEvent.GET_COMPONENT_SOURCE_CODE_ERROR,
              properties: {
                endpoint,
                apiVersion: "v1",
                app,
                component: result.component,
                url: sourceUrl,
                filePath: result.data.links.source,
                status: response.status,
                statusText: response.statusText,
                errorBody,
                responseTime: Date.now() - startTime,
              },
            });

            return {
              component: result.component,
              error: `${response.status} ${response.statusText}`,
            };
          }

          const sourceCode = await response.text();

          return {
            component: result.component,
            filePath: result.data.links.source,
            sourceCode,
            githubUrl: sourceUrl
              .replace("raw.githubusercontent.com", "github.com")
              .replace("/refs/heads/", "/blob/"),
          };
        } catch (error) {
          analytics.trackError({
            error,
            errorEvent: AnalyticsErrorEvent.GET_COMPONENT_SOURCE_CODE_ERROR,
            properties: {
              endpoint,
              apiVersion: "v1",
              app,
              component: result.component,
              url: sourceUrl,
              filePath: result.data.links.source,
              responseTime: Date.now() - startTime,
            },
          });

          return {
            component: result.component,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      }),
    );

    const failedComponents = sourceResults.filter((result) => result.error);

    if (failedComponents.length > 0) {
      analytics.trackError({
        error: failedComponents.map((result) => `${result.component}: ${result.error}`).join(", "),
        errorEvent: AnalyticsErrorEvent.GET_COMPONENT_SOURCE_CODE_ERROR,
        properties: {
          endpoint,
          apiVersion: "v1",
          app,
          components: componentNames,
          failedComponents: failedComponents.map((result) => result.component),
          latestVersion,
          responseTime: Date.now() - startTime,
        },
      });
    } else {
      analytics.track({
        event: AnalyticsEvent.GET_COMPONENT_SOURCE_CODE,
        properties: {
          endpoint,
          apiVersion: "v1",
          app,
          components: componentNames,
          latestVersion,
          responseTime: Date.now() - startTime,
        },
      });
    }

    return c.json({
      version: latestVersion || "unknown",
      results: sourceResults,
    });
  } catch (error) {
    analytics.trackError({
      error,
      errorEvent: AnalyticsErrorEvent.GET_COMPONENT_SOURCE_CODE_ERROR,
      fallbackMessage: "Failed to get component source code",
      properties: {
        endpoint,
        apiVersion: "v1",
        app,
        components: componentNames,
        responseTime: Date.now() - startTime,
      },
    });

    return c.json(
      {
        error: "Failed to get component source code",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

// Get component styles
components.post("/styles", zValidator("json", ComponentsRequestSchema), async (c) => {
  const endpoint = "get-component-styles";
  const startTime = Date.now();
  const {components: componentNames} = c.req.valid("json");
  const analytics = c.get("analytics");
  const app = getApp(c);

  try {
    const service = await getComponentService(c.env);
    const results = await service.getComponents(LIBRARY_NAME, componentNames);
    const latestVersion = await service.getLatestVersion();

    const baseUrl = HEROUI_REACT_GITHUB_BASE;

    const styleResults = await Promise.all(
      results.map(async (result) => {
        if (result.error || !result.data || !result.data.links?.styles) {
          return {
            component: result.component,
            error: result.error || "Styles not available",
          };
        }

        const stylesUrl = `${baseUrl}/packages/styles/components/${result.data.links.styles}`;

        try {
          let response: Response;
          try {
            response = await fetch(stylesUrl);
          } catch (fetchError) {
            analytics.trackError({
              error: fetchError,
              errorEvent: AnalyticsErrorEvent.GET_COMPONENT_SOURCE_STYLES_ERROR,
              fallbackMessage: "Failed to fetch styles",
              properties: {
                endpoint,
                apiVersion: "v1",
                app,
                component: result.component,
                url: stylesUrl,
                filePath: result.data.links.styles,
                responseTime: Date.now() - startTime,
              },
            });

            return {
              component: result.component,
              error: fetchError instanceof Error ? fetchError.message : String(fetchError),
            };
          }

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
              errorEvent: AnalyticsErrorEvent.GET_COMPONENT_SOURCE_STYLES_ERROR,
              properties: {
                endpoint,
                apiVersion: "v1",
                app,
                component: result.component,
                url: stylesUrl,
                filePath: result.data.links.styles,
                status: response.status,
                statusText: response.statusText,
                errorBody,
                responseTime: Date.now() - startTime,
              },
            });

            return {
              component: result.component,
              error: `${response.status} ${response.statusText}`,
            };
          }

          const stylesCode = await response.text();

          return {
            component: result.component,
            filePath: result.data.links.styles,
            stylesCode,
            githubUrl: stylesUrl
              .replace("raw.githubusercontent.com", "github.com")
              .replace("/refs/heads/", "/blob/"),
          };
        } catch (error) {
          analytics.trackError({
            error,
            errorEvent: AnalyticsErrorEvent.GET_COMPONENT_SOURCE_STYLES_ERROR,
            properties: {
              endpoint,
              apiVersion: "v1",
              app,
              component: result.component,
              url: stylesUrl,
              filePath: result.data.links.styles,
              responseTime: Date.now() - startTime,
            },
          });

          return {
            component: result.component,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      }),
    );

    const failedComponents = styleResults.filter((result) => result.error);

    if (failedComponents.length > 0) {
      analytics.trackError({
        error: failedComponents.map((result) => `${result.component}: ${result.error}`).join(", "),
        errorEvent: AnalyticsErrorEvent.GET_COMPONENT_SOURCE_STYLES_ERROR,
        properties: {
          endpoint,
          apiVersion: "v1",
          app,
          components: componentNames,
          failedComponents: failedComponents.map((result) => result.component),
          latestVersion,
          responseTime: Date.now() - startTime,
        },
      });
    } else {
      analytics.track({
        event: AnalyticsEvent.GET_COMPONENT_SOURCE_STYLES,
        properties: {
          endpoint,
          apiVersion: "v1",
          app,
          components: componentNames,
          latestVersion,
          responseTime: Date.now() - startTime,
        },
      });
    }

    return c.json({
      version: latestVersion || "unknown",
      results: styleResults,
    });
  } catch (error) {
    analytics.trackError({
      error,
      errorEvent: AnalyticsErrorEvent.GET_COMPONENT_SOURCE_STYLES_ERROR,
      fallbackMessage: "Failed to get component styles",
      properties: {
        endpoint,
        apiVersion: "v1",
        app,
        components: componentNames,
        responseTime: Date.now() - startTime,
      },
    });

    return c.json(
      {
        error: "Failed to get component styles",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

export {components};
