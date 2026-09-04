/**
 * Object storage access for the extracted HeroUI React dataset.
 *
 * Two backends are supported. Inside a Worker the R2 bucket binding is used
 * directly. Outside a Worker — or when no binding is configured — the same
 * bucket is reached over the S3-compatible API using R2 credentials.
 */

import type {R2Bucket} from "@cloudflare/workers-types";

import {GetObjectCommand, ListObjectsV2Command, S3Client} from "@aws-sdk/client-s3";

export interface ObjectStore {
  /** Returns the object body as text, or null when the key does not exist. */
  get(key: string): Promise<string | null>;
  /** Returns the keys of the objects stored under a prefix. */
  list(options: {prefix: string; delimiter?: string}): Promise<string[]>;
}

class BindingObjectStore implements ObjectStore {
  constructor(private readonly bucket: R2Bucket) {}

  async get(key: string): Promise<string | null> {
    const object = await this.bucket.get(key);

    if (!object) {
      return null;
    }

    return await object.text();
  }

  async list({prefix, delimiter}: {prefix: string; delimiter?: string}): Promise<string[]> {
    const listed = await this.bucket.list({prefix, delimiter});

    return listed.objects.map((object) => object.key);
  }
}

class S3ObjectStore implements ObjectStore {
  private readonly client: S3Client;

  constructor(
    private readonly bucketName: string,
    accountId: string,
    accessKeyId: string,
    secretAccessKey: string,
  ) {
    this.client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {accessKeyId, secretAccessKey},
    });
  }

  async get(key: string): Promise<string | null> {
    try {
      const response = await this.client.send(
        new GetObjectCommand({Bucket: this.bucketName, Key: key}),
      );

      if (!response.Body) {
        return null;
      }

      return await response.Body.transformToString();
    } catch (error) {
      const message = error instanceof Error ? error.message : "";

      if (message.includes("NoSuchKey") || message.includes("404")) {
        return null;
      }

      throw error;
    }
  }

  async list({prefix, delimiter}: {prefix: string; delimiter?: string}): Promise<string[]> {
    const response = await this.client.send(
      new ListObjectsV2Command({Bucket: this.bucketName, Prefix: prefix, Delimiter: delimiter}),
    );

    return (response.Contents ?? [])
      .map((object) => object.Key)
      .filter((key): key is string => Boolean(key));
  }
}

/**
 * Builds the object store for the current environment, preferring the R2
 * binding. Throws only when neither a binding nor credentials are available.
 */
export function createObjectStore(env: Record<string, any>): ObjectStore {
  if (env.R2) {
    return new BindingObjectStore(env.R2 as R2Bucket);
  }

  const accountId = env.CLOUDFLARE_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = env.R2_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = env.R2_BUCKET_NAME || process.env.R2_BUCKET_NAME || "heroui-mcp";

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 credentials not configured");
  }

  return new S3ObjectStore(bucketName, accountId, accessKeyId, secretAccessKey);
}
