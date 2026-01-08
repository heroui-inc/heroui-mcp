/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * R2 Storage Uploader
 * Handles uploading extracted component data to Cloudflare R2
 */

import {GetObjectCommand, PutObjectCommand, S3Client} from "@aws-sdk/client-s3";

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
   * Upload latest version data
   * Stores in: react/latest/{type}.json
   */
  async uploadLatestVersion(type: "components" | "theme", data: unknown): Promise<void> {
    const key = `react/latest/${type}.json`;
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
   * Stores in: react/versions.json
   */
  async updateVersionMetadata(metadata: unknown): Promise<void> {
    const key = "react/versions.json";
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
   * Reads from: react/versions.json
   */
  async getVersionMetadata(): Promise<unknown> {
    const key = "react/versions.json";

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

  async uploadData(key: string, data: any): Promise<void> {
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: JSON.stringify(data, null, 2),
          ContentType: "application/json",
        }),
      );
      console.log(`✅ Uploaded ${key} to R2`);
    } catch (error) {
      console.error(`Failed to upload ${key}:`, error);
      throw error;
    }
  }

  async uploadDocsPaths(categories: any[]): Promise<void> {
    const key = "react/latest/docs-paths.json";
    const data = {
      categories,
      paths: categories.flatMap((cat) => cat.docs.map((doc: any) => doc.path)),
    };

    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: JSON.stringify(data, null, 2),
          ContentType: "application/json",
        }),
      );
      console.log(`✅ Uploaded ${key} to R2`);
    } catch (error) {
      console.error(`❌ Failed to upload ${key}:`, error);
      throw error;
    }
  }
}
