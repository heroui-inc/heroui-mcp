/* eslint-disable import/order */
/**
 * Component Data Service - R2 Storage Implementation
 * Provides access to component data stored in Cloudflare R2
 */

// Import polyfills first - must be before AWS SDK imports
import "../lib/domparser-polyfill";

import type {ObjectStore} from "../lib/object-store";

import {createObjectStore} from "../lib/object-store";
import {ErrorCode, ErrorMessages, MCPError} from "../utils/error-handler";

/**
 * Component Data Service - R2 Implementation
 * Fetches component data from R2 bucket
 */
class ComponentService {
  private store: ObjectStore;
  private cache: Map<string, {data: unknown; timestamp: number}> = new Map();
  private CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

  constructor(store: ObjectStore) {
    this.store = store;
  }

  /**
   * Get data from R2 with caching
   */
  private async getFromR2<T>(key: string): Promise<T | null> {
    // Check cache first
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data as T;
    }

    try {
      const text = await this.store.get(key);

      if (text === null) {
        console.warn(`Key not found in R2: ${key}`);

        return null;
      }

      // Check if we got valid JSON
      if (!text || text.trim() === "") {
        throw new MCPError(
          ErrorMessages[ErrorCode.DATA_NOT_AVAILABLE]({
            details: `Empty data for key: ${key}`,
            key,
          }),
        );
      }

      let data: T;
      try {
        data = JSON.parse(text) as T;
      } catch {
        throw new MCPError(
          ErrorMessages[ErrorCode.MALFORMED_JSON]({
            error: `Invalid JSON in R2 object: ${key}`,
            key,
          }),
        );
      }

      // Update cache
      this.cache.set(key, {data, timestamp: Date.now()});

      return data;
    } catch (error) {
      // If it's already an MCPError, throw it
      if (error instanceof MCPError) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      if (errorMessage.includes("AccessDenied") || errorMessage.includes("403")) {
        throw new MCPError(
          ErrorMessages[ErrorCode.R2_CONNECTION_ERROR]({
            error: "Access denied to R2 bucket. Please check credentials.",
            key,
          }),
        );
      }

      // Generic R2 error
      console.error(`Error fetching from R2: ${key}`, error);
      throw new MCPError(
        ErrorMessages[ErrorCode.R2_CONNECTION_ERROR]({
          error: errorMessage,
          key,
        }),
      );
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get the combined context data for MCP initialization
   */
  async getContext(): Promise<{
    components: string[];
    docs: {
      paths: string[];
      categories: Array<{
        name: string;
        docs: Array<{title: string; path: string; description: string}>;
      }>;
    };
    version: string;
    timestamp: number;
  } | null> {
    try {
      const key = "native/v1/latest/ctx.json";
      const data = await this.getFromR2<{
        components: string[];
        docs: {
          paths: string[];
          categories: Array<{
            name: string;
            docs: Array<{title: string; path: string; description: string}>;
          }>;
        };
        version: string;
        timestamp: number;
      }>(key);

      return data;
    } catch (error) {
      console.error("Error getting context data:", error);
      throw error;
    }
  }
}

let componentService: ComponentService | null = null;

export const getComponentService = async (env: Record<string, any>): Promise<ComponentService> => {
  if (!componentService) {
    componentService = new ComponentService(createObjectStore(env));
  }

  return componentService;
};
