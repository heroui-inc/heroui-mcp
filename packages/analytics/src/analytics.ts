import {PostHog} from "posthog-node";

import {getErrorMessage} from "./utils";

export class Analytics<
  Event extends string,
  ErrorEvent extends string,
  Properties extends Record<string, unknown> = Record<string, unknown>,
> {
  private posthog: PostHog | null = null;
  private log: boolean;

  constructor({
    host,
    key,
    dryRun,
    log,
  }: {
    host: string;
    key: string;
    dryRun?: boolean;
    log?: boolean;
  }) {
    this.log = log ?? true;

    if (dryRun) {
      return;
    }

    if (!key || !host) {
      throw new Error("PostHog key and host are required");
    }

    this.posthog = new PostHog(key, {host});
  }

  track({
    distinctId = "unknown",
    event,
    properties,
  }: {
    distinctId?: string;
    event: Event | ErrorEvent;
    properties?: Properties;
  }) {
    const payload = {
      distinctId,
      event,
      properties,
    };

    if (this.log) {
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(payload, null, 2));
    }

    this.posthog?.capture(payload);
  }

  trackError({
    distinctId = "unknown",
    error,
    errorEvent,
    fallbackMessage,
    properties,
  }: {
    distinctId?: string;
    error: unknown;
    errorEvent: ErrorEvent;
    fallbackMessage?: string;
    properties?: Properties;
  }) {
    const payload = {
      distinctId,
      event: errorEvent,
      properties: {
        errorMessage: getErrorMessage(error, fallbackMessage),
        isError: true,
        ...(properties || {}),
      } as unknown as Properties,
    };

    if (this.log) {
      // eslint-disable-next-line no-console
      console.error(JSON.stringify(payload, null, 2));
    }

    this.posthog?.capture(payload);
  }

  // Make sure to flush events before the process exits
  async shutdown() {
    await this.posthog?.shutdown();
  }
}
