/**
 * Offline HTTP layer for the API tests.
 *
 * The docs routes and the dependency resolver fetch markdown from heroui.com
 * and from the heroui-native repository at request time. Serving those bodies
 * from fixtures keeps the suite deterministic and runnable without network
 * access. Any request that is not listed here answers 404, which is the same
 * signal the routes get for a document that does not exist.
 */

import {HEROUI_NATIVE_GITHUB_BASE} from "../src/extraction/constants";

const DOCS_ORIGIN = "https://heroui.com";

const DOCUMENTED_COMPONENTS = ["button", "card", "checkbox"];

function guide(title: string): string {
  return `---
title: ${title}
---

# ${title}

Guidance for ${title.toLowerCase()} in a HeroUI Native app.
`;
}

function componentDoc(kebabName: string): string {
  return `---
title: ${kebabName}
---

# ${kebabName}

Usage notes for the HeroUI Native ${kebabName} component.
`;
}

/** Pages served from heroui.com, keyed by pathname. */
const DOC_PAGES: Record<string, string> = {
  "/docs/native/getting-started/installation.mdx": guide("Installation"),
  "/docs/native/getting-started/theming.mdx": guide("Theming"),
  ...Object.fromEntries(
    DOCUMENTED_COMPONENTS.map((name) => [
      `/docs/native/components/${name}.mdx`,
      componentDoc(name),
    ]),
  ),
};

/**
 * Stand-in for the repository README. The legacy `/docs/available` route only
 * reads `###` headings and list items inside the `## Documentation` and
 * `## Changelog` sections, and it maps a link to a doc path by looking for
 * `/providers/` or `/components/` in the link target.
 */
const README = `# HeroUI Native

## Installation

Not part of the parsed sections.

## Documentation

### Core

- [Provider](./src/providers/hero-ui-native/provider.md) - Root provider setup
- [Theming](./src/providers/hero-ui-native/theme.md) - Theme tokens and overrides
- [Custom Fonts](./src/providers/hero-ui-native/theme.md#custom-fonts) - Register custom fonts

### Components

${DOCUMENTED_COMPONENTS.map((name) => `- [${name}](./src/components/${name}/${name}.md) - The ${name} component`).join("\n")}

## Changelog

Release history lives in CHANGELOG.md.
`;

/** Files served from the heroui-native repository, keyed by path within it. */
const REPO_FILES: Record<string, string> = {
  "README.md": README,
  "CHANGELOG.md": "# Changelog\n\n## 1.0.0\n\n- Initial release.\n",
  "src/providers/hero-ui-native/provider.md": "# Provider\n\nWrap the app in the provider.\n",
  "src/providers/hero-ui-native/theme.md": "# Theme\n\nOverride the default tokens.\n",
  ...Object.fromEntries(
    DOCUMENTED_COMPONENTS.map((name) => [
      `src/components/${name}/${name}.md`,
      `# ${name}\n\nUsage notes for ${name}.\n`,
    ]),
  ),
};

function markdown(body: string): Response {
  return new Response(body, {status: 200, headers: {"content-type": "text/markdown"}});
}

function notFound(): Response {
  return new Response("Not Found", {status: 404, statusText: "Not Found"});
}

function respond(url: string): Response {
  if (url.startsWith(`${HEROUI_NATIVE_GITHUB_BASE}/`)) {
    const file = REPO_FILES[url.slice(HEROUI_NATIVE_GITHUB_BASE.length + 1)];

    return file ? markdown(file) : notFound();
  }

  if (url.startsWith(`${DOCS_ORIGIN}/`)) {
    const page = DOC_PAGES[new URL(url).pathname];

    return page ? markdown(page) : notFound();
  }

  return notFound();
}

/**
 * Replaces `fetch` so that no test reaches the network. Requests the worker
 * makes to its own routes go through the `SELF` binding rather than `fetch`,
 * so they are unaffected.
 */
export function installFetchStub(): void {
  globalThis.fetch = ((input: RequestInfo | URL) =>
    Promise.resolve(
      respond(input instanceof Request ? input.url : String(input)),
    )) as typeof globalThis.fetch;
}
