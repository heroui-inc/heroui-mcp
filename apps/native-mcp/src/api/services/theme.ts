/**
 * Service for accessing theme data from R2
 */

import type {ThemeSystem} from "@shared/types/theme";
import type {ObjectStore} from "../lib/object-store";

import {createObjectStore} from "../lib/object-store";

class ThemeService {
  private store: ObjectStore;

  constructor(store: ObjectStore) {
    this.store = store;
  }

  /**
   * Get the complete theme system data
   */
  async getThemeSystem(): Promise<ThemeSystem | null> {
    try {
      const bodyString = await this.store.get("native/v1/latest/theme.json");

      if (bodyString === null) {
        return null;
      }

      return JSON.parse(bodyString);
    } catch (error) {
      console.error("Error fetching theme system:", error);

      return null;
    }
  }

  /**
   * Get a specific theme
   */
  async getTheme(themeName: string): Promise<ThemeSystem["themes"][string] | null> {
    const themeSystem = await this.getThemeSystem();
    if (!themeSystem || !themeSystem.themes[themeName]) {
      return null;
    }

    return themeSystem.themes[themeName];
  }

  /**
   * Get available theme names
   */
  async getAvailableThemes(): Promise<string[]> {
    const themeSystem = await this.getThemeSystem();
    if (!themeSystem) {
      return [];
    }

    return Object.keys(themeSystem.themes);
  }

  /**
   * Get theme variables for a specific mode
   */
  async getThemeVariables(
    themeName: string,
    mode: "light" | "dark",
  ): Promise<ThemeSystem["themes"][string]["light"] | null> {
    const theme = await this.getTheme(themeName);
    if (!theme) {
      return null;
    }

    return theme[mode];
  }

  /**
   * Get the latest version from ctx.json (single source of truth)
   */
  async getLatestVersion(): Promise<string | null> {
    try {
      const bodyString = await this.store.get("native/v1/latest/ctx.json");

      if (bodyString === null) {
        return null;
      }

      const ctxData = JSON.parse(bodyString) as {
        version?: string;
      };

      return ctxData?.version || null;
    } catch (error) {
      console.error("Error fetching latest version from ctx.json:", error);

      return null;
    }
  }
}

let themeService: ThemeService | null = null;

export const getThemeService = async (env: Record<string, any>): Promise<ThemeService> => {
  if (!themeService) {
    themeService = new ThemeService(createObjectStore(env));
  }

  return themeService;
};
