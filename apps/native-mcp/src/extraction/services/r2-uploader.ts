/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * R2 Storage Uploader for HeroUI Native
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
   * Generic method to read JSON data from R2
   */
  async readData<T>(key: string): Promise<T | null> {
    try {
      const response = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );

      if (response.Body) {
        const text = await response.Body.transformToString();

        return JSON.parse(text) as T;
      }

      return null;
    } catch (error: any) {
      if (error.name === "NoSuchKey") {
        return null;
      }
      console.error(`❌ Failed to read ${key} from R2:`, error);
      throw error;
    }
  }

  /**
   * Upload combined context data for /ctx endpoint
   * Stores in: native/latest/ctx.json
   */
  async uploadContext(data: unknown): Promise<void> {
    const key = "native/latest/ctx.json";
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
}
