/* eslint-disable @typescript-eslint/no-explicit-any */

import type {HonoContext} from "../types/context";

import {zValidator} from "@hono/zod-validator";
import {Hono} from "hono";
import {z} from "zod";

import {REACT_LIBRARY_NAME} from "../contants";
import {getComponentService} from "../services/component";
import {AnalyticsErrorEvent, AnalyticsEvent} from "../types/analytics";

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

// Get component details
components.post("/", zValidator("json", ComponentsRequestSchema), async (c) => {
  const endpoint = "get-components";
  const startTime = Date.now();
  const analytics = c.get("analytics");
  const {components: componentNames} = c.req.valid("json");

  try {
    const service = await getComponentService(c.env);
    const results = await service.getComponents(LIBRARY_NAME, componentNames);
    const latestVersion = await service.getLatestVersion(LIBRARY_NAME);

    const failedComponents = results.filter((result) => result.error);

    if (failedComponents.length > 0) {
      analytics.trackError({
        error: failedComponents.map((result) => `${result.component}: ${result.error}`).join(", "),
        errorEvent: AnalyticsErrorEvent.GET_COMPONENTS_ERROR,
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
        event: AnalyticsEvent.GET_COMPONENTS,
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
      results,
    });
  } catch (error) {
    analytics.trackError({
      error,
      errorEvent: AnalyticsErrorEvent.GET_COMPONENTS_ERROR,
      fallbackMessage: "Failed to get component data",
      properties: {
        endpoint,
        components: componentNames,
        responseTime: Date.now() - startTime,
      },
    });

    return c.json(
      {
        error: "Failed to get component data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

// Get component props
components.post("/props", zValidator("json", ComponentsRequestSchema), async (c) => {
  const endpoint = "get-component-props";
  const startTime = Date.now();
  const {components: componentNames} = c.req.valid("json");
  const analytics = c.get("analytics");

  try {
    const service = await getComponentService(c.env);
    const results = await service.getComponents(LIBRARY_NAME, componentNames);
    const latestVersion = await service.getLatestVersion(LIBRARY_NAME);

    const failedComponents: typeof results = [];

    const propsResults = results.map((result) => {
      if (result.error || !result.data) {
        failedComponents.push(result);

        return {
          component: result.component,
          error: result.error || "Component not found",
        };
      }

      const libraryName = "HeroUI";
      const versionText = ` (${latestVersion})`;
      let propsText = `# ${result.component} Component Props - ${libraryName}${versionText}\n\n`;

      if (result.data.description) {
        propsText += `${result.data.description}\n\n`;
      }

      if (result.data.props && Object.keys(result.data.props).length > 0) {
        propsText += "## Props\n\n";
        Object.entries(result.data.props).forEach(([propName, prop]) => {
          propsText += `- **${propName}**: \`${prop.type}\``;
          if (prop.default) {
            propsText += ` = \`${prop.default}\``;
          }
          if (prop.description) {
            propsText += ` - ${prop.description}`;
          }
          propsText += "\n";
        });
      } else {
        propsText += "No props available for this component.\n";
      }

      // Add sub-components if available
      if (result.data.subComponents && Object.keys(result.data.subComponents).length > 0) {
        propsText += "\n## Sub-components\n\n";
        Object.values(result.data.subComponents).forEach((sub: any) => {
          propsText += `### ${sub.name}\n\n`;
          if (sub.props && Object.keys(sub.props).length > 0) {
            Object.entries(sub.props).forEach(([propName, prop]: [string, any]) => {
              propsText += `- **${propName}**: \`${prop.type}\``;
              if (prop.default) {
                propsText += ` = \`${prop.default}\``;
              }
              if (prop.description) {
                propsText += ` - ${prop.description}`;
              }
              propsText += "\n";
            });
          } else {
            propsText += "No props documented for this sub-component.\n";
          }
          propsText += "\n";
        });
      }

      return {
        component: result.component,
        props: propsText,
      };
    });

    if (failedComponents.length > 0) {
      analytics.trackError({
        error: failedComponents
          .map((component) => `${component.component}: ${component.error}`)
          .join(", "),
        errorEvent: AnalyticsErrorEvent.GET_COMPONENT_PROPS_ERROR,
        properties: {
          endpoint,
          components: componentNames,
          failedComponents: failedComponents.map((component) => component.component),
          latestVersion,
          responseTime: Date.now() - startTime,
        },
      });
    } else {
      analytics.track({
        event: AnalyticsEvent.GET_COMPONENT_PROPS,
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
      results: propsResults,
    });
  } catch (error) {
    analytics.trackError({
      error,
      errorEvent: AnalyticsErrorEvent.GET_COMPONENT_PROPS_ERROR,
      fallbackMessage: "Failed to get component props",
      properties: {
        endpoint,
        components: componentNames,
        responseTime: Date.now() - startTime,
      },
    });

    return c.json(
      {
        error: "Failed to get component props",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

// Get component examples
components.post("/examples", zValidator("json", ComponentsRequestSchema), async (c) => {
  const endpoint = "get-component-examples";
  const startTime = Date.now();
  const {components: componentNames} = c.req.valid("json");
  const analytics = c.get("analytics");

  try {
    const service = await getComponentService(c.env);
    const results = await service.getComponents(LIBRARY_NAME, componentNames);
    const latestVersion = await service.getLatestVersion(LIBRARY_NAME);

    const failedComponents: typeof results = [];

    const exampleResults = results.map((result) => {
      if (result.error || !result.data) {
        failedComponents.push(result);

        return {
          component: result.component,
          error: result.error || "Component not found",
        };
      }

      const examples = result.data.examples || [];

      if (examples.length === 0) {
        const libraryName = "HeroUI";
        const versionText = ` (${latestVersion})`;
        const importStatement = `import { ${result.component} } from '@heroui/react';`;

        let exampleText = `// ${result.component} Component Example - ${libraryName}${versionText}\n\n`;
        exampleText += `${importStatement}\n\n`;
        exampleText += `export default function Example() {\n`;
        exampleText += `  return (\n`;
        exampleText += `    <${result.component}>\n`;
        exampleText += `      Content\n`;
        exampleText += `    </${result.component}>\n`;
        exampleText += `  );\n`;
        exampleText += `}\n`;

        examples.push({
          name: "basic",
          content: exampleText,
        });
      }

      return {
        component: result.component,
        examples,
      };
    });

    if (failedComponents.length > 0) {
      analytics.trackError({
        error: failedComponents
          .map((component) => `${component.component}: ${component.error}`)
          .join(", "),
        errorEvent: AnalyticsErrorEvent.GET_COMPONENT_EXAMPLES_ERROR,
        properties: {
          endpoint,
          components: componentNames,
          failedComponents: failedComponents.map((component) => component.component),
          latestVersion,
          responseTime: Date.now() - startTime,
        },
      });
    } else {
      analytics.track({
        event: AnalyticsEvent.GET_COMPONENT_EXAMPLES,
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
      results: exampleResults,
    });
  } catch (error) {
    analytics.trackError({
      error,
      errorEvent: AnalyticsErrorEvent.GET_COMPONENT_EXAMPLES_ERROR,
      fallbackMessage: "Failed to get component examples",
      properties: {
        endpoint,
        components: componentNames,
        responseTime: Date.now() - startTime,
      },
    });

    return c.json(
      {
        error: "Failed to get component examples",
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
