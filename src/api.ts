/* eslint-disable import/order */
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * HeroUI MCP API Server
 *
 * This is a Cloudflare Worker that serves component data from R2
 * It provides REST API endpoints for the STDIO client to consume
 */

// Import polyfills first - must be before AWS SDK imports
import "./lib/domparser-polyfill";

import {Hono} from "hono";
import {cors} from "hono/cors";

import {getAnalytics, initializeAnalytics} from "./lib/analytics";
import {packageInfo} from "./lib/package-info";
import {ComponentDataServiceR2} from "./services/component-data-service-r2";

type Env = {
  CLOUDFLARE_ACCOUNT_ID?: string;
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
  R2_BUCKET_NAME?: string;
  APP_ENV?: string;
  POSTHOG_API_KEY?: string;
  POSTHOG_HOST?: string;
};

const app = new Hono<{Bindings: Env}>();

// CORS configuration
app.use(
  "*",
  cors({
    origin: "*", // Allow all origins since this is a public API
    credentials: false,
    allowHeaders: ["Content-Type", "Accept"],
  }),
);

// Initialize R2 data service once
let dataService: ComponentDataServiceR2 | null = null;

// Initialize analytics
let analyticsInitialized = false;

function initAnalytics(env: Record<string, any>) {
  if (!analyticsInitialized) {
    const posthogKey = env.POSTHOG_API_KEY || process.env.POSTHOG_API_KEY;
    const posthogHost = env.POSTHOG_HOST || process.env.POSTHOG_HOST || "https://app.posthog.com";
    const environment = env.APP_ENV || process.env.APP_ENV || "development";

    initializeAnalytics(
      posthogKey
        ? {
            apiKey: posthogKey,
            host: posthogHost,
            environment,
          }
        : null,
    );
    analyticsInitialized = true;
  }
}

async function getDataService(env: Record<string, any>): Promise<ComponentDataServiceR2> {
  if (!dataService) {
    const r2AccountId = env.CLOUDFLARE_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID;
    const r2AccessKeyId = env.R2_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID;
    const r2SecretAccessKey = env.R2_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY;
    const r2Bucket = env.R2_BUCKET_NAME || process.env.R2_BUCKET_NAME || "heroui-mcp";

    if (!r2AccountId || !r2AccessKeyId || !r2SecretAccessKey) {
      throw new Error("R2 credentials not configured");
    }

    const r2Endpoint = `https://${r2AccountId}.r2.cloudflarestorage.com`;

    dataService = new ComponentDataServiceR2({
      accountId: r2AccountId,
      accessKeyId: r2AccessKeyId,
      secretAccessKey: r2SecretAccessKey,
      bucketName: r2Bucket,
      endpoint: r2Endpoint,
    });
  }

  return dataService;
}

// Root endpoint - API info
app.get("/", (c) => {
  return c.json({
    name: "HeroUI MCP API",
    version: packageInfo.version,
    description: "REST API for HeroUI component documentation",
    endpoints: {
      "/": "API information",
      "/health": "Health check",
      "/components/:library": "List components",
      "/components/:library/:component": "Get component details",
      "/components/:library/:component/props": "Get component props",
      "/components/:library/:component/example": "Get component example",
      "/versions": "Get version information",
      "/versions/:package": "Check specific package version",
    },
  });
});

// Health check
app.get("/health", (c) => {
  return c.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    environment: c.env?.APP_ENV || process.env.APP_ENV || "development",
  });
});

