/**
 * Legacy Theme Service Adapter
 * Bridges old service interface to new service implementation
 * This allows legacy routes to work with version parameters
 */

import type {ThemeSystem} from "../../../shared/types/theme";
import type {ObjectStore} from "../../lib/object-store";

import {createObjectStore} from "../../lib/object-store";

class LegacyThemeServiceAdapter {
  private store: ObjectStore;

  constructor(store: ObjectStore) {
    this.store = store;
  }

  /**
   * Get the complete theme system data (legacy interface with version support)
   */
  async getThemeSystem(version?: string): Promise<ThemeSystem | null> {
    try {
      // Use versioned file if version is provided, otherwise use latest
      const key = version
        ? `react/theme/v${version.replace(/^v/, "")}.json`
        : "react/latest/theme.json";

      const bodyString = await this.store.get(key);

      if (bodyString === null) {
        return null;
      }

      return JSON.parse(bodyString);
    } catch (error) {
      console.error(
        `Error fetching theme system${version ? ` for version ${version}` : ""}:`,
        error,
      );

      return null;
    }
  }

  /**
   * Get a specific theme (legacy interface with version support)
   */
  async getTheme(
    themeName: string,
    version?: string,
  ): Promise<ThemeSystem["themes"][string] | null> {
    const themeSystem = await this.getThemeSystem(version);
    if (!themeSystem || !themeSystem.themes[themeName]) {
      return null;
    }

    return themeSystem.themes[themeName];
  }

  /**
   * Get available theme names (legacy interface with version support)
   */
  async getAvailableThemes(version?: string): Promise<string[]> {
    const themeSystem = await this.getThemeSystem(version);
    if (!themeSystem) {
      return [];
    }

    return Object.keys(themeSystem.themes);
  }

  /**
   * Get theme variables for a specific mode (legacy interface with version support)
   */
  async getThemeVariables(
    themeName: string,
    mode: "light" | "dark",
    version?: string,
  ): Promise<ThemeSystem["themes"][string]["light"] | null> {
    const theme = await this.getTheme(themeName, version);
    if (!theme) {
      return null;
    }

    return theme[mode];
  }

  /**
   * Get animations (legacy interface with version support)
   */
  async getAnimations(version?: string): Promise<ThemeSystem["animations"] | null> {
    const themeSystem = await this.getThemeSystem(version);
    if (!themeSystem) {
      return null;
    }

    return themeSystem.animations;
  }

  /**
   * Get the latest version
   */
  async getLatestVersion(): Promise<string | null> {
    const themeSystem = await this.getThemeSystem();
    if (!themeSystem) {
      return null;
    }

    return themeSystem.version;
  }
}

let legacyThemeService: LegacyThemeServiceAdapter | null = null;

export const getLegacyThemeService = async (
  env: Record<string, any>,
): Promise<LegacyThemeServiceAdapter> => {
  if (!legacyThemeService) {
    legacyThemeService = new LegacyThemeServiceAdapter(createObjectStore(env));
  }

  return legacyThemeService;
};
