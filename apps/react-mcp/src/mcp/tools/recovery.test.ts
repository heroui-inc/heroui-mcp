import {Client} from "@modelcontextprotocol/sdk/client/index.js";
import {InMemoryTransport} from "@modelcontextprotocol/sdk/inMemory.js";
import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
import {expect, it, vi} from "vitest";

import {clearSharedContext} from "../lib/shared-context";

import {initializeTools} from "./index";

const componentTools = [
  {name: "get_component_docs", endpoint: "/v1/components/docs", field: "content"},
  {name: "get_component_source_code", endpoint: "/v1/components/source", field: "sourceCode"},
  {name: "get_component_source_styles", endpoint: "/v1/components/styles", field: "stylesCode"},
];

it.each(componentTools)("$name recovers after the startup API request fails", async (tool) => {
  const server = new McpServer({name: "recovery-test", version: "1.0.0"});
  const client = new Client({name: "recovery-client", version: "1.0.0"});
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const fetchMock = vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("fetch failed"));
  const consoleMock = vi.spyOn(console, "error").mockImplementation(() => {});

  try {
    clearSharedContext();
    await initializeTools(server, {apiBaseUrl: "https://api.example.test"});
    await server.connect(serverTransport);
    await client.connect(clientTransport);

    const {tools} = await client.listTools();
    expect(tools.find(({name}) => name === tool.name)?.inputSchema).toMatchObject({
      properties: {
        components: {type: "array", minItems: 1, items: {type: "string", minLength: 1}},
      },
    });

    const call = {name: tool.name, arguments: {components: ["Button"]}};
    const offline = await client.callTool(call);
    expect(offline.content).toEqual([
      {type: "text", text: expect.stringContaining("fetch failed")},
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    // Recover the API without restarting the server or registering tools again.
    fetchMock.mockResolvedValue(
      Response.json({results: [{component: "Button", [tool.field]: "Recovered content"}]}),
    );
    const recovered = await client.callTool(call);
    expect(recovered.isError).not.toBe(true);
    expect(recovered.content).toEqual([
      {type: "text", text: expect.stringContaining("Recovered content")},
    ]);
    expect(fetchMock).toHaveBeenLastCalledWith(
      `https://api.example.test${tool.endpoint}`,
      expect.objectContaining({method: "POST", body: JSON.stringify({components: ["Button"]})}),
    );

    for (const components of [[], [""], [123], "Button"]) {
      const invalid = await client.callTool({name: tool.name, arguments: {components}});
      expect(invalid.isError).toBe(true);
    }
    expect(fetchMock).toHaveBeenCalledTimes(3);
  } finally {
    await client.close();
    await server.close();
    fetchMock.mockRestore();
    consoleMock.mockRestore();
    clearSharedContext();
  }
});

it.each(componentTools)("$name keeps enum validation after successful startup", async (tool) => {
  const server = new McpServer({name: "healthy-test", version: "1.0.0"});
  const client = new Client({name: "healthy-client", version: "1.0.0"});
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const fetchMock = vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(Response.json({components: ["Button"]}));

  try {
    clearSharedContext();
    await initializeTools(server, {apiBaseUrl: "https://api.example.test"});
    await server.connect(serverTransport);
    await client.connect(clientTransport);

    const invalid = await client.callTool({
      name: tool.name,
      arguments: {components: ["Unknown"]},
    });
    expect(invalid.isError).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    fetchMock.mockResolvedValue(
      Response.json({results: [{component: "Button", [tool.field]: "Healthy content"}]}),
    );
    const valid = await client.callTool({name: tool.name, arguments: {components: ["Button"]}});
    expect(valid.isError).not.toBe(true);
    expect(valid.content).toEqual([
      {type: "text", text: expect.stringContaining("Healthy content")},
    ]);
  } finally {
    await client.close();
    await server.close();
    fetchMock.mockRestore();
    clearSharedContext();
  }
});
