/**
 * Component-related API endpoints
 */

import type {Env} from "../types";

import {Hono} from "hono";

import {CACHE_CONTROL} from "../constants";
import {getAnalytics, getDataService, initAnalytics} from "../services";

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
components.post("/", async (c) => {
  const startTime = Date.now();
  const body = await c.req.json();
  const componentNames = body.components as string[];

  initAnalytics(c.env);
  const analytics = getAnalytics();

  analytics?.trackMcpRequest("api-user", {
    method: "POST",
    toolName: "get-components",
    requestSize: componentNames.length,
  });

  try {
    if (!componentNames || !Array.isArray(componentNames)) {
      return c.json(
        {
          error: "Invalid request",
          details: "components array is required",
        },
        400,
      );
    }

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
components.post("/props", async (c) => {
  const startTime = Date.now();

  initAnalytics(c.env);
  const analytics = getAnalytics();

  try {
    const body = await c.req.json();
    const componentNames = body.components as string[];

    if (!componentNames || !Array.isArray(componentNames)) {
      return c.json(
        {
          error: "Invalid request",
          details: "components array is required",
        },
        400,
      );
    }

    analytics?.trackMcpRequest("api-user", {
      method: "POST",
      toolName: "get-component-props",
      requestSize: componentNames.length,
    });

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
components.post("/examples", async (c) => {
  const startTime = Date.now();

  initAnalytics(c.env);
  const analytics = getAnalytics();

  try {
    const body = await c.req.json();
    const exampleNames = body.examples as string[];

    if (!exampleNames || !Array.isArray(exampleNames)) {
      return c.json(
        {
          error: "Invalid request",
          details: "examples array is required",
        },
        400,
      );
    }

    analytics?.trackMcpRequest("api-user", {
      method: "POST",
      toolName: "get-component-examples",
      requestSize: exampleNames.length,
    });

    const latestVersion = (await getDataService(c.env)).getLatestVersion();
    const baseUrl =
      "https://raw.githubusercontent.com/heroui-inc/heroui-native/refs/heads/alpha/example/src/app/(home)/components";

    // Fetch example files from GitHub
    const exampleResults = await Promise.all(
      exampleNames.map(async (exampleName) => {
        try {
          const url = `${baseUrl}/${exampleName}.tsx`;
          const response = await fetch(url);

          if (!response.ok) {
            return {
              example: exampleName,
              error: "Example file not found",
            };
          }

          const content = await response.text();

          return {
            example: exampleName,
            content,
          };
        } catch (error) {
          return {
            example: exampleName,
            error: error instanceof Error ? error.message : "Failed to fetch example",
          };
        }
      }),
    );

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

// Get component source code (bulk)
components.post("/source", async (c) => {
  const startTime = Date.now();

  initAnalytics(c.env);
  const analytics = getAnalytics();

  try {
    const body = await c.req.json();
    const componentNames = body.components as string[];

    if (!componentNames || !Array.isArray(componentNames)) {
      return c.json(
        {
          error: "Invalid request",
          details: "components array is required",
        },
        400,
      );
    }

    analytics?.trackMcpRequest("api-user", {
      method: "POST",
      toolName: "get-component-source",
      requestSize: componentNames.length,
    });

    const service = await getDataService(c.env);
    const results = await service.getComponents(componentNames);
    const latestVersion = await service.getLatestVersion();

    const branch = "alpha";
    const baseUrl = `https://raw.githubusercontent.com/heroui-inc/heroui-native/refs/heads/${branch}`;

    // Fetch source code from GitHub
    const sourceResults = await Promise.all(
      results.map(async (result) => {
        if (!result.data) {
          return {
            component: result.component,
            error: result.error || "Component not found",
          };
        }

        // Construct source file path
        // Assuming components are in src/components/{component-name}/{component-name}.tsx
        const componentPath = result.component
          .replace(/([A-Z])/g, "-$1")
          .toLowerCase()
          .replace(/^-/, "");
        const sourceUrl = `${baseUrl}/src/components/${componentPath}/${componentPath}.tsx`;

        try {
          const response = await fetch(sourceUrl);

          if (!response.ok) {
            // Try alternate path structure
            const altUrl = `${baseUrl}/src/components/${componentPath}/index.tsx`;
            const altResponse = await fetch(altUrl);

            if (!altResponse.ok) {
              return {
                component: result.component,
                error: "Source code not available",
              };
            }

            const sourceCode = await altResponse.text();

            return {
              component: result.component,
              filePath: `src/components/${componentPath}/index.tsx`,
              sourceCode,
              githubUrl: altUrl
                .replace("raw.githubusercontent.com", "github.com")
                .replace("/refs/heads/", "/blob/"),
            };
          }

          const sourceCode = await response.text();

          return {
            component: result.component,
            filePath: `src/components/${componentPath}/${componentPath}.tsx`,
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

    const responseTime = Date.now() - startTime;

    analytics?.trackMcpSuccess("api-user", {
      method: "POST",
      toolName: "get-component-source",
      responseTime,
      responseSize: JSON.stringify(sourceResults).length,
    });

    // Set cache headers
    c.header("Cache-Control", CACHE_CONTROL.LATEST);

    return c.json({
      results: sourceResults,
      version: latestVersion || "unknown",
      latestVersion: latestVersion || "unknown",
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error("Error getting component source:", error);

    analytics?.trackMcpError("api-user", {
      method: "POST",
      toolName: "get-component-source",
      error: error instanceof Error ? error.message : "Unknown error",
      responseTime,
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

export {components};
