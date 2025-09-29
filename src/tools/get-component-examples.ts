/* eslint-disable @typescript-eslint/no-explicit-any */
import type {Tool} from "./types";

import {z} from "zod";

import {fetchApi} from "../lib/fetch";

const inputSchema = z.object({
  library: z.enum(["heroui", "native"]).describe("The library to get the component from"),
  component: z.string().describe("The name of the component"),
  version: z
    .string()
    .optional()
    .describe(
      "Specific version to use (e.g., 'v3.0.0-alpha.31'). Defaults to latest if not specified",
    ),
});

export const getComponentExamplesTool: Tool = {
  name: "get_component_examples",
  description: "Get usage examples for a specific HeroUI or HeroUI Native component",
  exec(server, {config, name, description}) {
    const handler = async ({library, component, version}: z.infer<typeof inputSchema>) => {
      try {
        // Encode component name to handle special characters and ensure proper URL encoding
        const encodedComponent = encodeURIComponent(component);
        const endpoint = `/components/${library}/${encodedComponent}/examples${version ? `?version=${version}` : ""}`;

        try {
          const data = await fetchApi<{examples: Array<{name: string; content: string}>}>(
            endpoint,
            config.apiBaseUrl,
          );
          const examples = data.examples || [];
          const exampleText =
            examples.length > 0
              ? examples.map((ex) => `// ${ex.name} example\n${ex.content}`).join("\n\n")
              : `No examples available for ${component}`;

          return {
            content: [
              {
                type: "text" as const,
                text: exampleText,
              },
            ],
          };
        } catch (error: any) {
          if (error.status === 404) {
            // Try with different case variations if not found
            const variations = [
              component.charAt(0).toUpperCase() + component.slice(1).toLowerCase(), // Capitalize first letter
              component.toLowerCase(), // All lowercase
              component.toUpperCase(), // All uppercase
            ];

            for (const variation of variations) {
              if (variation !== component) {
                try {
                  const altEndpoint = `/components/${library}/${encodeURIComponent(variation)}/examples${version ? `?version=${version}` : ""}`;
                  const altData = await fetchApi<{
                    examples: Array<{name: string; content: string}>;
                  }>(altEndpoint, config.apiBaseUrl);
                  const examples = altData.examples || [];
                  const exampleText =
                    examples.length > 0
                      ? examples.map((ex) => `// ${ex.name} example\n${ex.content}`).join("\n\n")
                      : `No examples available for ${component}`;

                  return {
                    content: [
                      {
                        type: "text" as const,
                        text: exampleText,
                      },
                    ],
                  };
                } catch {
                  // Continue to next variation
                }
              }
            }

            return {
              content: [
                {
                  type: "text",
                  text: `Component "${component}" not found in ${library}${version ? ` version ${version}` : ""}`,
                },
              ],
            };
          }
          throw error;
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error: Unable to get examples for ${component}. ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
        };
      }
    };

    // Register tool
    server.tool(name, description, inputSchema.shape, handler as any);
  },
};
