/**
 * DOMParser polyfill for Cloudflare Workers
 * AWS SDK needs this for parsing XML responses
 * Uses @xmldom/xmldom for proper XML parsing support
 */

import {DOMParser as XDOMParser} from "@xmldom/xmldom";

// Add DOMParser to global scope if not already available
if (typeof globalThis.DOMParser === "undefined") {
  (globalThis as typeof globalThis & {DOMParser: typeof XDOMParser}).DOMParser = XDOMParser;
}

export {};
