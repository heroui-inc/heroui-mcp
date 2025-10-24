import type {AnalyticsService} from "../services/analytics";

interface Bindings {
  CLOUDFLARE_ACCOUNT_ID: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  R2_BUCKET_NAME: string;
  GITHUB_TOKEN?: string;
  NODE_ENV: "test" | "development" | "staging" | "production";
  POSTHOG_HOST?: string;
  POSTHOG_KEY?: string;
}

interface Variables {
  analytics: AnalyticsService;
  user?: {id: string};
}

export interface HonoContext {
  Bindings: Bindings;
  Variables: Variables;
}
