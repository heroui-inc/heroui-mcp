/* eslint-disable @typescript-eslint/no-explicit-any */
import type {Tool} from "./types";

import {z} from "zod";

import {fetchApi} from "../lib/fetch";

type InstallationStep = {
  title: string;
  description?: string;
  command?: string;
  code?: string;
  file?: string;
  language?: string;
  packageManager?: string;
};

type FrameworkGuide = {
  framework: string;
  nodeVersion: string;
  requirements: string[];
  steps: InstallationStep[];
  notes?: string[];
};

interface VersionsResponse {
  heroui: {
    latest: string;
    versions: string[];
  };
  mcp: {
    current: string;
  };
}

export const installationTool: Tool = {
  name: "installation",
  description: `Get installation guide for NEW HeroUI v3 (Alpha) projects - NOT for migrating from v2.
⚠️ IMPORTANT: This is for NEW projects only - Migration from v2 to v3 is NOT supported yet.
Migration tool will be available when v3 reaches stable release.
CRITICAL: HeroUI v3 requires Tailwind CSS v4 (NOT v3) - this is mandatory.
Automatically fetches the latest HeroUI v3 alpha version.
Provides framework-specific setup for Next.js App Router, Pages Router, Vite, or general React.
Unlike v2, HeroUI v3 does NOT require a Provider component - it works directly.
Includes all required dependencies: @heroui/react, @heroui/styles, and tailwind-variants.
v3 Status: ALPHA - expect breaking changes, use for new projects only.
For v2 projects: Continue using v2 until migration tool is available with v3 stable.`,

  exec(server, {config, name, description}) {
    const inputSchema = z.object({
      framework: z.enum(["next-app", "next-pages", "vite", "general"])
        .describe(`Choose your framework:
- "next-app": Next.js 14+ with App Router (recommended)
- "next-pages": Next.js with Pages Router
- "vite": Vite with React
- "general": Generic React setup`),
      packageManager: z
        .enum(["npm", "pnpm", "yarn", "bun"])
        .optional()
        .describe(`Package manager to use for install commands. Defaults to npm.`),
    });

    const handler = async ({framework, packageManager = "npm"}: z.infer<typeof inputSchema>) => {
      try {
        // Fetch latest version from API
        let latestVersion = "alpha"; // fallback
        try {
          const versionData = await fetchApi<VersionsResponse>("/versions", config.apiBaseUrl);
          if (versionData?.heroui?.latest) {
            latestVersion = versionData.heroui.latest;
          }
        } catch (error) {
          console.warn("Could not fetch latest version, using alpha tag", error);
        }

        // Package manager specific commands
        const installCmd = {
          npm: "npm install",
          pnpm: "pnpm add",
          yarn: "yarn add",
          bun: "bun add",
        }[packageManager];

        const devInstallCmd = {
          npm: "npm install --save-dev",
          pnpm: "pnpm add -D",
          yarn: "yarn add --dev",
          bun: "bun add --dev",
        }[packageManager];

        // Base installation command with latest version
        const baseInstallStep: InstallationStep = {
          title: "Install HeroUI v3 packages",
          description: `Install HeroUI v3 (${latestVersion}) with required dependencies`,
          command: `${installCmd} @heroui/react@alpha @heroui/styles@alpha tailwind-variants`,
          packageManager,
        };

        // Tailwind CSS v4 installation
        const tailwindV4Step: InstallationStep = {
          title: "Install Tailwind CSS v4",
          description: "HeroUI v3 requires Tailwind CSS v4 (NOT v3)",
          command: `${installCmd} tailwindcss@next @tailwindcss/postcss@next`,
          packageManager,
        };

        // CSS configuration for all frameworks
        const cssSetupStep: InstallationStep = {
          title: "Configure CSS imports",
          description: "Import order is critical - Tailwind first, then HeroUI",
          file: "src/globals.css or src/index.css",
          language: "css",
          code: `/* Tailwind CSS v4 - Must be first */
@import "tailwindcss";

/* HeroUI v3 styles - Must be after Tailwind */
@import "@heroui/styles";

/* Optional: Custom theme overrides */
:root {
  /* Customize design tokens */
  /* --radius: 0.75rem; */
  /* --color-accent: oklch(0.7 0.25 260); */
}

/* Dark mode overrides */
[data-theme="dark"],
.dark {
  /* --background: oklch(0.1 0 0); */
  /* --foreground: oklch(0.95 0 0); */
}`,
        };

        // TypeScript configuration
        const tsConfigStep: InstallationStep = {
          title: "Update TypeScript configuration",
          description: "Configure module resolution and paths",
          file: "tsconfig.json",
          language: "json",
          code: `{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}`,
        };

        // Sample usage
        const usageExample: InstallationStep = {
          title: "Using HeroUI v3 components",
          description: "Import and use components directly - no Provider needed!",
          file: "App.tsx or page.tsx",
          language: "tsx",
          code: `import { Button, Card, Chip } from "@heroui/react";

export default function MyComponent() {
  return (
    <Card className="p-6 max-w-md mx-auto">
      <Card.Header>
        <Card.Title>Welcome to HeroUI v3</Card.Title>
        <Card.Description>
          Modern React components with Tailwind CSS v4
        </Card.Description>
      </Card.Header>
      <Card.Content className="space-y-4">
        <Chip type="success">Success</Chip>
        <Button
          variant="accent"
          onPress={() => console.log("Pressed!")}
        >
          Get Started
        </Button>
      </Card.Content>
    </Card>
  );
}`,
        };

        // Framework-specific configurations
        const frameworkGuides: Record<string, FrameworkGuide> = {
          "next-app": {
            framework: "Next.js App Router",
            nodeVersion: "Node.js 20.x or later",
            requirements: [
              "Next.js 14.0 or later",
              "React 19.0 or later",
              "Tailwind CSS v4 (NOT v3)",
            ],
            steps: [
              tailwindV4Step,
              baseInstallStep,
              {
                title: "Create or update global CSS",
                file: "app/globals.css",
                language: "css",
                code: cssSetupStep.code!,
              },
              {
                title: "Import global CSS in root layout",
                file: "app/layout.tsx",
                language: "tsx",
                code: `import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "My HeroUI App",
  description: "Built with HeroUI v3 and Next.js",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {/* No Provider needed in HeroUI v3! */}
        {children}
      </body>
    </html>
  );
}`,
              },
              tsConfigStep,
              {
                title: "Configure PostCSS (if needed)",
                file: "postcss.config.mjs",
                language: "js",
                code: `export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};`,
              },
              usageExample,
              {
                title: "Optimize bundle (optional)",
                file: "next.config.mjs",
                language: "js",
                code: `/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize HeroUI imports
  transpilePackages: ["@heroui/react", "@heroui/styles"],

  // Optional: Optimize bundle size
  experimental: {
    optimizePackageImports: ["@heroui/react"],
  },
};

export default nextConfig;`,
              },
            ],
            notes: [
              "HeroUI v3 uses compound components (e.g., Card.Header, Card.Content)",
              "Use onPress instead of onClick for better accessibility",
              'Dark mode works with [data-theme="dark"] or .dark class',
              "No Provider component needed - components work directly",
            ],
          },

          "next-pages": {
            framework: "Next.js Pages Router",
            nodeVersion: "Node.js 20.x or later",
            requirements: [
              "Next.js 14.0 or later",
              "React 19.0 or later",
              "Tailwind CSS v4 (NOT v3)",
            ],
            steps: [
              tailwindV4Step,
              baseInstallStep,
              {
                title: "Create or update global CSS",
                file: "styles/globals.css",
                language: "css",
                code: cssSetupStep.code!,
              },
              {
                title: "Import global CSS in _app",
                file: "pages/_app.tsx",
                language: "tsx",
                code: `import type { AppProps } from "next/app";
import "../styles/globals.css";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    // No Provider needed in HeroUI v3!
    <Component {...pageProps} />
  );
}`,
              },
              {
                title: "Configure _document for proper hydration",
                file: "pages/_document.tsx",
                language: "tsx",
                code: `import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en" suppressHydrationWarning>
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}`,
              },
              tsConfigStep,
              {
                title: "Configure PostCSS",
                file: "postcss.config.mjs",
                language: "js",
                code: `export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};`,
              },
              usageExample,
            ],
            notes: [
              "Import styles in _app.tsx, not in _document.tsx",
              "suppressHydrationWarning prevents hydration mismatches",
              "HeroUI v3 components work without any Provider wrapper",
            ],
          },

          vite: {
            framework: "Vite",
            nodeVersion: "Node.js 20.x or later",
            requirements: ["Vite 5.0 or later", "React 19.0 or later", "Tailwind CSS v4 (NOT v3)"],
            steps: [
              tailwindV4Step,
              baseInstallStep,
              {
                title: "Install Vite plugins",
                command: `${devInstallCmd} @vitejs/plugin-react vite-tsconfig-paths`,
                packageManager,
              },
              {
                title: "Create or update main CSS",
                file: "src/index.css",
                language: "css",
                code: cssSetupStep.code!,
              },
              {
                title: "Import CSS in main.tsx",
                file: "src/main.tsx",
                language: "tsx",
                code: `import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* No Provider needed in HeroUI v3! */}
    <App />
  </React.StrictMode>
);`,
              },
              {
                title: "Configure Vite",
                file: "vite.config.ts",
                language: "ts",
                code: `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  css: {
    postcss: {
      plugins: [
        require("@tailwindcss/postcss")(),
      ],
    },
  },
});`,
              },
              tsConfigStep,
              usageExample,
            ],
            notes: [
              "Vite's HMR works great with HeroUI v3 components",
              "Use vite-tsconfig-paths for path aliases",
              "CSS imports go in index.css, not in component files",
            ],
          },

          general: {
            framework: "General React Setup",
            nodeVersion: "Node.js 20.x or later",
            requirements: [
              "React 19.0 or later",
              "Tailwind CSS v4 (NOT v3)",
              "Build tool that supports CSS imports",
            ],
            steps: [
              {
                title: "Install Tailwind CSS v4",
                description: "Install the next version of Tailwind CSS",
                command: `${installCmd} tailwindcss@next @tailwindcss/postcss@next`,
                packageManager,
              },
              baseInstallStep,
              cssSetupStep,
              {
                title: "Import styles in your app entry point",
                description: "Import the CSS file at the root of your application",
                language: "tsx",
                code: `import "./styles/globals.css"; // or your CSS file path
import { createRoot } from "react-dom/client";
import App from "./App";

const container = document.getElementById("root");
const root = createRoot(container!);

root.render(
  // No Provider needed in HeroUI v3!
  <App />
);`,
              },
              tsConfigStep,
              {
                title: "Configure PostCSS",
                description: "Set up PostCSS to process Tailwind CSS v4",
                file: "postcss.config.js",
                language: "js",
                code: `module.exports = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};`,
              },
              usageExample,
            ],
            notes: [
              "Ensure your build tool supports CSS imports",
              "PostCSS configuration may vary by build tool",
              "Check that you're using React 19+ for best compatibility",
            ],
          },
        };

        const guide = frameworkGuides[framework];

        // Format output as structured text
        let output = `# HeroUI v3 Installation Guide (NEW Projects Only)\n\n`;
        output += `## ⚠️ IMPORTANT: No Migration Support Yet\n\n`;
        output += `This guide is for **NEW projects only**. Migration from HeroUI v2 to v3 is **NOT supported yet**.\n`;
        output += `- **v2 Projects:** Continue using v2 until migration tool is available\n`;
        output += `- **v3 Status:** ALPHA - expect breaking changes\n`;
        output += `- **Migration Tool:** Will be available when v3 reaches stable release\n\n`;
        output += `## Framework: ${guide.framework}\n\n`;
        output += `### Requirements\n`;
        output += `- ${guide.nodeVersion}\n`;
        guide.requirements.forEach((req) => {
          output += `- ${req}\n`;
        });
        output += `\n**Latest HeroUI Version:** ${latestVersion}\n\n`;
        output += `### Installation Steps\n\n`;

        guide.steps.forEach((step, index) => {
          output += `#### ${index + 1}. ${step.title}\n\n`;
          if (step.description) {
            output += `${step.description}\n\n`;
          }
          if (step.command) {
            output += `\`\`\`bash\n${step.command}\n\`\`\`\n\n`;
          }
          if (step.file) {
            output += `**File:** \`${step.file}\`\n\n`;
          }
          if (step.code) {
            const lang = step.language || "typescript";
            output += `\`\`\`${lang}\n${step.code}\n\`\`\`\n\n`;
          }
        });

        if (guide.notes && guide.notes.length > 0) {
          output += `### Important Notes\n\n`;
          guide.notes.forEach((note) => {
            output += `- ${note}\n`;
          });
          output += `\n`;
        }

        // Add critical reminders
        output += `### ⚠️ Critical Reminders\n\n`;
        output += `1. **Tailwind CSS v4 is MANDATORY** - HeroUI v3 will NOT work with Tailwind CSS v3\n`;
        output += `2. **No Provider Required** - Unlike HeroUI v2, v3 components work directly without a Provider\n`;
        output += `3. **Use Compound Components** - Components like Card use Card.Header, Card.Content pattern\n`;
        output += `4. **Use onPress, not onClick** - For better accessibility, use onPress event handlers\n`;
        output += `5. **Import Order Matters** - Always import Tailwind CSS before HeroUI styles\n\n`;

        output += `### Next Steps\n\n`;
        output += `- Use \`list_components\` to see all available components\n`;
        output += `- Use \`get_component_info\` to learn about specific components\n`;
        output += `- Use \`get_docs\` with path "/docs/quick-start" for more details\n`;
        output += `- Visit https://v3.heroui.com for full documentation\n`;

        return {
          content: [
            {
              type: "text",
              text: output,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error generating installation guide: ${error instanceof Error ? error.message : "Unknown error"}

Fallback: Install with: npm install @heroui/react@alpha @heroui/styles@alpha tailwind-variants tailwindcss@next

Remember: HeroUI v3 requires Tailwind CSS v4, not v3!`,
            },
          ],
        };
      }
    };

    // Register tool
    server.tool(name, description, inputSchema.shape, handler as any);
  },
};
