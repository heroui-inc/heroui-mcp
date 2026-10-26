import {Client} from "@modelcontextprotocol/sdk/client/index.js";
import {InMemoryTransport} from "@modelcontextprotocol/sdk/inMemory.js";
import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
import {expect, it, vi} from "vitest";

import {clearSharedContext} from "../lib/shared-context";

import {initializeTools} from "./index";

const calls = [
  {name: "list_components", arguments: {}},
  {name: "get_component_docs", arguments: {components: ["Button"]}},
  {name: "get_component_source_code", arguments: {components: ["Button"]}},
  {name: "get_component_source_styles", arguments: {components: ["Button"]}},
  {name: "get_theme_variables", arguments: {}},
  {name: "get_docs", arguments: {path: "/docs/react/getting-started/theming"}},
];

it.each(calls)("aborts the HTTP request when $name is cancelled through MCP", async (call) => {
  const server = new McpServer({name: "cancellation-test", version: "1.0.0"});
  const client = new Client({name: "cancellation-client", version: "1.0.0"});
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
    Response.json({
      components: ["Button", "Card"],
      docs: {paths: ["/docs/react/getting-started/theming"]},
    }),
  );
  let markStarted!: (signal: AbortSignal) => void;
  const started = new Promise<AbortSignal>((resolve) => {
    markStarted = resolve;
  });
  let markAborted!: () => void;
  const aborted = new Promise<void>((resolve) => {
    markAborted = resolve;
  });
  const controller = new AbortController();
  const reason = new Error("Tool cancelled by client");

  try {
    clearSharedContext();
    await initializeTools(server, {apiBaseUrl: "https://api.example.test"});
    await server.connect(serverTransport);
    await client.connect(clientTransport);
    fetchMock.mockImplementation(
      (_url, options) =>
        new Promise((_, reject) => {
          const signal = options!.signal!;
          signal.addEventListener(
            "abort",
            () => {
              reject(signal.reason);
              markAborted();
            },
            {once: true},
          );
          markStarted(signal);
        }),
    );

    const result = client.callTool(call, undefined, {signal: controller.signal});
    const rejection = expect(result).rejects.toThrow("Tool cancelled by client");
    const signal = await started;
    expect(signal.aborted).toBe(false);
    controller.abort(reason);
    await rejection;
    await aborted;
    expect(signal.aborted).toBe(true);
  } finally {
    controller.abort();
    await client.close();
    await server.close();
    fetchMock.mockRestore();
    clearSharedContext();
  }
});
