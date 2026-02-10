import type {AnalyticsService} from "../services/analytics";

interface Bindings {
  NODE_ENV: "test" | "development" | "staging" | "production";
  POSTHOG_HOST?: string;
  POSTHOG_KEY?: string;
  MIGRATION_DOCS_BASE_URL?: string;
}

interface Variables {
  analytics: AnalyticsService;
}

export interface HonoContext {
  Bindings: Bindings;
  Variables: Variables;
}
