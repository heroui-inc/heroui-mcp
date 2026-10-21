import type {DOMParser} from "@xmldom/xmldom";

import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";

const workerGlobals = globalThis as typeof globalThis & {
  DOMParser: typeof DOMParser;
  Node: {ELEMENT_NODE: number; TEXT_NODE: number};
};

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("DOMParser polyfill", () => {
  it("parses S3 XML responses when DOM globals are unavailable", async () => {
    vi.stubGlobal("DOMParser", undefined);
    vi.stubGlobal("Node", undefined);
    await import("./domparser-polyfill");

    const document = new workerGlobals.DOMParser().parseFromString(
      '<ListBucketResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/"><Contents><Key>docs/button&amp;icon.json</Key></Contents></ListBucketResult>',
      "application/xml",
    );
    const key = document.getElementsByTagName("Key").item(0);

    expect(document.documentElement?.namespaceURI).toBe("http://s3.amazonaws.com/doc/2006-03-01/");
    expect(key?.textContent).toBe("docs/button&icon.json");
    expect(key?.nodeType).toBe(workerGlobals.Node.ELEMENT_NODE);
    expect(key?.firstChild?.nodeType).toBe(workerGlobals.Node.TEXT_NODE);
  });

  it("preserves existing DOM globals", async () => {
    const existingParser = class {};
    const existingNode = {ELEMENT_NODE: 1};

    vi.stubGlobal("DOMParser", existingParser);
    vi.stubGlobal("Node", existingNode);
    await import("./domparser-polyfill");

    expect(workerGlobals.DOMParser).toBe(existingParser);
    expect(workerGlobals.Node).toBe(existingNode);
  });
});
