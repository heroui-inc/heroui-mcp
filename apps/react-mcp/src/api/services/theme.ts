/**
 * Service for accessing theme data from R2
 */

import type {ThemeSystem} from "../../shared/types/theme";

import {GetObjectCommand, S3Client} from "@aws-sdk/client-s3";

interface ThemeServiceConfig {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  endpoint?: string;
}

class ThemeService {
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
  async getThemeSystem(): Promise<ThemeSystem | null> {
    try {
      const key = "react/v1/latest/theme.json";

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
      const response = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucketName,
          Key: "react/v1/latest/ctx.json",
        }),
      );

      if (response.Body) {
        const bodyString = await response.Body.transformToString();
        const ctxData = JSON.parse(bodyString) as {
          version?: string;
        };

        return ctxData?.version || null;
      }

      return null;
    } catch (error) {
      console.error("Error fetching latest version from ctx.json:", error);

      return null;
    }
  }
}

let themeService: ThemeService | null = null;

export const getThemeService = async (env: Record<string, any>): Promise<ThemeService> => {
  if (!themeService) {
    const r2AccountId = env.CLOUDFLARE_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID;
    const r2AccessKeyId = env.R2_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID;
    const r2SecretAccessKey = env.R2_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY;
    const r2Bucket = env.R2_BUCKET_NAME || process.env.R2_BUCKET_NAME;

    if (!r2AccountId || !r2AccessKeyId || !r2SecretAccessKey) {
      throw new Error("R2 credentials not configured");
    }

    const r2Endpoint = `https://${r2AccountId}.r2.cloudflarestorage.com`;

    themeService = new ThemeService({
      accountId: r2AccountId,
      accessKeyId: r2AccessKeyId,
      secretAccessKey: r2SecretAccessKey,
      bucketName: r2Bucket,
      endpoint: r2Endpoint,
    });
  }

  return themeService;
};
