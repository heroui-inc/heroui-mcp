/**
 * Service for accessing theme data from R2
 */

import type {ThemeSystem} from "../types/theme";

import {GetObjectCommand, S3Client} from "@aws-sdk/client-s3";

export interface ThemeServiceConfig {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  endpoint?: string;
}

export class ThemeServiceR2 {
  private client: S3Client;
  private bucketName: string;

  constructor(config: ThemeServiceConfig) {
    const endpoint = config.endpoint || `https://${config.accountId}.r2.cloudflarestorage.com`;

    this.client = new S3Client({
      region: "auto",
      endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });

    this.bucketName = config.bucketName;
  }

  /**
   * Get the complete theme system data
   */
  async getThemeSystem(version?: string): Promise<ThemeSystem | null> {
    try {
      // Use versioned file if version is provided, otherwise use latest
      const key = version
        ? `native/theme/${version.replace(/^v/, "")}.json`
        : "native/latest/theme.json";

      const response = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );

      if (response.Body) {
        const bodyString = await response.Body.transformToString();

        return JSON.parse(bodyString);
      }

      return null;
    } catch (error) {
      console.error(
        `Error fetching theme system${version ? ` for version ${version}` : ""}:`,
        error,
      );

      return null;
    }
  }

  /**
   * Get a specific theme
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
   * Get available theme names
   */
  async getAvailableThemes(version?: string): Promise<string[]> {
    const themeSystem = await this.getThemeSystem(version);
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
    version?: string,
  ): Promise<ThemeSystem["themes"][string]["light"] | null> {
    const theme = await this.getTheme(themeName, version);
    if (!theme) {
      return null;
    }

    return theme[mode];
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
