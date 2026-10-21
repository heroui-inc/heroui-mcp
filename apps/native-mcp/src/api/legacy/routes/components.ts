import type {HonoContext} from "../../types/context";
import type {ComponentProp} from "@shared/types/data";

import {zValidator} from "@hono/zod-validator";
import {Hono} from "hono";
import {z} from "zod";

import {HEROUI_NATIVE_GITHUB_BASE} from "../../../extraction/constants";
import {CACHE_CONTROL} from "../../constants";
import {AnalyticsErrorEvent, AnalyticsEvent} from "../../types/analytics";
import {getLegacyComponentService} from "../services/component-adapter";

const ComponentsRequestSchema = z.object({
  components: z
    .array(z.string().trim().min(1, "Component name cannot be empty"))
    .min(1, "Components array cannot be empty")
    .refine(
      (components) => components.every((c) => c.trim().length > 0),
      "All component names must be non-empty strings",
    ),
});

const ExamplesRequestSchema = z.object({
  examples: z
    .array(z.string().trim().min(1, "Example name cannot be empty"))
    .min(1, "Examples array cannot be empty")
    .refine(
      (examples) => examples.every((e) => e.trim().length > 0),
      "All example names must be non-empty strings",
    ),
});

const components = new Hono<HonoContext>();

// List all components
components.get("/", async (c) => {
  const endpoint = "list-components";
  const startTime = Date.now();
  const analytics = c.get("analytics");

  try {
    const service = await getLegacyComponentService(c.env);
    const componentsList = await service.listComponents();
    const examplesList = await service.listExamples();
    const latestVersion = await service.getLatestVersion();

    analytics.track({
      event: AnalyticsEvent.LIST_COMPONENTS,
      properties: {
        endpoint,
        apiVersion: "legacy",
        componentsCount: componentsList.length,
        examplesCount: examplesList.length,
        latestVersion,
        responseTime: Date.now() - startTime,
      },
    });

    c.header("Cache-Control", CACHE_CONTROL.LATEST);

    return c.json({
      latestVersion: latestVersion || "unknown",
      components: componentsList,
      examples: examplesList,
      count: componentsList.length,
    });
  } catch (error) {
    analytics.trackError({
      error,
      errorEvent: AnalyticsErrorEvent.LIST_COMPONENTS_ERROR,
      fallbackMessage: "Failed to list components",
      properties: {
        endpoint,
        apiVersion: "legacy",
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

// Get component info
components.post("/", zValidator("json", ComponentsRequestSchema), async (c) => {
  const endpoint = "get-components";
  const startTime = Date.now();
  const analytics = c.get("analytics");
  const {components: componentNames} = c.req.valid("json");

  try {
    const service = await getLegacyComponentService(c.env);
    const results = await service.getComponents(componentNames);
    const latestVersion = await service.getLatestVersion();

    const failedComponents = results.filter((result) => result.error);

    if (failedComponents.length > 0) {
      analytics.trackError({
        error: failedComponents.map((result) => `${result.component}: ${result.error}`).join(", "),
        errorEvent: AnalyticsErrorEvent.GET_COMPONENTS_ERROR,
        properties: {
          endpoint,
          apiVersion: "legacy",
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
          apiVersion: "legacy",
          components: componentNames,
          latestVersion,
          responseTime: Date.now() - startTime,
        },
      });
    }

    c.header("Cache-Control", CACHE_CONTROL.LATEST);

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
        apiVersion: "legacy",
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
    const service = await getLegacyComponentService(c.env);
    const results = await service.getComponents(componentNames);
    const latestVersion = await service.getLatestVersion();

    const failedComponents: typeof results = [];

    // Format props for each component
    const propsResults = results.map((result) => {
      if (!result.data) {
        failedComponents.push(result);

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
        Object.entries(componentData.props).forEach(([propName, prop]: [string, ComponentProp]) => {
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
        Object.values(componentData.subComponents).forEach(
          (sub: {name: string; props: Record<string, ComponentProp>}) => {
            propsText += `### ${sub.name}\n\n`;
            if (sub.props && Object.keys(sub.props).length > 0) {
              Object.entries(sub.props).forEach(([propName, prop]: [string, ComponentProp]) => {
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
          },
        );
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
          apiVersion: "legacy",
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
          apiVersion: "legacy",
          components: componentNames,
          latestVersion,
          responseTime: Date.now() - startTime,
        },
      });
    }

    // Set cache headers
    c.header("Cache-Control", CACHE_CONTROL.LATEST);

    return c.json({
      results: propsResults,
      version: latestVersion || "unknown",
      latestVersion: latestVersion || "unknown",
    });
  } catch (error) {
    analytics.trackError({
      error,
      errorEvent: AnalyticsErrorEvent.GET_COMPONENT_PROPS_ERROR,
      fallbackMessage: "Failed to get component props",
      properties: {
        endpoint,
        apiVersion: "legacy",
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
components.post("/examples", zValidator("json", ExamplesRequestSchema), async (c) => {
  const endpoint = "get-component-examples";
  const startTime = Date.now();
  const {examples: exampleNames} = c.req.valid("json");
  const analytics = c.get("analytics");

  try {
    const latestVersion = await (await getLegacyComponentService(c.env)).getLatestVersion();
    const baseUrl = HEROUI_NATIVE_GITHUB_BASE;
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

    const failedExamples = exampleResults.filter((result) => result.error);

    // Collect dependencies from the examples
    // Use a timeout to prevent dependency collection from blocking the response
    let dependencies: Array<{name: string; path: string; content: string}> = [];

    try {
      const {collectExampleDependencies} = await import("../../lib/dependency-resolver");

      // Set a timeout for dependency collection (15 seconds max)
      const dependencyTimeout = new Promise<Array<{name: string; path: string; content: string}>>(
        (_, reject) => {
          setTimeout(() => reject(new Error("Dependency collection timeout")), 15000);
        },
      );

      dependencies = await Promise.race([
        collectExampleDependencies(exampleNames, baseUrl),
        dependencyTimeout,
      ]);
    } catch (error) {
      // Log warning but don't fail the request - examples are more important than dependencies
      analytics.trackError({
        error,
        errorEvent: AnalyticsErrorEvent.GET_COMPONENT_EXAMPLES_DEPENDENCIES_WARNING,
        properties: {
          endpoint,
          apiVersion: "legacy",
          examples: exampleNames,
          latestVersion,
          responseTime: Date.now() - startTime,
        },
      });
    }

    if (failedExamples.length > 0) {
      analytics.trackError({
        error: failedExamples.map((result) => `${result.example}: ${result.error}`).join(", "),
        errorEvent: AnalyticsErrorEvent.GET_COMPONENT_EXAMPLES_ERROR,
        properties: {
          endpoint,
          apiVersion: "legacy",
          examples: exampleNames,
          failedExamples: failedExamples.map((result) => result.example),
          dependencies: dependencies.map((dependency) => dependency.name),
          latestVersion,
          responseTime: Date.now() - startTime,
        },
      });
    } else {
      analytics.track({
        event: AnalyticsEvent.GET_COMPONENT_EXAMPLES,
        properties: {
          endpoint,
          apiVersion: "legacy",
          examples: exampleNames,
          dependencies: dependencies.map((dependency) => dependency.name),
          latestVersion,
          responseTime: Date.now() - startTime,
        },
      });
    }

    // Set cache headers
    c.header("Cache-Control", CACHE_CONTROL.LATEST);

    return c.json({
      results: exampleResults,
      dependencies,
      version: latestVersion || "unknown",
    });
  } catch (error) {
    analytics.trackError({
      error,
      errorEvent: AnalyticsErrorEvent.GET_COMPONENT_EXAMPLES_ERROR,
      fallbackMessage: "Failed to get component examples",
      properties: {
        endpoint,
        apiVersion: "legacy",
        examples: exampleNames,
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

export {components};
