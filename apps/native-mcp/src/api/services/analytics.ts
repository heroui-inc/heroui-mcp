import type {AnalyticsErrorEvent, AnalyticsEvent, AnalyticsProperties} from "../types/analytics";

import {Analytics as BaseAnalytics} from "@heroui/analytics";

const ANALYTICS_APP = "native-mcp";

export class AnalyticsService extends BaseAnalytics<
  AnalyticsEvent,
  AnalyticsErrorEvent,
  AnalyticsProperties
> {
  metadata: Record<string, unknown> | null;
  distinctId?: string | null;

  constructor({
    bindings,
    metadata,
    distinctId,
  }: {
    bindings: {
      NODE_ENV: string;
      POSTHOG_HOST?: string;
      POSTHOG_KEY?: string;
    };
    metadata?: Record<string, unknown>;
    distinctId?: string;
  }) {
    super({
      dryRun: bindings.NODE_ENV !== "production",
      host: bindings.POSTHOG_HOST ?? "",
      key: bindings.POSTHOG_KEY ?? "",
      log: bindings.NODE_ENV !== "test",
    });

    this.metadata = metadata ?? null;
    this.distinctId = distinctId ?? null;
  }

  track({
    event,
    properties,
  }: {
    event: AnalyticsEvent | AnalyticsErrorEvent;
    properties: AnalyticsProperties;
  }) {
    properties = {
      ...(this.metadata ?? {}),
      ...(properties ?? {}),
      app: ANALYTICS_APP,
    };

    super.track({
      distinctId: this.distinctId ?? undefined,
      event,
      properties,
    });
  }

  trackError({
    error,
    errorEvent,
    fallbackMessage,
    properties,
  }: {
    error: unknown;
    errorEvent: AnalyticsErrorEvent;
    fallbackMessage?: string;
    properties: AnalyticsProperties;
  }) {
    properties = {
      ...(this.metadata ?? {}),
      ...(properties ?? {}),
      app: ANALYTICS_APP,
    };

    super.trackError({
      distinctId: this.distinctId ?? undefined,
      error,
      errorEvent,
      fallbackMessage,
      properties,
    });
  }
}
