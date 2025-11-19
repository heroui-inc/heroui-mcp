/**
 * Migration guide tool
 *
 * Provides step-by-step instructions for migrating from HeroUI v2 to v3
 */

import type {Tool} from "../types";

import {z} from "zod";

export const getMigrationGuideTool: Tool = {
  name: "get_migration_guide",
  description: `Get comprehensive migration guide for upgrading from HeroUI v2 to v3.
Provides framework-specific instructions, breaking changes, and step-by-step migration steps.
Includes code examples showing v2 vs v3 patterns.`,

  exec(server, {name, description}) {
    const inputSchema = z.object({
      framework: z.enum(["next-app", "next-pages", "vite", "astro", "general"]).optional()
        .describe(`Optional: Specify your framework for framework-specific instructions.
- "next-app": Next.js 14+ with App Router
- "next-pages": Next.js with Pages Router
- "vite": Vite with React
- "astro": Astro framework
- "general": Generic React setup
If not specified, provides general migration guide applicable to all frameworks.`),
    });

    const handler = async ({framework}: z.infer<typeof inputSchema>) => {
      try {
        const guide = generateMigrationGuide(framework);

        return {
          content: [
            {
              type: "text",
              text: guide,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error generating migration guide: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
        };
      }
    };

    // Register tool with SDK - StreamableHTTPTransport handles execution automatically
    server.tool(name, description, inputSchema.shape, handler as any);
  },
};

function generateMigrationGuide(framework?: string): string {
  let guide = `# HeroUI v2 to v3 Migration Guide\n\n`;

  guide += `## Overview\n\n`;
  guide += `HeroUI v3 introduces significant improvements and breaking changes. This guide will help you migrate your v2 project to v3.\n\n`;

  guide += `## ⚠️ Critical Breaking Changes\n\n`;
  guide += `1. **Tailwind CSS v4 Required**: HeroUI v3 requires Tailwind CSS v4 (NOT v3)\n`;
  guide += `2. **No Provider Component**: Unlike v2, v3 components work directly without a Provider wrapper\n`;
  guide += `3. **Compound Components**: Components now use compound patterns (e.g., Card.Header, Card.Content)\n`;
  guide += `4. **onPress Instead of onClick**: Use onPress event handlers for better accessibility\n`;
  guide += `5. **Import Changes**: Import paths and component APIs have changed\n\n`;

  guide += `## Step-by-Step Migration Process\n\n`;

  guide += `### Step 1: Update Dependencies\n\n`;
  guide += `\`\`\`bash\n`;
  guide += `# Remove v2 packages\n`;
  guide += `npm uninstall @heroui/react @heroui/system @heroui/theme\n\n`;
  guide += `# Install v3 packages\n`;
  guide += `npm install @heroui/react@beta @heroui/styles@beta tailwind-variants\n\n`;
  guide += `# Install Tailwind CSS v4 (REQUIRED)\n`;
  guide += `npm install tailwindcss@next @tailwindcss/postcss postcss\n`;
  guide += `\`\`\`\n\n`;

  guide += `### Step 2: Update Tailwind CSS Configuration\n\n`;
  guide += `**v2 Configuration (OLD):**\n`;
  guide += `\`\`\`js\n`;
  guide += `// tailwind.config.js (v2)\n`;
  guide += `module.exports = {\n`;
  guide += `  content: ["./src/**/*.{js,ts,jsx,tsx}"],\n`;
  guide += `  theme: {\n`;
  guide += `    extend: {},\n`;
  guide += `  },\n`;
  guide += `  plugins: [],\n`;
  guide += `};\n`;
  guide += `\`\`\`\n\n`;

  guide += `**v3 Configuration (NEW):**\n`;
  guide += `\`\`\`css\n`;
  guide += `/* src/globals.css or src/index.css */\n`;
  guide += `/* Tailwind CSS v4 - Must be first */\n`;
  guide += `@import "tailwindcss";\n\n`;
  guide += `/* HeroUI v3 styles - Must be after Tailwind */\n`;
  guide += `@import "@heroui/styles";\n`;
  guide += `\`\`\`\n\n`;

  guide += `**PostCSS Configuration:**\n`;
  guide += `\`\`\`js\n`;
  guide += `// postcss.config.mjs\n`;
  guide += `export default {\n`;
  guide += `  plugins: {\n`;
  guide += `    "@tailwindcss/postcss": {},\n`;
  guide += `  },\n`;
  guide += `};\n`;
  guide += `\`\`\`\n\n`;

  guide += `### Step 3: Remove Provider Component\n\n`;
  guide += `**v2 Code (OLD):**\n`;
  guide += `\`\`\`tsx\n`;
  guide += `import { HeroUIProvider } from "@heroui/react";\n\n`;
  guide += `function App() {\n`;
  guide += `  return (\n`;
  guide += `    <HeroUIProvider>\n`;
  guide += `      {/* Your app */}\n`;
  guide += `    </HeroUIProvider>\n`;
  guide += `  );\n`;
  guide += `}\n`;
  guide += `\`\`\`\n\n`;

  guide += `**v3 Code (NEW):**\n`;
  guide += `\`\`\`tsx\n`;
  guide += `// No Provider needed!\n`;
  guide += `function App() {\n`;
  guide += `  return (\n`;
  guide += `    {/* Your app - works directly */}\n`;
  guide += `  );\n`;
  guide += `}\n`;
  guide += `\`\`\`\n\n`;

  guide += `### Step 4: Update Component Imports\n\n`;
  guide += `**v2 Imports (OLD):**\n`;
  guide += `\`\`\`tsx\n`;
  guide += `import { Button, Card } from "@heroui/react";\n`;
  guide += `\`\`\`\n\n`;

  guide += `**v3 Imports (NEW):**\n`;
  guide += `\`\`\`tsx\n`;
  guide += `import { Button, Card } from "@heroui/react";\n`;
  guide += `// Same import path, but components work differently\n`;
  guide += `\`\`\`\n\n`;

  guide += `### Step 5: Update Component Usage\n\n`;
  guide += `**v2 Card Component (OLD):**\n`;
  guide += `\`\`\`tsx\n`;
  guide += `<Card>\n`;
  guide += `  <CardHeader>\n`;
  guide += `    <CardTitle>Title</CardTitle>\n`;
  guide += `  </CardHeader>\n`;
  guide += `  <CardBody>Content</CardBody>\n`;
  guide += `</Card>\n`;
  guide += `\`\`\`\n\n`;

  guide += `**v3 Card Component (NEW):**\n`;
  guide += `\`\`\`tsx\n`;
  guide += `<Card>\n`;
  guide += `  <Card.Header>\n`;
  guide += `    <Card.Title>Title</Card.Title>\n`;
  guide += `  </Card.Header>\n`;
  guide += `  <Card.Content>Content</Card.Content>\n`;
  guide += `</Card>\n`;
  guide += `\`\`\`\n\n`;

  guide += `**v2 Button (OLD):**\n`;
  guide += `\`\`\`tsx\n`;
  guide += `<Button onClick={handleClick}>Click me</Button>\n`;
  guide += `\`\`\`\n\n`;

  guide += `**v3 Button (NEW):**\n`;
  guide += `\`\`\`tsx\n`;
  guide += `<Button onPress={handlePress}>Click me</Button>\n`;
  guide += `\`\`\`\n\n`;

  if (framework === "next-app") {
    guide += `\n## Next.js App Router Specific Notes\n\n`;
    guide += `- Use \`"use client"\` directive for components with event handlers\n`;
    guide += `- Server components can use HeroUI components without event handlers\n`;
    guide += `- Use Next.js Link component with \`className="link"\` for HeroUI styled links\n`;
    guide += `- Import global CSS in \`app/layout.tsx\`\n\n`;
  } else if (framework === "next-pages") {
    guide += `\n## Next.js Pages Router Specific Notes\n\n`;
    guide += `- Import global CSS in \`pages/_app.tsx\`\n`;
    guide += `- Use Next.js Link component with \`className="link"\` for HeroUI styled links\n`;
    guide += `- Add \`suppressHydrationWarning\` to \`<Html>\` tag in \`_document.tsx\`\n\n`;
  } else if (framework === "vite") {
    guide += `\n## Vite Specific Notes\n\n`;
    guide += `- Use \`@tailwindcss/vite\` plugin instead of PostCSS\n`;
    guide += `- Import CSS in \`src/index.css\`\n`;
    guide += `- Configure Vite with Tailwind plugin in \`vite.config.ts\`\n\n`;
  }

  guide += `## Common Migration Patterns\n\n`;

  guide += `### Theme Customization\n\n`;
  guide += `**v2 Theme (OLD):**\n`;
  guide += `\`\`\`tsx\n`;
  guide += `const theme = {\n`;
  guide += `  colors: { ... },\n`;
  guide += `};\n`;
  guide += `\`\`\`\n\n`;

  guide += `**v3 Theme (NEW):**\n`;
  guide += `\`\`\`css\n`;
  guide += `:root {\n`;
  guide += `  --radius: 0.75rem;\n`;
  guide += `  --color-accent: oklch(0.7 0.25 260);\n`;
  guide += `}\n`;
  guide += `\`\`\`\n\n`;

  guide += `## Testing Your Migration\n\n`;
  guide += `1. **Check for TypeScript Errors**: Run \`tsc --noEmit\` to find type errors\n`;
  guide += `2. **Test Components**: Verify all components render correctly\n`;
  guide += `3. **Test Interactions**: Ensure event handlers work (onPress, etc.)\n`;
  guide += `4. **Check Styling**: Verify Tailwind CSS v4 is working correctly\n`;
  guide += `5. **Test Dark Mode**: Verify dark mode works with \`[data-theme="dark"]\` or \`.dark\`\n\n`;

  guide += `## Additional Resources\n\n`;
  guide += `- HeroUI v3 Documentation: https://v3.heroui.com\n`;
  guide += `- Tailwind CSS v4 Docs: https://tailwindcss.com/docs\n`;
  guide += `- Migration Issues? Open an issue: https://github.com/heroui-inc/heroui/issues\n\n`;

  guide += `## Need Help?\n\n`;
  guide += `If you encounter issues during migration:\n`;
  guide += `1. Check the [HeroUI v3 documentation](https://v3.heroui.com)\n`;
  guide += `2. Review component examples in the docs\n`;
  guide += `3. Check the [GitHub discussions](https://github.com/heroui-inc/heroui/discussions)\n`;

  return guide;
}
