import type {Tool} from "./types.js";

import {z} from "zod";

const inputSchema = z.object({
  library: z.enum(["heroui", "native"]).describe("The library to get the component from"),
  component: z.string().describe("The name of the component"),
  version: z
    .string()
    .optional()
    .describe(
      "Specific version to use (e.g., 'v3.0.0-alpha.3'). Defaults to latest if not specified",
    ),
});

export const getComponentExampleTool: Tool = {
  name: "get_component_example",
  description: "Get usage example for a specific HeroUI or HeroUI Native component",

  exec(server, {config, name, description}) {
    server.tool(name, description, inputSchema, async ({library, component, version}) => {
      try {
        let exampleText: string;

        if (config.dataService) {
          // Use R2 data service to generate example
          const componentData = await config.dataService.getComponent(library, component, version);

          if (!componentData) {
            return {
              content: [
                {
                  type: "text",
                  text: `Component "${component}" not found in ${library}${version ? ` version ${version}` : ""}`,
                },
              ],
            };
          }

          // Generate example from component data
          const libraryName = library === "heroui" ? "HeroUI" : "HeroUI Native";
          const versionText = version ? ` (${version})` : " (latest)";

          exampleText = `// ${componentData.name} Component Example - ${libraryName}${versionText}\n\n`;

          if (componentData.importStatement) {
            exampleText += `${componentData.importStatement}\n\n`;
          }

          exampleText += `export default function Example() {\n`;
          exampleText += `  return (\n`;
          exampleText += `    <${componentData.name}`;

          // Add some common props if available
          const commonProps = ["color", "variant", "size"];
          const propsToShow = Object.entries(componentData.props)
            .filter(([name]) => commonProps.includes(name))
            .slice(0, 3);

          if (propsToShow.length > 0) {
            exampleText += "\n";
            propsToShow.forEach(([propName, prop]) => {
              let value = '""';

              if (prop.type.includes("|")) {
                // Enum type, use first option
                const options = prop.type.split("|").map((t) => t.trim().replace(/['"]/g, ""));
                value = `"${options[0]}"`;
              } else if (prop.type === "boolean") {
                value = "";
              }

              if (value) {
                exampleText += `      ${propName}=${value}\n`;
              } else {
                exampleText += `      ${propName}\n`;
              }
            });
            exampleText += `    `;
          }

          exampleText += `>\n`;
          exampleText += `      Content\n`;
          exampleText += `    </${componentData.name}>\n`;
          exampleText += `  );\n`;
          exampleText += `}`;
        } else {
          // Use API endpoint
          const {fetchComponentExample} = await import("../lib/fetch.js");
          exampleText = await fetchComponentExample(library, component, version, config.apiBaseUrl);
        }

        return {
          content: [
            {
              type: "text" as const,
              text: exampleText,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error: Unable to get example for ${component}. ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
        };
      }
    });
  },
};