// List components
app.get("/components/:library", async (c) => {
  const library = c.req.param("library") as "heroui" | "native";
  const version = c.req.query("version");
  const startTime = Date.now();

  initAnalytics(c.env);
  const analytics = getAnalytics();

  if (!["heroui", "native"].includes(library)) {
    return c.json({error: "Invalid library. Must be 'heroui' or 'native'"}, 400);
  }

  try {
    const service = await getDataService(c.env);
    const components = await service.listComponents(library, version);

    const responseTime = Date.now() - startTime;

    // Track successful request
    analytics?.trackComponentSearch("api-user", {
      query: library,
      filters: {version},
      resultsCount: components.length,
      searchTime: responseTime,
    });

    analytics?.trackMcpSuccess("api-user", {
      method: "GET",
      toolName: "list-components",
      responseTime,
      responseSize: components.length,
    });

    return c.json({
      library,
      version: version || "latest",
      components,
      count: components.length,
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
app.get("/components/:library/:component", async (c) => {
  const library = c.req.param("library") as "heroui" | "native";
  const component = c.req.param("component");
  const version = c.req.query("version");
  const startTime = Date.now();

  initAnalytics(c.env);
  const analytics = getAnalytics();

  if (!["heroui", "native"].includes(library)) {
    return c.json({error: "Invalid library. Must be 'heroui' or 'native'"}, 400);
  }

  analytics?.trackMcpRequest("api-user", {
    method: "GET",
    toolName: "get-component",
    requestSize: 0,
  });

  try {
    const service = await getDataService(c.env);
    const data = await service.getComponent(library, component, version);

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

    const responseTime = Date.now() - startTime;

    // Track successful request
    analytics?.trackMcpSuccess("api-user", {
      method: "GET",
      toolName: "get-component",
      responseTime,
      responseSize: JSON.stringify(data).length,
    });

    analytics?.trackFeatureUsage("api-user", "component-details", {
      library,
      component,
      version: version || "latest",
    });

    return c.json({
      library,
      component,
      version: version || "latest",
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
app.get("/components/:library/:component/props", async (c) => {
  const library = c.req.param("library") as "heroui" | "native";
  const component = c.req.param("component");
  const version = c.req.query("version");
  const startTime = Date.now();

  initAnalytics(c.env);
  const analytics = getAnalytics();

  if (!["heroui", "native"].includes(library)) {
    return c.json({error: "Invalid library. Must be 'heroui' or 'native'"}, 400);
  }

  analytics?.trackToolInvocation("api-user", {
    toolName: "get-component-props",
    parameters: {library, component, version},
    context: "api",
  });

  try {
    const service = await getDataService(c.env);
    const data = await service.getComponent(library, component, version);

    if (!data) {
      return c.json({error: `Component ${component} not found`}, 404);
    }

    // Format props as markdown
    const libraryName = library === "heroui" ? "HeroUI" : "HeroUI Native";
    const versionText = version ? ` (${version})` : " (latest)";

    let propsText = `# ${component} Component Props - ${libraryName}${versionText}\n\n`;

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
      library,
      component,
      version: version || "latest",
    });

    return c.json({
      library,
      component,
      version: version || "latest",
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

// Get component example
app.get("/components/:library/:component/example", async (c) => {
  const library = c.req.param("library") as "heroui" | "native";
  const component = c.req.param("component");
  const version = c.req.query("version");
  const startTime = Date.now();

  initAnalytics(c.env);
  const analytics = getAnalytics();

  if (!["heroui", "native"].includes(library)) {
    return c.json({error: "Invalid library. Must be 'heroui' or 'native'"}, 400);
  }

  analytics?.trackToolInvocation("api-user", {
    toolName: "get-component-example",
    parameters: {library, component, version},
    context: "api",
  });

  try {
    const service = await getDataService(c.env);
    const data = await service.getComponent(library, component, version);

    if (!data) {
      return c.json({error: `Component ${component} not found`}, 404);
    }

    // Format example
    const libraryName = library === "heroui" ? "HeroUI" : "HeroUI Native";
    const versionText = version ? ` (${version})` : " (latest)";
    const importStatement =
      library === "heroui"
        ? `import { ${component} } from '@heroui/react';`
        : `import { ${component} } from '@heroui/native';`;

    let exampleText = `// ${component} Component Example - ${libraryName}${versionText}\n\n`;
    exampleText += `${importStatement}\n\n`;

    // Generate a basic example since usage property doesn't exist on ComponentData
    {
      exampleText += `export default function Example() {\n`;
      exampleText += `  return (\n`;
      exampleText += `    <${component}>\n`;
      exampleText += `      Content\n`;
      exampleText += `    </${component}>\n`;
      exampleText += `  );\n`;
      exampleText += `}\n`;
    }

    const responseTime = Date.now() - startTime;

    // Track successful request
    analytics?.trackToolSuccess("api-user", {
      toolName: "get-component-example",
      executionTime: responseTime,
      resultSize: exampleText.length,
    });

    analytics?.trackComponentGenerated("api-user", {
      componentType: component,
      framework: library === "heroui" ? "react" : "react-native",
      features: [],
      generationTime: responseTime,
    });

    return c.json({
      library,
      component,
      version: version || "latest",
      example: exampleText,
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error("Error getting component example:", error);

    analytics?.trackToolError("api-user", {
      toolName: "get-component-example",
      error: error instanceof Error ? error.message : "Unknown error",
      executionTime: responseTime,
    });

    return c.json(
      {
        error: "Failed to get component example",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

// Get version information
app.get("/versions", async (c) => {
  const startTime = Date.now();
  initAnalytics(c.env);
  const analytics = getAnalytics();

  try {
    const service = await getDataService(c.env);
    const heroUIVersions = await service.listVersions("heroui");
    const nativeVersions = await service.listVersions("native");

    const responseTime = Date.now() - startTime;

    analytics?.trackFeatureUsage("api-user", "version-check", {
      endpoint: "all-versions",
      responseTime,
    });

    return c.json({
      heroui: {
        latest: heroUIVersions[0] || "unknown",
        versions: heroUIVersions,
      },
      native: {
        latest: nativeVersions[0] || "unknown",
        versions: nativeVersions,
      },
      mcp: {
        current: packageInfo.version,
      },
    });
  } catch (error) {
    console.error("Error getting versions:", error);

    return c.json(
      {
        error: "Failed to get version information",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

// Check specific package version
app.get("/versions/:package", async (c) => {
  const pkg = c.req.param("package");
  const startTime = Date.now();
  initAnalytics(c.env);
  const analytics = getAnalytics();

  if (!["heroui", "native", "mcp"].includes(pkg)) {
    return c.json({error: "Invalid package. Must be 'heroui', 'native', or 'mcp'"}, 400);
  }

  try {
    if (pkg === "mcp") {
      return c.json({
        package: "mcp",
        currentVersion: packageInfo.version,
        latestVersion: packageInfo.version,
        isLatest: true,
      });
    }

    const service = await getDataService(c.env);
    const library = pkg as "heroui" | "native";
    const versions = await service.listVersions(library);
    const latestVersion = versions[0] || "unknown";

    const responseTime = Date.now() - startTime;

    analytics?.trackFeatureUsage("api-user", "version-check", {
      package: pkg,
      responseTime,
    });

    return c.json({
      package: pkg,
      currentVersion: latestVersion, // In API context, we always serve latest
      latestVersion,
      isLatest: true,
      availableVersions: versions,
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;

    analytics?.trackToolError("api-user", {
      toolName: "check-version",
      error: error instanceof Error ? error.message : "Unknown error",
      executionTime: responseTime,
    });

    console.error("Error checking version:", error);

    return c.json(
      {
        error: "Failed to check version",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      error: "Not found",
      message: "The requested endpoint does not exist",
    },
    404,
  );
});

// Error handler
app.onError((err, c) => {
  console.error("Unhandled error:", err);

  return c.json(
    {
      error: "Internal server error",
      message: "An unexpected error occurred",
    },
    500,
  );
});

// Export for Cloudflare Workers
export default app;

// For local development
export {app};
