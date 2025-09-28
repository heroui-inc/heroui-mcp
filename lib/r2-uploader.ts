/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * R2 Storage Uploader
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
   * Upload versioned component data to R2
   * Stores in: {library}/{version}.json (e.g., heroui/"v3.0.0-alpha.31"1.json)
   */
  async uploadComponentData(library: string, version: string, data: unknown): Promise<void> {
    const key = `${library}/${version}.json`;
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
   * Stores in: latest/{library}.json (e.g., latest/heroui.json)
   */
  async uploadLatestVersion(library: string, data: unknown): Promise<void> {
    const key = `latest/${library}.json`;
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
   * Stores in: versions.json (at root level)
   */
  async updateVersionMetadata(metadata: unknown): Promise<void> {
    const key = "versions.json";
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
   * Reads from: versions.json (at root level)
   */
  async getVersionMetadata(): Promise<unknown> {
    const key = "versions.json";

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
   * List all versions for a library
   */
  async listVersions(library: string): Promise<string[]> {
    const prefix = `${library}/`;

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

      // Sort versions semantically (newest first)
      return versions.sort((a, b) => {
        // Remove 'v' prefix for comparison
        const versionA = a.replace(/^v/, "");
        const versionB = b.replace(/^v/, "");

        // Split into parts for semantic comparison
        const partsA = versionA.split(/[.-]/).map((p) => {
          const num = parseInt(p, 10);

          return isNaN(num) ? p : num;
        });
        const partsB = versionB.split(/[.-]/).map((p) => {
          const num = parseInt(p, 10);

          return isNaN(num) ? p : num;
        });

        // Compare each part
        for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
          const partA = partsA[i] ?? 0;
          const partB = partsB[i] ?? 0;

          // Handle string vs number comparison
          if (typeof partA === "string" && typeof partB === "string") {
            if (partA < partB) return 1; // Reverse for newest first
            if (partA > partB) return -1;
          } else if (typeof partA === "number" && typeof partB === "number") {
            if (partA < partB) return 1; // Reverse for newest first
            if (partA > partB) return -1;
          } else {
            // Numbers come before strings (e.g., "31" before "alpha")
            return typeof partA === "number" ? 1 : -1;
          }
        }

        return 0;
      });
    } catch (error) {
      console.error(`❌ Failed to list versions:`, error);
      throw error;
    }
  }

  /**
   * Check if a version exists
   */
  async versionExists(library: string, version: string): Promise<boolean> {
    const key = `${library}/${version}.json`;

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
}
