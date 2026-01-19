/**
 * Legacy Theme Service Adapter
 * Bridges old service interface to new service implementation
 * This allows legacy routes to work with version parameters
 */

import type {ThemeSystem} from "../../../shared/types/theme";

import {GetObjectCommand, S3Client} from "@aws-sdk/client-s3";

interface ThemeServiceConfig {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  endpoint?: string;
}

class LegacyThemeServiceAdapter {
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
   * Get the complete theme system data (legacy interface with version support)
   */
  async getThemeSystem(version?: string): Promise<ThemeSystem | null> {
    try {
      // Use versioned file if version is provided, otherwise use latest
      const key = version
        ? `react/theme/v${version.replace(/^v/, "")}.json`
        : "react/latest/theme.json";

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
    const r2AccountId = env.CLOUDFLARE_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID;
    const r2AccessKeyId = env.R2_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID;
    const r2SecretAccessKey = env.R2_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY;
    const r2Bucket = env.R2_BUCKET_NAME || process.env.R2_BUCKET_NAME;

    if (!r2AccountId || !r2AccessKeyId || !r2SecretAccessKey) {
      throw new Error("R2 credentials not configured");
    }

    const r2Endpoint = `https://${r2AccountId}.r2.cloudflarestorage.com`;

    legacyThemeService = new LegacyThemeServiceAdapter({
      accountId: r2AccountId,
      accessKeyId: r2AccessKeyId,
      secretAccessKey: r2SecretAccessKey,
      bucketName: r2Bucket,
      endpoint: r2Endpoint,
    });
  }

  return legacyThemeService;
};
