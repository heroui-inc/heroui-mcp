/* eslint-disable @typescript-eslint/no-explicit-any */
import type {Tool} from "./types";

import {z} from "zod";

export const installationTool: Tool = {
  name: "installation",
  description: `Get installation guide for HeroUI Native projects.
Provides framework-specific setup for React Native, Expo, or bare React Native projects.
Includes all required dependencies and configuration steps.
HeroUI Native is a React Native component library for mobile applications.`,

  exec(server, {name, description}) {
    const inputSchema = z.object({
      framework: z.enum(["react-native", "expo", "bare"]).describe(`Choose your framework:
- "react-native": Standard React Native CLI project
- "expo": Expo managed or bare workflow
- "bare": Bare React Native without Expo`),
      packageManager: z
        .enum(["npm", "pnpm", "yarn", "bun"])
        .optional()
        .describe(`Package manager to use for install commands. Defaults to npm.`),
    });

    const handler = async ({framework, packageManager = "npm"}: z.infer<typeof inputSchema>) => {
      const installCmd =
        packageManager === "npm"
          ? "npm install"
          : packageManager === "pnpm"
            ? "pnpm add"
            : packageManager === "yarn"
              ? "yarn add"
              : "bun add";

      let responseText = `# HeroUI Native Installation Guide\n\n`;
      responseText += `**Framework:** ${framework}\n`;
      responseText += `**Package Manager:** ${packageManager}\n\n`;

      responseText += `## Step 1: Install HeroUI Native\n\n`;
      responseText += `\`\`\`bash\n${installCmd} @heroui/native\n\`\`\`\n\n`;

      responseText += `## Step 2: Install Peer Dependencies\n\n`;
      responseText += `\`\`\`bash\n${installCmd} react-native-reanimated react-native-gesture-handler react-native-safe-area-context\n\`\`\`\n\n`;

      if (framework === "expo") {
        responseText += `## Step 3: Expo-specific Configuration\n\n`;
        responseText += `### Install Expo modules\n`;
        responseText += `\`\`\`bash\nnpx expo install expo-haptics expo-blur\n\`\`\`\n\n`;
        responseText += `### Update app.json\n`;
        responseText += `\`\`\`json\n{\n  "expo": {\n    "plugins": [\n      "react-native-reanimated/plugin"\n    ]\n  }\n}\n\`\`\`\n\n`;
      } else if (framework === "react-native" || framework === "bare") {
        responseText += `## Step 3: iOS Configuration\n\n`;
        responseText += `### Install iOS dependencies\n`;
        responseText += `\`\`\`bash\ncd ios && pod install\n\`\`\`\n\n`;

        responseText += `## Step 4: Android Configuration\n\n`;
        responseText += `### Update android/app/build.gradle\n`;
        responseText += `\`\`\`gradle\nandroid {\n  ...\n  packagingOptions {\n    pickFirst '**/libc++_shared.so'\n    pickFirst '**/libjsc.so'\n  }\n}\n\`\`\`\n\n`;
      }

      responseText += `## Step 5: Wrap Your App with HeroUIProvider\n\n`;
      responseText += `\`\`\`tsx\nimport React from 'react';\nimport {HeroUIProvider} from '@heroui/native';\n\n`;
      responseText += `function App() {\n`;
      responseText += `  return (\n`;
      responseText += `    <HeroUIProvider>\n`;
      responseText += `      {/* Your app content */}\n`;
      responseText += `    </HeroUIProvider>\n`;
      responseText += `  );\n}\n\n`;
      responseText += `export default App;\n\`\`\`\n\n`;

      responseText += `## Step 6: Start Using Components\n\n`;
      responseText += `\`\`\`tsx\nimport {Button, Card, Text} from '@heroui/native';\n\n`;
      responseText += `function MyComponent() {\n`;
      responseText += `  return (\n`;
      responseText += `    <Card>\n`;
      responseText += `      <Text>Welcome to HeroUI Native!</Text>\n`;
      responseText += `      <Button onPress={() => console.log('Pressed!')}>\n`;
      responseText += `        Get Started\n`;
      responseText += `      </Button>\n`;
      responseText += `    </Card>\n`;
      responseText += `  );\n}\n\`\`\`\n\n`;

      responseText += `## Additional Resources\n\n`;
      responseText += `- Use \`list_components\` to see all available components\n`;
      responseText += `- Use \`get_component_info\` for detailed component documentation\n`;
      responseText += `- Use \`get_theme_info\` to learn about theming options\n`;

      return {
        content: [
          {
            type: "text" as const,
            text: responseText,
          },
        ],
      };
    };

    server.tool(name, description, inputSchema.shape, handler as any);
  },
};
