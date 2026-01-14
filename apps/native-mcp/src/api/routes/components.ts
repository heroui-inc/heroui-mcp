import type {HonoContext} from "../types/context";

import {Hono} from "hono";

import {getComponentService} from "../services/component";
import {AnalyticsErrorEvent, AnalyticsEvent} from "../types/analytics";
import {componentNameToKebab} from "../utils/component-name";

const components = new Hono<HonoContext>();

// List all components
components.get("/", async (c) => {
  const endpoint = "list-components";
  const startTime = Date.now();
  const analytics = c.get("analytics");

  try {
    const service = await getComponentService(c.env);
    // Fetch context once - getFromR2() cache ensures subsequent calls in same request reuse it
    const ctxData = await service.getContext();
    const componentsList = ctxData?.components?.sort() || [];
    const latestVersion = ctxData?.version || "unknown";

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
    const docUrl = `https://v3.heroui.com/docs/native/components/${kebabName}.mdx`;

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
      path: `/docs/native/components/${kebabName}`,
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

export {components};
