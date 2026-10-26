import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";

import {fetchApi} from "./fetch";

const baseUrl = "https://api.example.test";

function waitForAbort(signal: AbortSignal): Promise<never> {
  return new Promise((_, reject) => {
    if (signal.aborted) {
      reject(signal.reason);
    } else {
      signal.addEventListener("abort", () => reject(signal.reason), {once: true});
    }
  });
}

describe("fetchApi", () => {
  beforeEach(() => vi.useFakeTimers());

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it("aborts a request that never receives headers after 30 seconds", async () => {
    let signal: AbortSignal;
    vi.spyOn(globalThis, "fetch").mockImplementation((_url, options) => {
      signal = options!.signal!;
      return waitForAbort(signal);
    });

    const result = fetchApi("/v1/components", baseUrl);
    const rejection = expect(result).rejects.toMatchObject({
      name: "TimeoutError",
      message: "Request to /v1/components timed out after 30 seconds",
    });

    await vi.advanceTimersByTimeAsync(29_999);
    expect(signal!.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await rejection;
    expect(signal!.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each([200, 503])(
    "keeps the deadline active while reading a %s response body",
    async (status) => {
      vi.spyOn(globalThis, "fetch").mockImplementation(async (_url, options) => {
        const signal = options!.signal!;
        const response = new Response("", {status});
        vi.spyOn(response, status === 200 ? "json" : "text").mockImplementation(() =>
          waitForAbort(signal),
        );
        return response;
      });

      const rejection = expect(fetchApi("/slow-body", baseUrl)).rejects.toMatchObject({
        name: "TimeoutError",
      });
      await vi.advanceTimersByTimeAsync(30_000);
      await rejection;
      expect(vi.getTimerCount()).toBe(0);
    },
  );

  it("preserves caller cancellation and clears the deadline", async () => {
    const controller = new AbortController();
    const reason = new Error("Caller cancelled");
    vi.spyOn(globalThis, "fetch").mockImplementation((_url, options) =>
      waitForAbort(options!.signal!),
    );

    const rejection = expect(
      fetchApi("/v1/components", baseUrl, {signal: controller.signal}),
    ).rejects.toBe(reason);
    controller.abort(reason);
    await rejection;
    expect(vi.getTimerCount()).toBe(0);
  });

  it("does not start a request when the caller has already cancelled", async () => {
    const controller = new AbortController();
    const reason = new Error("Already cancelled");
    controller.abort(reason);
    const fetchMock = vi.spyOn(globalThis, "fetch");

    await expect(fetchApi("/v1/components", baseUrl, {signal: controller.signal})).rejects.toBe(
      reason,
    );
    expect(fetchMock).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("still times out when the caller provides a signal", async () => {
    const controller = new AbortController();
    vi.spyOn(globalThis, "fetch").mockImplementation((_url, options) =>
      waitForAbort(options!.signal!),
    );
    const rejection = expect(
      fetchApi("/v1/components", baseUrl, {signal: controller.signal}),
    ).rejects.toMatchObject({name: "TimeoutError"});

    await vi.advanceTimersByTimeAsync(30_000);
    await rejection;
    expect(controller.signal.aborted).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("preserves JSON results, headers and request options and clears the deadline", async () => {
    vi.stubEnv("HEROUI_API_KEY", "test-key");
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ok: true}));

    await expect(
      fetchApi("/v1/components/docs", baseUrl, {
        method: "POST",
        body: JSON.stringify({components: ["Button"]}),
        headers: {"X-Custom": "value"},
      }),
    ).resolves.toEqual({ok: true});
    expect(fetchMock).toHaveBeenCalledWith(
      `${baseUrl}/v1/components/docs`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({components: ["Button"]}),
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "X-Client-Version": expect.any(String),
          "X-API-Key": "test-key",
          "X-Custom": "value",
        }),
      }),
    );
    expect(vi.getTimerCount()).toBe(0);
  });

  it("preserves HTTP error details and clears the deadline", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("Not found", {
        status: 404,
        statusText: "Not Found",
      }),
    );
    await expect(fetchApi("/missing", baseUrl)).rejects.toMatchObject({
      message: "404: Not Found",
      status: 404,
      statusText: "Not Found",
      url: `${baseUrl}/missing`,
      body: "Not found",
    });
    expect(vi.getTimerCount()).toBe(0);
  });

  it("preserves network errors and clears the deadline", async () => {
    const error = new TypeError("fetch failed");
    vi.spyOn(globalThis, "fetch").mockRejectedValue(error);
    await expect(fetchApi("/v1/components", baseUrl)).rejects.toBe(error);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("clears the deadline when JSON parsing fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("invalid JSON"));
    await expect(fetchApi("/v1/components", baseUrl)).rejects.toBeInstanceOf(SyntaxError);
    expect(vi.getTimerCount()).toBe(0);
  });
});
