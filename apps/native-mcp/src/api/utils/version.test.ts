/**
 * Unit Tests for client version comparison
 */

import {describe, expect, it} from "vitest";

import {isClientOutdated} from "./version";

describe("isClientOutdated", () => {
  it("should flag clients on an older release", () => {
    expect(isClientOutdated("1.0.2", "1.1.0")).toBe(true);
    expect(isClientOutdated("1.1.0", "2.0.0")).toBe(true);
    expect(isClientOutdated("1.1.0", "1.1.1")).toBe(true);
  });

  it("should not flag clients on the same or a newer release", () => {
    expect(isClientOutdated("1.1.0", "1.1.0")).toBe(false);
    expect(isClientOutdated("1.2.0", "1.1.0")).toBe(false);
    expect(isClientOutdated("2.0.0", "1.1.0")).toBe(false);
  });

  it("should not flag prerelease clients, which report a build-time placeholder", () => {
    expect(isClientOutdated("1.0.0-alpha.1", "1.1.0")).toBe(false);
  });

  it("should not flag clients that send no or an unparsable version", () => {
    expect(isClientOutdated(undefined, "1.1.0")).toBe(false);
    expect(isClientOutdated("", "1.1.0")).toBe(false);
    expect(isClientOutdated("latest", "1.1.0")).toBe(false);
  });

  it("should tolerate a v prefix", () => {
    expect(isClientOutdated("v1.0.2", "1.1.0")).toBe(true);
    expect(isClientOutdated("v1.1.0", "1.1.0")).toBe(false);
  });
});
