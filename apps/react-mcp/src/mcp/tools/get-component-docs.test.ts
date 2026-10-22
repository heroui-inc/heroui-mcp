import {Client} from "@modelcontextprotocol/sdk/client/index.js";
import {InMemoryTransport} from "@modelcontextprotocol/sdk/inMemory.js";
import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
import {expect, it, vi} from "vitest";

import {getComponentDocsTool} from "./get-component-docs";

it("publishes and validates Zod 4 tool schemas through the MCP SDK", async () => {
  const server = new McpServer({name: "schema-test", version: "1.0.0"});
  const client = new Client({name: "schema-client", version: "1.0.0"});
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const fetchMock = vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(
      Response.json({results: [{component: "Button", content: "# Button documentation"}]}),
    );

  try {
    await getComponentDocsTool.exec(server, {
      name: getComponentDocsTool.name,
      description: getComponentDocsTool.description,
      config: {apiBaseUrl: "https://api.example.test"},
      ctx: {componentList: ["Button", "Card"]},
    });
    await server.connect(serverTransport);
    await client.connect(clientTransport);

    const {tools} = await client.listTools();

    expect(tools[0].inputSchema).toMatchObject({
      type: "object",
      required: ["components"],
      properties: {
        components: {
          type: "array",
          minItems: 1,
          items: {type: "string", enum: ["Button", "Card"]},
        },
      },
    });

    const result = await client.callTool({
      name: getComponentDocsTool.name,
      arguments: {components: ["Button"]},
    });

    expect(result.isError).not.toBe(true);
    expect(result.content).toEqual([
      {type: "text", text: expect.stringContaining("# Button documentation")},
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    for (const components of [[], ["Unknown"], "Button"]) {
      const invalid = await client.callTool({
        name: getComponentDocsTool.name,
        arguments: {components},
      });

      expect(invalid.isError).toBe(true);
    }

    expect(fetchMock).toHaveBeenCalledTimes(1);
  } finally {
    fetchMock.mockRestore();
    await client.close();
    await server.close();
  }
});
