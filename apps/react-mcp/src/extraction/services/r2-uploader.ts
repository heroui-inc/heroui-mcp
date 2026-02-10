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
   * Stores in: react/v1/latest/{type}.json
   */
  async uploadLatestVersion(type: "components" | "theme", data: unknown): Promise<void> {
    const key = `react/v1/latest/${type}.json`;
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
   * Read data from R2
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

  /**
   * Upload combined context data for /ctx endpoint
   * Stores in: react/v1/latest/ctx.json
   * Contains: components, docs, version, timestamp
   */
  async uploadContext(ctxData: {
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
  }): Promise<void> {
    const key = "react/v1/latest/ctx.json";

    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: JSON.stringify(ctxData, null, 2),
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
