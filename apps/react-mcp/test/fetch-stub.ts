/**
 * Offline HTTP layer for the API tests.
 *
 * The docs, ctx and component routes fetch `llms.txt`, markdown pages and
 * source files at request time. Serving those bodies from fixtures keeps the
 * suite deterministic and runnable without network access. Any request that is
 * not listed here answers 404, which is the same signal the routes get for a
 * document that does not exist.
 */

import {LLMS_TXT} from "./fixtures";

const DOCS_ORIGIN = "https://heroui.com";

const DOCUMENTED_COMPONENTS = ["button", "card", "tabs"];

function guide(title: string): string {
  return `---
title: ${title}
---

# ${title}

Guidance for ${title.toLowerCase()} in a HeroUI React app.
`;
}

function componentDoc(kebabName: string): string {
  return `---
title: ${kebabName}
---

# ${kebabName}

Usage notes for the HeroUI React ${kebabName} component.
`;
}

/** Pages served from heroui.com, keyed by pathname. */
const DOC_PAGES: Record<string, string> = {
  "/docs/react/getting-started.mdx": guide("Getting Started"),
  "/docs/react/getting-started/installation.mdx": guide("Installation"),
  "/docs/react/getting-started/theming.mdx": guide("Theming"),
  ...Object.fromEntries(
    DOCUMENTED_COMPONENTS.map((name) => [
      `/docs/react/components/${name}.mdx`,
      componentDoc(name),
    ]),
  ),
};

/**
 * Source and style files referenced by the component fixtures. The routes
 * rewrite the `github.com/.../blob/...` links from the dataset to raw URLs
 * before fetching, so both spellings are matched on the path suffix.
 */
const REPO_FILES: Record<string, string> = {
  ...Object.fromEntries(
    DOCUMENTED_COMPONENTS.map((name) => [
      `packages/${name}/src/${name}.tsx`,
      `export function ${name}() {\n  return null;\n}\n`,
    ]),
  ),
  ...Object.fromEntries(
    DOCUMENTED_COMPONENTS.map((name) => [
      `packages/${name}/src/${name}.css`,
      `.${name} {\n  display: block;\n}\n`,
    ]),
  ),
};

function text(body: string, contentType: string): Response {
  return new Response(body, {status: 200, headers: {"content-type": contentType}});
}

function notFound(): Response {
  return new Response("Not Found", {status: 404, statusText: "Not Found"});
}

function respond(rawUrl: string): Response {
  let url: URL;

  try {
    url = new URL(rawUrl);
  } catch {
    return notFound();
  }

  if (url.hostname === "raw.githubusercontent.com" || url.hostname === "github.com") {
    const file = Object.entries(REPO_FILES).find(([path]) => url.pathname.endsWith(`/${path}`));

    return file ? text(file[1], "text/plain") : notFound();
  }

  if (rawUrl.startsWith(`${DOCS_ORIGIN}/`)) {
    if (url.pathname === "/llms.txt") {
      return text(LLMS_TXT, "text/plain");
    }

    const page = DOC_PAGES[url.pathname];

    return page ? text(page, "text/markdown") : notFound();
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
