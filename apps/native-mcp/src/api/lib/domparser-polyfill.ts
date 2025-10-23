/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * DOMParser and Node polyfills for Cloudflare Workers
 * AWS SDK needs these for parsing XML responses
 * Uses @xmldom/xmldom for proper XML parsing support
 */

import {DOMParser as XDOMParser} from "@xmldom/xmldom";

// Add DOMParser to global scope if not already available
if (typeof globalThis.DOMParser === "undefined") {
  (globalThis as typeof globalThis & {DOMParser: typeof XDOMParser}).DOMParser = XDOMParser;
}

// Add Node constants that AWS SDK XML parser expects
if (typeof globalThis.Node === "undefined") {
  (globalThis as any).Node = {
    ELEMENT_NODE: 1,
    ATTRIBUTE_NODE: 2,
    TEXT_NODE: 3,
    CDATA_SECTION_NODE: 4,
    ENTITY_REFERENCE_NODE: 5,
    ENTITY_NODE: 6,
    PROCESSING_INSTRUCTION_NODE: 7,
    COMMENT_NODE: 8,
    DOCUMENT_NODE: 9,
    DOCUMENT_TYPE_NODE: 10,
    DOCUMENT_FRAGMENT_NODE: 11,
    NOTATION_NODE: 12,
  };
}

export {};
