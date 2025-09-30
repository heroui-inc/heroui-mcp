import type {Env} from "../types";

import {Hono} from "hono";

import {REACT_LIBRARY_NAME} from "../contants";
import {getAnalytics, getDataService, initAnalytics} from "../services";

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

// Get component details
components.get("/:component", async (c) => {
  const component = c.req.param("component");
  const startTime = Date.now();

  initAnalytics(c.env);
  const analytics = getAnalytics();

  analytics?.trackMcpRequest("api-user", {
    method: "GET",
    toolName: "get-component",
    requestSize: 0,
  });

  try {
    const service = await getDataService(c.env);
    // Always use latest version
    const data = await service.getComponent(LIBRARY_NAME, component);

    if (!data) {
      const responseTime = Date.now() - startTime;
      analytics?.trackMcpError("api-user", {
        method: "GET",
        toolName: "get-component",
        error: `Component ${component} not found`,
        errorCode: "404",
        responseTime,
      });

      return c.json({error: `Component ${component} not found`}, 404);
    }

    // Get the latest version
    const latestVersion = await service.getLatestVersion(LIBRARY_NAME);

    // Get the actual component name from the data (with correct casing)
    const allComponents = await service.getAllComponents(LIBRARY_NAME);
    let actualComponentName = component;

    if (allComponents) {
      // Find the actual component name with correct casing
      const foundComponent = Object.keys(allComponents).find(
        (key) => key.toLowerCase() === component.toLowerCase(),
      );
      if (foundComponent) {
        actualComponentName = foundComponent;
      }
    }

    const responseTime = Date.now() - startTime;

    // Track successful request
    analytics?.trackMcpSuccess("api-user", {
      method: "GET",
      toolName: "get-component",
      responseTime,
      responseSize: JSON.stringify(data).length,
    });

    analytics?.trackFeatureUsage("api-user", "component-details", {
      library: LIBRARY_NAME,
      component: actualComponentName,
    });

    return c.json({
      component: actualComponentName,
      version: latestVersion || "unknown",
      data,
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error("Error getting component:", error);

    analytics?.trackMcpError("api-user", {
      method: "GET",
      toolName: "get-component",
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

// Get component props
components.get("/:component/props", async (c) => {
  const component = c.req.param("component");
  const startTime = Date.now();

  initAnalytics(c.env);
  const analytics = getAnalytics();

  analytics?.trackToolInvocation("api-user", {
    toolName: "get-component-props",
    parameters: {library: LIBRARY_NAME, component},
    context: "api",
  });

  try {
    const service = await getDataService(c.env);
    // Always use latest version
    const data = await service.getComponent(LIBRARY_NAME, component);

    if (!data) {
      return c.json({error: `Component ${component} not found`}, 404);
    }

    // Get the latest version
    const latestVersion = await service.getLatestVersion(LIBRARY_NAME);

    // Get the actual component name from the data (with correct casing)
    const allComponents = await service.getAllComponents(LIBRARY_NAME);
    let actualComponentName = component;

    if (allComponents) {
      // Find the actual component name with correct casing
      const foundComponent = Object.keys(allComponents).find(
        (key) => key.toLowerCase() === component.toLowerCase(),
      );
      if (foundComponent) {
        actualComponentName = foundComponent;
      }
    }

    // Format props as markdown
    const libraryName = "HeroUI";
    const versionText = ` (${latestVersion})`;

    let propsText = `# ${actualComponentName} Component Props - ${libraryName}${versionText}\n\n`;

    if (data.description) {
      propsText += `${data.description}\n\n`;
    }

    if (data.props && Object.keys(data.props).length > 0) {
      propsText += "## Props\n\n";
      Object.entries(data.props).forEach(([propName, prop]) => {
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

    const responseTime = Date.now() - startTime;

    // Track successful request
    analytics?.trackToolSuccess("api-user", {
      toolName: "get-component-props",
      executionTime: responseTime,
      resultSize: propsText.length,
    });

    analytics?.trackFeatureUsage("api-user", "component-props", {
      library: LIBRARY_NAME,
      component: actualComponentName,
    });

    return c.json({
      component: actualComponentName,
      version: latestVersion || "unknown",
      props: propsText,
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

// Get component examples
components.get("/:component/examples", async (c) => {
  const component = c.req.param("component");
  const startTime = Date.now();

  initAnalytics(c.env);
  const analytics = getAnalytics();

  analytics?.trackToolInvocation("api-user", {
    toolName: "get-component-examples",
    parameters: {library: LIBRARY_NAME, component},
    context: "api",
  });

  try {
    const service = await getDataService(c.env);
    // Always use latest version
    const data = await service.getComponent(LIBRARY_NAME, component);

    if (!data) {
      return c.json({error: `Component ${component} not found`}, 404);
    }

    // Get the latest version
    const latestVersion = await service.getLatestVersion(LIBRARY_NAME);

    // Get the actual component name from the data (with correct casing)
    const allComponents = await service.getAllComponents(LIBRARY_NAME);
    let actualComponentName = component;

    if (allComponents) {
      // Find the actual component name with correct casing
      const foundComponent = Object.keys(allComponents).find(
        (key) => key.toLowerCase() === component.toLowerCase(),
      );
      if (foundComponent) {
        actualComponentName = foundComponent;
      }
    }

    // Return examples array if they exist, otherwise return a default example
    const examples = data.examples || [];

    // If no examples, provide a default one
    if (examples.length === 0) {
      const libraryName = "HeroUI";
      const versionText = ` (${latestVersion})`;
      const importStatement = `import { ${actualComponentName} } from '@heroui/react';`;

      let exampleText = `// ${actualComponentName} Component Example - ${libraryName}${versionText}\n\n`;
      exampleText += `${importStatement}\n\n`;
      exampleText += `export default function Example() {\n`;
      exampleText += `  return (\n`;
      exampleText += `    <${actualComponentName}>\n`;
      exampleText += `      Content\n`;
      exampleText += `    </${actualComponentName}>\n`;
      exampleText += `  );\n`;
      exampleText += `}\n`;

      examples.push({
        name: "basic",
        content: exampleText,
      });
    }

    const responseTime = Date.now() - startTime;

    // Track successful request
    const totalSize = examples.reduce((acc, ex) => acc + ex.content.length, 0);
    analytics?.trackToolSuccess("api-user", {
      toolName: "get-component-examples",
      executionTime: responseTime,
      resultSize: totalSize,
    });

    analytics?.trackComponentGenerated("api-user", {
      componentType: component,
      framework: "react",
      features: [],
      generationTime: responseTime,
    });

    return c.json({
      component: actualComponentName,
      version: latestVersion || "unknown",
      examples,
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

// Get component source code
components.get("/:component/source", async (c) => {
  const component = c.req.param("component");

  initAnalytics(c.env);
  const analytics = getAnalytics();

  try {
    const service = await getDataService(c.env);
    // Always use latest version
    const data = await service.getComponent(LIBRARY_NAME, component);

    if (!data || !data.links?.source) {
      return c.json({error: `Source code not available for ${component}`}, 404);
    }

    // Get the latest version
    const latestVersion = await service.getLatestVersion(LIBRARY_NAME);

    // Construct GitHub raw URL using latest version
    const branch = latestVersion ? latestVersion.replace(/^v/, "") : "v3";
    const baseUrl = `https://raw.githubusercontent.com/heroui-inc/heroui/refs/heads/${branch}`;
    const sourceUrl = `${baseUrl}/packages/react/src/components/${data.links.source}`;

    // Fetch source code from GitHub
    const response = await fetch(sourceUrl);
    if (!response.ok) {
      return c.json({error: `Failed to fetch source code from GitHub`}, 500);
    }

    const sourceCode = await response.text();

    analytics?.trackFeatureUsage("api-user", "component-source", {
      library: LIBRARY_NAME,
      component,
    });

    return c.json({
      component,
      version: latestVersion || "unknown",
      filePath: data.links.source,
      sourceCode,
      githubUrl: sourceUrl
        .replace("raw.githubusercontent.com", "github.com")
        .replace("/refs/heads/", "/blob/"),
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

// Get component styles
components.get("/:component/styles", async (c) => {
  const component = c.req.param("component");

  initAnalytics(c.env);
  const analytics = getAnalytics();

  try {
    const service = await getDataService(c.env);
    // Always use latest version
    const data = await service.getComponent(LIBRARY_NAME, component);

    if (!data || !data.links?.styles) {
      return c.json({error: `Styles not available for ${component}`}, 404);
    }

    // Get the latest version
    const latestVersion = await service.getLatestVersion(LIBRARY_NAME);

    // Construct GitHub raw URL using latest version
    const branch = latestVersion ? latestVersion.replace(/^v/, "") : "v3";
    const baseUrl = `https://raw.githubusercontent.com/heroui-inc/heroui/refs/heads/${branch}`;
    const stylesUrl = `${baseUrl}/packages/styles/components/${data.links.styles}`;

    // Fetch styles from GitHub
    const response = await fetch(stylesUrl);
    if (!response.ok) {
      return c.json({error: `Failed to fetch styles from GitHub`}, 500);
    }

    const stylesCode = await response.text();

    analytics?.trackFeatureUsage("api-user", "component-styles", {
      library: LIBRARY_NAME,
      component,
    });

    return c.json({
      component,
      version: latestVersion || "unknown",
      filePath: data.links.styles,
      stylesCode,
      githubUrl: stylesUrl
        .replace("raw.githubusercontent.com", "github.com")
        .replace("/refs/heads/", "/blob/"),
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
