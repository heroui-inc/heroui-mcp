/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * R2 Storage Uploader for HeroUI Native
 * Handles uploading extracted component data to Cloudflare R2
 */

import {
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
}

export class R2Uploader {
  private client: S3Client;
  private bucketName: string;

  constructor(config: R2Config) {
    this.bucketName = config.bucketName;

    // Configure S3 client for R2
    this.client = new S3Client({
      region: "auto",
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  /**
   * Upload component data to R2
   * Stores in: native/components/{version}.json
   */
  async uploadComponentData(version: string, data: unknown): Promise<void> {
    const key = `native/components/${version}.json`;
    const body = JSON.stringify(data, null, 2);

    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: body,
          ContentType: "application/json",
        }),
      );
      console.log(`✅ Uploaded ${key} to R2`);
    } catch (error) {
      console.error(`❌ Failed to upload ${key}:`, error);
      throw error;
    }
  }

  /**
   * Upload theme data to R2
   * Stores in: native/theme/{version}.json
   */
  async uploadThemeData(version: string, data: unknown): Promise<void> {
    const key = `native/theme/${version}.json`;
    const body = JSON.stringify(data, null, 2);

    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: body,
          ContentType: "application/json",
        }),
      );
      console.log(`✅ Uploaded ${key} to R2`);
    } catch (error) {
      console.error(`❌ Failed to upload ${key}:`, error);
      throw error;
    }
  }

  /**
   * Upload latest version data
   * Stores in: native/latest/{type}.json
   */
  async uploadLatestVersion(type: "components" | "theme", data: unknown): Promise<void> {
    const key = `native/latest/${type}.json`;
    const body = JSON.stringify(data, null, 2);

    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: body,
          ContentType: "application/json",
        }),
      );
      console.log(`✅ Uploaded ${key} to R2`);
    } catch (error) {
      console.error(`❌ Failed to upload ${key}:`, error);
      throw error;
    }
  }

  /**
   * Update version metadata
   * Stores in: native/versions.json
   */
  async updateVersionMetadata(metadata: unknown): Promise<void> {
    const key = "native/versions.json";
    const body = JSON.stringify(metadata, null, 2);

    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: body,
          ContentType: "application/json",
        }),
      );
      console.log(`✅ Updated version metadata in R2`);
    } catch (error) {
      console.error(`❌ Failed to update metadata:`, error);
      throw error;
    }
  }

  /**
   * Get current version metadata
   * Reads from: native/versions.json
   */
  async getVersionMetadata(): Promise<unknown> {
    const key = "native/versions.json";

    try {
      const response = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );

      if (response.Body) {
        const text = await response.Body.transformToString();

        return JSON.parse(text);
      }

      return {};
    } catch (error: any) {
      if (error.name === "NoSuchKey") {
        console.log("No existing metadata found, starting fresh");

        return {};
      }
      throw error;
    }
  }

  /**
   * Check if a version exists
   */
  async versionExists(type: "components" | "theme", version: string): Promise<boolean> {
    const key = `native/${type}/${version}.json`;

    try {
      await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );

      return true;
    } catch (error: any) {
      if (error.name === "NoSuchKey") {
        return false;
      }
      throw error;
    }
  }

  /**
   * List all versions
   */
  async listVersions(type: "components" | "theme"): Promise<string[]> {
    const prefix = `native/${type}/`;

    try {
      const response = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucketName,
          Prefix: prefix,
        }),
      );

      if (!response.Contents) {
        return [];
      }

      const versions = response.Contents.map((obj) => obj.Key || "")
        .filter((key) => key.endsWith(".json"))
        .map((key) => key.replace(prefix, "").replace(".json", ""));

      return versions.sort().reverse();
    } catch (error) {
      console.error(`❌ Failed to list versions:`, error);
      throw error;
    }
  }
}
