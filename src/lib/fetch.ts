/**
 * Fetch utilities for HeroUI MCP API endpoints
 */

import type {ComponentData} from "../types.js";

export interface VersionCheckResult {
  isLatest: boolean;
  currentVersion?: string;
  latestVersion: string;
  updateAvailable: boolean;
  message: string;
}

// Default API base URL
const DEFAULT_API_URL = "https://mcp.heroui.com";

/**
 * Generic fetch utility with error handling
 */
async function fetchJson<T>(url: string, options?: RequestInit, errorContext?: string): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const context = errorContext || `fetch ${url}`;
      throw new Error(`Failed to ${context}: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to fetch from ${url}: ${String(error)}`);
  }
}

/**
 * Creates an API URL
 */
function createApiUrl(path: string, baseUrl?: string): string {
  const base = baseUrl || process.env.HEROUI_API_URL || DEFAULT_API_URL;

  return `${base}${path}`;
}

/**
 * Creates a JSON-RPC request
 */
function createJsonRpcRequest(method: string, params?: unknown, id = 1) {
  return {
    jsonrpc: "2.0",
    method,
    params: params || {},
    id,
  };
}

/**
 * Calls a tool via JSON-RPC
 */
async function callToolRpc<T = unknown>(
  method: string,
  params?: unknown,
  baseUrl?: string,
): Promise<T> {
  const response = await fetchJson<{
    jsonrpc: "2.0";
    result?: T;
    error?: {code: number; message: string; data?: unknown};
    id: number;
  }>(
    createApiUrl("/", baseUrl),
    {
      method: "POST",
      body: JSON.stringify(
        createJsonRpcRequest(`tools/call`, {
          name: method,
          arguments: params,
        }),
      ),
    },
    `call tool ${method}`,
  );

  if (response.error) {
    throw new Error(`RPC Error (${response.error.code}): ${response.error.message}`);
  }

  return response.result as T;
}

/**
 * Fetches the list of all available components for a library
 */
export async function fetchComponentList(
  library: "heroui" | "native",
  version?: string,
  baseUrl?: string,
): Promise<string[]> {
  const result = await callToolRpc<{content: Array<{type: "text"; text: string}>}>(
    "list_components",
    {library, version},
    baseUrl,
  );

  // Parse the text response to extract component names
  const text = result.content[0]?.text || "";
  const lines = text.split("\n");
  const components: string[] = [];

  for (const line of lines) {
    if (line.startsWith("- ")) {
      components.push(line.substring(2).trim());
    }
  }

  return components;
}

/**
 * Fetches the properties/props for a specific component
 */
export async function fetchComponentProps(
  library: "heroui" | "native",
  component: string,
  version?: string,
  baseUrl?: string,
): Promise<ComponentData | null> {
  const result = await callToolRpc<{content: Array<{type: "text"; text: string}>}>(
    "get_component_props",
    {library, component, version},
    baseUrl,
  );

  const text = result.content[0]?.text || "";

  // Parse markdown response to extract component data
  const lines = text.split("\n");
  const componentData: ComponentData = {
    name: component,
    props: {},
  };

  let currentSection = "";
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Extract description from first paragraph
    if (i === 2 && !line.startsWith("#") && !line.startsWith("-") && line.trim()) {
      componentData.description = line.trim();
    }

    // Detect sections
    if (line.startsWith("## ")) {
      currentSection = line.substring(3).trim().toLowerCase();
      continue;
    }

    // Parse props
    if (currentSection === "props" && line.startsWith("- **")) {
      const match = line.match(/- \*\*([^*]+)\*\*: `([^`]+)`(?:\s*-\s*(.+))?/);
      if (match) {
        const [, propName, propType, description] = match;
        const defaultMatch = description?.match(/\(default: `([^`]+)`\)/);

        componentData.props[propName] = {
          name: propName,
          type: propType,
          description: description?.replace(/\s*\(default: `[^`]+`\)/, "").trim(),
          ...(defaultMatch && {default: defaultMatch[1]}),
        };
      }
    }

    // Extract import statement
    if (currentSection === "import" && i + 1 < lines.length) {
      if (lines[i + 1].includes("import")) {
        componentData.importStatement = lines[i + 1];
      }
    }
  }

  return Object.keys(componentData.props).length > 0 ? componentData : null;
}

/**
 * Fetches example code for a specific component
 */
export async function fetchComponentExample(
  library: "heroui" | "native",
  component: string,
  version?: string,
  baseUrl?: string,
): Promise<string> {
  const result = await callToolRpc<{content: Array<{type: "text"; text: string}>}>(
    "get_component_example",
    {library, component, version},
    baseUrl,
  );

  return result.content[0]?.text || "";
}

/**
 * Checks version for a package
 */
export async function checkVersion(
  pkg: "heroui" | "native" | "mcp",
  currentVersion?: string,
  baseUrl?: string,
): Promise<VersionCheckResult> {
  const result = await callToolRpc<{content: Array<{type: "text"; text: string}>}>(
    "check_version",
    {package: pkg, currentVersion},
    baseUrl,
  );

  const text = result.content[0]?.text || "";

  // Parse the markdown response
  const lines = text.split("\n");
  let latestVersion = "";
  let isLatest = false;
  let updateAvailable = false;

  for (const line of lines) {
    if (line.includes("Latest Version:")) {
      latestVersion = line.split(":")[1].trim().replace(/\*\*/g, "");
    }
    if (line.includes("✅ Up to date")) {
      isLatest = true;
    }
    if (line.includes("⚠️ Update available")) {
      updateAvailable = true;
    }
  }

  return {
    isLatest,
    currentVersion,
    latestVersion,
    updateAvailable,
    message: text,
  };
}

/**
 * Direct API endpoint for listing components (REST)
 */
export async function fetchComponentListDirect(
  library: "heroui" | "native",
  version?: string,
  baseUrl?: string,
): Promise<string[]> {
  return fetchJson<string[]>(
    createApiUrl(`/api/components/${library}${version ? `?version=${version}` : ""}`, baseUrl),
    undefined,
    `fetch ${library} component list`,
  );
}

/**
 * Direct API endpoint for component props (REST)
 */
export async function fetchComponentPropsDirect(
  library: "heroui" | "native",
  component: string,
  version?: string,
  baseUrl?: string,
): Promise<ComponentData | null> {
  return fetchJson<ComponentData | null>(
    createApiUrl(
      `/api/components/${library}/${component}${version ? `?version=${version}` : ""}`,
      baseUrl,
    ),
    undefined,
    `fetch ${library} ${component} props`,
  );
}

/**
 * Gets all HeroUI components
 */
export async function getAllHeroUIComponents(baseUrl?: string): Promise<string[]> {
  return fetchComponentList("heroui", undefined, baseUrl);
}

/**
 * Gets all Native components
 */
export async function getAllNativeComponents(baseUrl?: string): Promise<string[]> {
  return fetchComponentList("native", undefined, baseUrl);
}
