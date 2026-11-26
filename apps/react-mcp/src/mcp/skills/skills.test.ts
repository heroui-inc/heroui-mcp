import type {SkillsDataset} from "../../shared/types/skills";

import {Client} from "@modelcontextprotocol/client";
import {SkillsClient} from "@modelcontextprotocol/client/ext/skills";
import {InMemoryTransport, McpServer} from "@modelcontextprotocol/server";
import {afterEach, expect, it, vi} from "vitest";

import {loadSkills, toSkillFiles} from "./index";

const skillMd = (description: string) => `---
name: heroui-react
description: "${description}"
---

# HeroUI v3 React Development Guide

Call \`list_components\`, then \`get_component_docs\`.
`;

const dataset = (description: string): SkillsDataset => ({
  version: "v3.2.8",
  timestamp: 1,
  skills: {
    "heroui-react": {
      "SKILL.md": skillMd(description),
      "LICENSE.txt": "Apache License 2.0\n",
    },
  },
});

function mockSkillsApi(...responses: Array<SkillsDataset | Response>) {
  const fetchMock = vi.spyOn(globalThis, "fetch");

  for (const response of responses) {
    fetchMock.mockResolvedValueOnce(
      response instanceof Response ? response : Response.json(response),
    );
  }

  return fetchMock;
}

afterEach(() => {
  vi.restoreAllMocks();
});

it("flattens the API response into skill file paths", () => {
  expect(Object.keys(toSkillFiles(dataset("x")))).toEqual([
    "heroui-react/SKILL.md",
    "heroui-react/LICENSE.txt",
  ]);
});

it("serves the skills from the API over MCP with a verified manifest", async () => {
  const fetchMock = mockSkillsApi(dataset("HeroUI v3 React component library."));
  const server = new McpServer({name: "skills-test", version: "1.0.0"});
  const client = new Client({name: "skills-client", version: "1.0.0"});
  const skills = new SkillsClient(client);
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  try {
    const loaded = await loadSkills("https://api.example.test");

    expect(String(fetchMock.mock.calls[0][0])).toBe("https://api.example.test/v1/skills");
    loaded!.catalog.attach(server);

    await server.connect(serverTransport);
    await client.connect(clientTransport);

    expect(skills.supported).toBe(true);

    const listing = await skills.list();

    expect(listing.invalid).toEqual([]);
    expect(listing.skills.map((skill) => skill.uri)).toEqual(["skill://heroui-react/SKILL.md"]);

    // `read` checks the size and SHA-256 digest against the manifest.
    const file = await skills.read(listing.skills[0]);

    expect(file.text).toMatch("# HeroUI v3 React Development Guide");
  } finally {
    await client.close();
    await server.close();
  }
});

it("picks up updated skills on refresh", async () => {
  mockSkillsApi(dataset("Before."), dataset("After."));

  const loaded = await loadSkills("https://api.example.test");

  expect(loaded!.catalog.entries[0].frontmatter.description).toBe("Before.");

  await loaded!.refresh();

  expect(loaded!.catalog.entries[0].frontmatter.description).toBe("After.");
});

it("keeps the current skills when a refresh fails", async () => {
  mockSkillsApi(dataset("Before."), new Response("unavailable", {status: 503}));

  const loaded = await loadSkills("https://api.example.test");

  await loaded!.refresh();

  expect(loaded!.catalog.entries[0].frontmatter.description).toBe("Before.");
});

it("serves tools without skills when the API is unreachable", async () => {
  mockSkillsApi(new Response("unavailable", {status: 503}));

  await expect(loadSkills("https://api.example.test")).resolves.toBeUndefined();
});
