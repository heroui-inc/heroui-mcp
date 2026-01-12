import type {HonoContext} from "../types/context";

import {zValidator} from "@hono/zod-validator";
import {Hono} from "hono";
import {z} from "zod";

import {REACT_LIBRARY_NAME} from "../contants";
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

const LIBRARY_NAME = REACT_LIBRARY_NAME;

// List components
components.get("/", async (c) => {
  const endpoint = "list-components";
  const startTime = Date.now();
  const analytics = c.get("analytics");

  try {
    const service = await getComponentService(c.env);
    // Always use latest version
    const componentsList = await service.listComponents(LIBRARY_NAME);

    // Get the latest version
    const latestVersion = await service.getLatestVersion(LIBRARY_NAME);

    analytics.track({
      event: AnalyticsEvent.LIST_COMPONENTS,
      properties: {
        endpoint,
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

// Get component documentation
components.get("/:component/docs", async (c) => {
  const endpoint = "get-component-docs";
  const startTime = Date.now();
  const analytics = c.get("analytics");
  const component = c.req.param("component");

  try {
    const kebabName = componentNameToKebab(component);
    const docUrl = `https://v3.heroui.com/docs/react/components/${kebabName}.mdx`;

    const response = await fetch(docUrl);

    if (!response.ok) {
      analytics.trackError({
        error: `Failed to fetch component docs: ${component}`,
        errorEvent: AnalyticsErrorEvent.GET_COMPONENT_DOCS_ERROR,
        properties: {
          endpoint,
          component,
          status: response.status,
          responseTime: Date.now() - startTime,
        },
      });

      return c.json(
        {
          error: `Component documentation not found: ${component}`,
          status: response.status,
        },
        response.status as 400 | 404 | 500,
      );
    }

    const content = await response.text();
    const contentType = response.headers.get("content-type") || "text/plain";

    analytics.track({
      event: AnalyticsEvent.GET_COMPONENT_DOCS,
      properties: {
        endpoint,
        component,
        url: docUrl,
        length: content.length,
        responseTime: Date.now() - startTime,
      },
    });

    return c.json({
      component,
      url: docUrl,
      content,
      contentType,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const isNetworkError =
      errorMessage.includes("fetch") ||
      errorMessage.includes("network") ||
      errorMessage.includes("ECONNREFUSED") ||
      errorMessage.includes("ENOTFOUND");

    analytics.trackError({
      error,
      errorEvent: AnalyticsErrorEvent.GET_COMPONENT_DOCS_ERROR,
      fallbackMessage: "Failed to fetch component documentation",
      properties: {
        endpoint,
        component,
        responseTime: Date.now() - startTime,
        isNetworkError,
      },
    });

    if (isNetworkError) {
      return c.json(
        {
          error: "Network error while fetching component documentation",
          details: errorMessage,
          component,
        },
        500,
      );
    }

    return c.json(
      {
        error: "Internal server error while fetching component documentation",
        details: errorMessage,
        component,
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

  try {
    const service = await getComponentService(c.env);
    const results = await service.getComponents(LIBRARY_NAME, componentNames);
    const latestVersion = await service.getLatestVersion(LIBRARY_NAME);

    const branch = "v3";
    const baseUrl = `https://raw.githubusercontent.com/heroui-inc/heroui/refs/heads/${branch}`;

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
          const response = await fetch(sourceUrl);
          if (!response.ok) {
            return {
              component: result.component,
              error: "Failed to fetch source code from GitHub",
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
          return {
            component: result.component,
            error: error instanceof Error ? error.message : "Failed to fetch source code",
          };
        }
      }),
    );

    const failedComponents = sourceResults.filter((result) => result.error);

    if (failedComponents.length > 0) {
      analytics.trackError({
        error: failedComponents.map((result) => `${result.component}: ${result.error}`).join(", "),
        errorEvent: AnalyticsErrorEvent.GET_COMPONENT_SOURCE_ERROR,
        properties: {
          endpoint,
          components: componentNames,
          failedComponents: failedComponents.map((result) => result.component),
          latestVersion,
          responseTime: Date.now() - startTime,
        },
      });
    } else {
      analytics.track({
        event: AnalyticsEvent.GET_COMPONENT_SOURCE,
        properties: {
          endpoint,
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
      errorEvent: AnalyticsErrorEvent.GET_COMPONENT_SOURCE_ERROR,
      fallbackMessage: "Failed to get component source code",
      properties: {
        endpoint,
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

  try {
    const service = await getComponentService(c.env);
    const results = await service.getComponents(LIBRARY_NAME, componentNames);
    const latestVersion = await service.getLatestVersion(LIBRARY_NAME);

    const branch = "v3";
    const baseUrl = `https://raw.githubusercontent.com/heroui-inc/heroui/refs/heads/${branch}`;

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
          const response = await fetch(stylesUrl);
          if (!response.ok) {
            return {
              component: result.component,
              error: "Failed to fetch styles from GitHub",
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
          return {
            component: result.component,
            error: error instanceof Error ? error.message : "Failed to fetch styles",
          };
        }
      }),
    );

    const failedComponents = styleResults.filter((result) => result.error);

    if (failedComponents.length > 0) {
      analytics.trackError({
        error: failedComponents.map((result) => `${result.component}: ${result.error}`).join(", "),
        errorEvent: AnalyticsErrorEvent.GET_COMPONENT_STYLES_ERROR,
        properties: {
          endpoint,
          components: componentNames,
          failedComponents: failedComponents.map((result) => result.component),
          latestVersion,
          responseTime: Date.now() - startTime,
        },
      });
    } else {
      analytics.track({
        event: AnalyticsEvent.GET_COMPONENT_STYLES,
        properties: {
          endpoint,
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
      errorEvent: AnalyticsErrorEvent.GET_COMPONENT_STYLES_ERROR,
      fallbackMessage: "Failed to get component styles",
      properties: {
        endpoint,
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
