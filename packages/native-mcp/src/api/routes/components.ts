/**
 * Component-related API endpoints
 */

import type {Env} from "../types";

import {zValidator} from "@hono/zod-validator";
import {Hono} from "hono";
import {z} from "zod";

import {CACHE_CONTROL} from "../constants";
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

/**
 * Zod schema for validating examples request body
 */
const ExamplesRequestSchema = z.object({
  examples: z
    .array(z.string().trim().min(1, "Example name cannot be empty"))
    .min(1, "Examples array cannot be empty")
    .refine(
      (examples) => examples.every((e) => e.trim().length > 0),
      "All example names must be non-empty strings",
    ),
});

const components = new Hono<{Bindings: Env}>();

// List all components
components.get("/", async (c) => {
  const startTime = Date.now();

  initAnalytics(c.env);
  const analytics = getAnalytics();

  try {
    const service = await getDataService(c.env);
    const componentsList = await service.listComponents();
    const examplesList = await service.listExamples();
    const latestVersion = await service.getLatestVersion();

    const responseTime = Date.now() - startTime;

    // Track successful request
    analytics?.trackComponentSearch("api-user", {
      query: "native",
      resultsCount: componentsList.length,
      searchTime: responseTime,
    });

    analytics?.trackMcpSuccess("api-user", {
      method: "GET",
      toolName: "list-components",
      responseTime,
      responseSize: componentsList.length,
    });

    // Set cache headers
    c.header("Cache-Control", CACHE_CONTROL.LATEST);

    return c.json({
      latestVersion: latestVersion || "unknown",
      components: componentsList,
      examples: examplesList,
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

// Get component details (bulk)
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
    const results = await service.getComponents(componentNames);
    const latestVersion = await service.getLatestVersion();

    const responseTime = Date.now() - startTime;

    analytics?.trackMcpSuccess("api-user", {
      method: "POST",
      toolName: "get-components",
      responseTime,
      responseSize: JSON.stringify(results).length,
    });

    // Set cache headers
    c.header("Cache-Control", CACHE_CONTROL.LATEST);

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

// Get component props (bulk)
components.post("/props", zValidator("json", ComponentsRequestSchema), async (c) => {
  const startTime = Date.now();
  const {components: componentNames} = c.req.valid("json");

  initAnalytics(c.env);
  const analytics = getAnalytics();

  analytics?.trackMcpRequest("api-user", {
    method: "POST",
    toolName: "get-component-props",
    requestSize: componentNames.length,
  });

  try {
    const service = await getDataService(c.env);
    const results = await service.getComponents(componentNames);
    const latestVersion = await service.getLatestVersion();

    // Format props for each component
    const propsResults = results.map((result) => {
      if (!result.data) {
        return {
          component: result.component,
          error: result.error || "Component not found",
        };
      }

      const componentData = result.data;
      const libraryName = "HeroUI Native";
      const versionText = ` (${latestVersion})`;
      let propsText = `# ${result.component} Component Props - ${libraryName}${versionText}\n\n`;

      if (componentData.description) {
        propsText += `${componentData.description}\n\n`;
      }

      if (componentData.props && Object.keys(componentData.props).length > 0) {
        propsText += "## Props\n\n";
        Object.entries(componentData.props).forEach(([propName, prop]: [string, any]) => {
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
        propsText += "No props documented for this component.\n";
      }

      // Add sub-components if available
      if (componentData.subComponents && Object.keys(componentData.subComponents).length > 0) {
        propsText += "\n## Sub-components\n\n";
        Object.values(componentData.subComponents).forEach((sub: any) => {
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

    analytics?.trackMcpSuccess("api-user", {
      method: "POST",
      toolName: "get-component-props",
      responseTime,
      responseSize: JSON.stringify(propsResults).length,
    });

    // Set cache headers
    c.header("Cache-Control", CACHE_CONTROL.LATEST);

    return c.json({
      results: propsResults,
      version: latestVersion || "unknown",
      latestVersion: latestVersion || "unknown",
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error("Error getting component props:", error);

    analytics?.trackMcpError("api-user", {
      method: "POST",
      toolName: "get-component-props",
      error: error instanceof Error ? error.message : "Unknown error",
      responseTime,
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

// Get component examples (bulk)
components.post("/examples", zValidator("json", ExamplesRequestSchema), async (c) => {
  const startTime = Date.now();
  const {examples: exampleNames} = c.req.valid("json");

  initAnalytics(c.env);
  const analytics = getAnalytics();

  analytics?.trackMcpRequest("api-user", {
    method: "POST",
    toolName: "get-component-examples",
    requestSize: exampleNames.length,
  });

  try {
    const latestVersion = (await getDataService(c.env)).getLatestVersion();
    const baseUrl = "https://raw.githubusercontent.com/heroui-inc/heroui-native/refs/heads/alpha";
    const examplesPath = `${baseUrl}/example/src/app/(home)/components`;

    // Helper function to simplify import paths in content
    const simplifyImportPaths = (content: string): string => {
      const importRegex = /import\s+((?:{[^}]+}|\*\s+as\s+\w+|\w+))\s+from\s+['"](\.[^'"]+)['"]/g;

      return content.replace(importRegex, (match, importClause, importPath) => {
        const segments = importPath.split("/").filter(Boolean);
        const lastSegment = segments[segments.length - 1];
        const fileName = lastSegment.replace(/^\.+/, "");

        return `import ${importClause} from './${fileName}'`;
      });
    };

    // Fetch example files from GitHub
    const exampleResults = await Promise.all(
      exampleNames.map(async (exampleName) => {
        try {
          const url = `${examplesPath}/${exampleName}.tsx`;
          const response = await fetch(url);

          if (!response.ok) {
            return {
              example: exampleName,
              error: "Example file not found",
            };
          }

          const content = await response.text();
          const simplifiedContent = simplifyImportPaths(content);

          return {
            example: exampleName,
            content: simplifiedContent,
          };
        } catch (error) {
          return {
            example: exampleName,
            error: error instanceof Error ? error.message : "Failed to fetch example",
          };
        }
      }),
    );

    // Collect dependencies from the examples
    let dependencies: Array<{name: string; path: string; content: string}> = [];

    try {
      const {collectExampleDependencies} = await import("../../lib/dependency-resolver");

      dependencies = await collectExampleDependencies(exampleNames, baseUrl);
    } catch (depError) {
      console.warn("Failed to collect dependencies:", depError);
      // Continue without dependencies
    }

    const responseTime = Date.now() - startTime;

    analytics?.trackMcpSuccess("api-user", {
      method: "POST",
      toolName: "get-component-examples",
      responseTime,
      responseSize: JSON.stringify(exampleResults).length,
    });

    // Set cache headers
    c.header("Cache-Control", CACHE_CONTROL.LATEST);

    return c.json({
      results: exampleResults,
      dependencies,
      version: latestVersion || "unknown",
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error("Error getting component examples:", error);

    analytics?.trackMcpError("api-user", {
      method: "POST",
      toolName: "get-component-examples",
      error: error instanceof Error ? error.message : "Unknown error",
      responseTime,
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

export {components};
