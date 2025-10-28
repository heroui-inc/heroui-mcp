import type {AnalyticsService} from "../services/analytics";
import type {Fetcher} from "@cloudflare/workers-types";

interface Bindings {
  CLOUDFLARE_ACCOUNT_ID: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  R2_BUCKET_NAME: string;
  GITHUB_TOKEN?: string;
  NODE_ENV: "test" | "development" | "staging" | "production";
  POSTHOG_HOST?: string;
  POSTHOG_API_KEY?: string;
  SERVICE_AUTH_TOKEN?: string;
  INTERNAL_SERVICES?: Fetcher;
}

interface Variables {
  analytics: AnalyticsService;
  userId?: string;
}

export interface HonoContext {
  Bindings: Bindings;
  Variables: Variables;
}
