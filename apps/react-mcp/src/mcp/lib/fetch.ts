/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Fetch utilities for HeroUI React MCP API endpoints
 */
import {API_BASE_URL} from "../constants";

export interface VersionCheckResult {
  isLatest: boolean;
  currentVersion?: string;
  latestVersion: string;
  updateAvailable: boolean;
  message: string;
}

/**
 * Get the base API URL from config or environment
 */
export function getApiBaseUrl(configUrl?: string): string {
  return configUrl || API_BASE_URL;
}

/**
 * Build a full API URL with the given endpoint
 */
export function buildApiUrl(endpoint: string, configUrl?: string): string {
  const baseUrl = getApiBaseUrl(configUrl);

  return `${baseUrl}${endpoint}`;
}

/**
 * Make a JSON API request with standard headers
 * Automatically includes X-API-Key header if HEROUI_API_KEY environment variable is set
 */
export async function fetchApi<T = any>(
  endpoint: string,
  configUrl?: string,
  options?: RequestInit,
): Promise<T> {
  const url = buildApiUrl(endpoint, configUrl);

  // Read API key from environment
  const apiKey = process.env.HEROUI_API_KEY;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options?.headers as Record<string, string>) || {}),
  };

  // Automatically add API key if present
  if (apiKey) {
    headers["X-API-Key"] = apiKey;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorBody: string | null = null;
    try {
      errorBody = await response.text();

      if (errorBody && errorBody.length > 300) {
        errorBody =
          errorBody.substring(0, 150) + "..." + errorBody.substring(errorBody.length - 150);
      }
    } catch {
      // Ignore if we can't read the body
    }

    const error = new Error(`${response.status}: ${response.statusText}`) as any;
    error.status = response.status;
    error.statusText = response.statusText;
    error.url = url;
    error.body = errorBody;
    throw error;
  }

  return response.json() as Promise<T>;
}
