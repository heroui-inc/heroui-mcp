/* eslint-disable @typescript-eslint/no-explicit-any */
import {getAnalytics, initializeAnalytics} from "@heroui/analytics";
import {ComponentDataServiceR2} from "../../services/component-data-service-r2";
import {ThemeServiceR2} from "../../services/theme-service-r2";

let dataService: ComponentDataServiceR2 | null = null;
let themeService: ThemeServiceR2 | null = null;
let analyticsInitialized = false;

export function initAnalytics(env: Record<string, any>) {
  if (!analyticsInitialized) {
    const posthogKey = env.POSTHOG_API_KEY || process.env.POSTHOG_API_KEY;
    const posthogHost = env.POSTHOG_HOST || process.env.POSTHOG_HOST || "https://us.i.posthog.com";
    const environment = env.APP_ENV || process.env.APP_ENV || "development";

    initializeAnalytics(
      posthogKey
        ? {
            apiKey: posthogKey,
            host: posthogHost,
            environment,
            project: "native",
          }
        : null,
    );
    analyticsInitialized = true;
  }
}

export async function getDataService(env: Record<string, any>): Promise<ComponentDataServiceR2> {
  if (!dataService) {
    const r2AccountId = env.CLOUDFLARE_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID;
    const r2AccessKeyId = env.R2_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID;
    const r2SecretAccessKey = env.R2_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY;
    const r2Bucket = env.R2_BUCKET_NAME || process.env.R2_BUCKET_NAME;

    if (!r2AccountId || !r2AccessKeyId || !r2SecretAccessKey) {
      throw new Error("R2 credentials not configured");
    }

    const r2Endpoint = `https://${r2AccountId}.r2.cloudflarestorage.com`;

    dataService = new ComponentDataServiceR2({
      accountId: r2AccountId,
      accessKeyId: r2AccessKeyId,
      secretAccessKey: r2SecretAccessKey,
      bucketName: r2Bucket,
      endpoint: r2Endpoint,
    });
  }

  return dataService;
}

export async function getThemeService(env: Record<string, any>): Promise<ThemeServiceR2> {
  if (!themeService) {
    const r2AccountId = env.CLOUDFLARE_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID;
    const r2AccessKeyId = env.R2_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID;
    const r2SecretAccessKey = env.R2_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY;
    const r2Bucket = env.R2_BUCKET_NAME || process.env.R2_BUCKET_NAME || "heroui-mcp";

    if (!r2AccountId || !r2AccessKeyId || !r2SecretAccessKey) {
      throw new Error("R2 credentials not configured");
    }

    const r2Endpoint = `https://${r2AccountId}.r2.cloudflarestorage.com`;

    themeService = new ThemeServiceR2({
      accountId: r2AccountId,
      accessKeyId: r2AccessKeyId,
      secretAccessKey: r2SecretAccessKey,
      bucketName: r2Bucket,
      endpoint: r2Endpoint,
    });
  }

  return themeService;
}

export {getAnalytics};
