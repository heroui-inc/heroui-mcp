/* eslint-disable @typescript-eslint/no-explicit-any */
import type {Env} from "../types";

import {zValidator} from "@hono/zod-validator";
import {Hono} from "hono";
import {z} from "zod";

import {REACT_LIBRARY_NAME} from "../contants";
import {getAnalytics, getDataService, initAnalytics} from "../services";

/**
 * Zod schema for validating components request body
 */
const ComponentsRequestSchema = z.object({
  components: z
    .array(z.string().trim().min(1, "Component name cannot be empty"))
    .min(1, "Components array cannot be empty")
    .refine(
      (components) => components.every((c) => c.trim().length > 0),
      "All component names must be non-empty strings",
    ),
});

const components = new Hono<{Bindings: Env}>();

const LIBRARY_NAME = REACT_LIBRARY_NAME;

// List components
components.get("/", async (c) => {
  const startTime = Date.now();

  initAnalytics(c.env);
  const analytics = getAnalytics();

  try {
    const service = await getDataService(c.env);
    // Always use latest version
    const componentsList = await service.listComponents(LIBRARY_NAME);

    // Get the latest version
    const latestVersion = await service.getLatestVersion(LIBRARY_NAME);

    const responseTime = Date.now() - startTime;

    // Track successful request
    analytics?.trackComponentSearch("api-user", {
      query: LIBRARY_NAME,
      resultsCount: componentsList.length,
      searchTime: responseTime,
    });

    analytics?.trackMcpSuccess("api-user", {
      method: "GET",
      toolName: "list-components",
      responseTime,
      responseSize: componentsList.length,
    });

    return c.json({
      latestVersion: latestVersion || "unknown",
      components: componentsList,
      count: componentsList.length,
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error("Error listing components:", error);

    // Track error
    analytics?.trackMcpError("api-user", {
      method: "GET",
      toolName: "list-components",
      error: error instanceof Error ? error.message : "Unknown error",
      responseTime,
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

// Get component details (multiple components)
components.post("/", zValidator("json", ComponentsRequestSchema), async (c) => {
  const startTime = Date.now();
  const {components: componentNames} = c.req.valid("json");

  initAnalytics(c.env);
  const analytics = getAnalytics();

  analytics?.trackMcpRequest("api-user", {
    method: "POST",
    toolName: "get-components",
    requestSize: componentNames.length,
  });

  try {
    const service = await getDataService(c.env);
    const results = await service.getComponents(LIBRARY_NAME, componentNames);
    const latestVersion = await service.getLatestVersion(LIBRARY_NAME);

    const responseTime = Date.now() - startTime;

    analytics?.trackMcpSuccess("api-user", {
      method: "POST",
      toolName: "get-components",
      responseTime,
      responseSize: JSON.stringify(results).length,
    });

    results.forEach((result) => {
      if (!result.error) {
        analytics?.trackFeatureUsage("api-user", "component-details", {
          library: LIBRARY_NAME,
          component: result.component,
        });
      }
    });

    return c.json({
      version: latestVersion || "unknown",
      results,
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error("Error getting components:", error);

    analytics?.trackMcpError("api-user", {
      method: "POST",
      toolName: "get-components",
      error: error instanceof Error ? error.message : "Unknown error",
      responseTime,
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

// Get component props (multiple components)
components.post("/props", zValidator("json", ComponentsRequestSchema), async (c) => {
  const startTime = Date.now();
  const {components: componentNames} = c.req.valid("json");

  initAnalytics(c.env);
  const analytics = getAnalytics();

  analytics?.trackToolInvocation("api-user", {
    toolName: "get-component-props",
    parameters: {library: LIBRARY_NAME, components: componentNames},
    context: "api",
  });

  try {
    const service = await getDataService(c.env);
    const results = await service.getComponents(LIBRARY_NAME, componentNames);
    const latestVersion = await service.getLatestVersion(LIBRARY_NAME);

    const propsResults = results.map((result) => {
      if (result.error || !result.data) {
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

    const responseTime = Date.now() - startTime;

    analytics?.trackToolSuccess("api-user", {
      toolName: "get-component-props",
      executionTime: responseTime,
      resultSize: JSON.stringify(propsResults).length,
    });

    propsResults.forEach((result) => {
      if (!result.error) {
        analytics?.trackFeatureUsage("api-user", "component-props", {
          library: LIBRARY_NAME,
          component: result.component,
        });
      }
    });

    return c.json({
      version: latestVersion || "unknown",
      results: propsResults,
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error("Error getting component props:", error);

    analytics?.trackToolError("api-user", {
      toolName: "get-component-props",
      error: error instanceof Error ? error.message : "Unknown error",
      executionTime: responseTime,
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

// Get component examples (multiple components)
components.post("/examples", zValidator("json", ComponentsRequestSchema), async (c) => {
  const startTime = Date.now();
  const {components: componentNames} = c.req.valid("json");

  initAnalytics(c.env);
  const analytics = getAnalytics();

  analytics?.trackToolInvocation("api-user", {
    toolName: "get-component-examples",
    parameters: {library: LIBRARY_NAME, components: componentNames},
    context: "api",
  });

  try {
    const service = await getDataService(c.env);
    const results = await service.getComponents(LIBRARY_NAME, componentNames);
    const latestVersion = await service.getLatestVersion(LIBRARY_NAME);

    const exampleResults = results.map((result) => {
      if (result.error || !result.data) {
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

    const responseTime = Date.now() - startTime;

    analytics?.trackToolSuccess("api-user", {
      toolName: "get-component-examples",
      executionTime: responseTime,
      resultSize: JSON.stringify(exampleResults).length,
    });

    exampleResults.forEach((result) => {
      if (!result.error) {
        analytics?.trackComponentGenerated("api-user", {
          componentType: result.component,
          framework: "react",
          features: [],
          generationTime: responseTime,
        });
      }
    });

    return c.json({
      version: latestVersion || "unknown",
      results: exampleResults,
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error("Error getting component examples:", error);

    analytics?.trackToolError("api-user", {
      toolName: "get-component-examples",
      error: error instanceof Error ? error.message : "Unknown error",
      executionTime: responseTime,
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

// Get component source code (multiple components)
components.post("/source", zValidator("json", ComponentsRequestSchema), async (c) => {
  const {components: componentNames} = c.req.valid("json");

  initAnalytics(c.env);
  const analytics = getAnalytics();

  try {
    const service = await getDataService(c.env);
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

    sourceResults.forEach((result) => {
      if (!result.error) {
        analytics?.trackFeatureUsage("api-user", "component-source", {
          library: LIBRARY_NAME,
          component: result.component,
        });
      }
    });

    return c.json({
      version: latestVersion || "unknown",
      results: sourceResults,
    });
  } catch (error) {
    console.error("Error getting component source:", error);

    return c.json(
      {
        error: "Failed to get component source code",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

// Get component styles (multiple components)
components.post("/styles", zValidator("json", ComponentsRequestSchema), async (c) => {
  const {components: componentNames} = c.req.valid("json");

  initAnalytics(c.env);
  const analytics = getAnalytics();

  try {
    const service = await getDataService(c.env);
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

    styleResults.forEach((result) => {
      if (!result.error) {
        analytics?.trackFeatureUsage("api-user", "component-styles", {
          library: LIBRARY_NAME,
          component: result.component,
        });
      }
    });

    return c.json({
      version: latestVersion || "unknown",
      results: styleResults,
    });
  } catch (error) {
    console.error("Error getting component styles:", error);

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
