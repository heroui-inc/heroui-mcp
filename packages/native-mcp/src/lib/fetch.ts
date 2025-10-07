/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Fetch utilities for HeroUI Native MCP API endpoints
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
 */
export async function fetchApi<T = any>(
  endpoint: string,
  configUrl?: string,
  options?: RequestInit,
): Promise<T> {
  const url = buildApiUrl(endpoint, configUrl);

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = new Error(`API error: ${response.status} ${response.statusText}`) as any;
    error.status = response.status;
    throw error;
  }

  return response.json() as Promise<T>;
}