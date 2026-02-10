import type {AnalyticsErrorEvent, AnalyticsEvent, AnalyticsProperties} from "../types/analytics";

import {Analytics as BaseAnalytics} from "@heroui/analytics";

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
    // Extract app from properties, default to "react-mcp" if not provided
    const {app, ...restProperties} = properties;
    const appValue: string = (app as string) || "react-mcp";

    const enrichedProperties = {
      ...restProperties,
      ...(this.metadata ?? {}),
      app: appValue,
    } as AnalyticsProperties;

    super.track({
      distinctId: this.distinctId ?? undefined,
      event,
      properties: enrichedProperties,
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
    // Extract app from properties, default to "react-mcp" if not provided
    const {app, ...restProperties} = properties;
    const appValue: string = (app as string) || "react-mcp";

    const enrichedProperties = {
      ...restProperties,
      ...(this.metadata ?? {}),
      app: appValue,
    } as AnalyticsProperties;

    super.trackError({
      distinctId: this.distinctId ?? undefined,
      error,
      errorEvent,
      fallbackMessage,
      properties: enrichedProperties,
    });
  }
}
