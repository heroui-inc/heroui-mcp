/**
 * Fixture dataset seeded into the local R2 bucket before tests run.
 *
 * The shapes here mirror what the extraction pipeline uploads, so the API
 * tests exercise the real routes and services without reaching the network.
 */

import type {
  ComponentDataset,
  LegacyComponentDataset,
  VersionInfo,
} from "../src/shared/types/data";
import type {CSSVariable, ThemeSystem} from "../src/shared/types/theme";

export const FIXTURE_VERSION = "3.0.0-alpha.33";

/** V1 datasets only carry the component name and its source links. */
const components: ComponentDataset = {
  Button: {
    name: "Button",
    links: {
      source: "https://github.com/heroui-inc/heroui/blob/canary/packages/button/src/button.tsx",
      styles: "https://github.com/heroui-inc/heroui/blob/canary/packages/button/src/button.css",
    },
  },
  Card: {
    name: "Card",
    links: {
      source: "https://github.com/heroui-inc/heroui/blob/canary/packages/card/src/card.tsx",
    },
  },
  Tabs: {
    name: "Tabs",
    links: {
      source: "https://github.com/heroui-inc/heroui/blob/canary/packages/tabs/src/tabs.tsx",
    },
  },
};

/** Legacy datasets carry the full documentation payload. */
const legacyComponents: LegacyComponentDataset = {
  Button: {
    name: "Button",
    description: "A pressable element that triggers an action.",
    importStatement: 'import {Button} from "@heroui/react";',
    anatomy: "<Button>{children}</Button>",
    props: {
      variant: {
        name: "variant",
        type: '"primary" | "secondary" | "ghost"',
        description: "Visual style of the button.",
        default: "primary",
      },
      isDisabled: {
        name: "isDisabled",
        type: "boolean",
        description: "Whether the button is disabled.",
        default: false,
      },
    },
    examples: [
      {name: "button", content: "<Button>Press me</Button>"},
      {name: "button-variants", content: '<Button variant="secondary">Press me</Button>'},
    ],
    cssClasses: [{name: "heroui-button", description: "Root element of the button."}],
  },
  Card: {
    name: "Card",
    description: "A surface that groups related content.",
    importStatement: 'import {Card} from "@heroui/react";',
    props: {
      isBlurred: {
        name: "isBlurred",
        type: "boolean",
        description: "Whether the card background is blurred.",
        default: false,
      },
    },
    examples: [{name: "card", content: "<Card>Content</Card>"}],
  },
  Tabs: {
    name: "Tabs",
    description: "A set of layered sections of content.",
    importStatement: 'import {Tabs} from "@heroui/react";',
    props: {
      selectedKey: {
        name: "selectedKey",
        type: "string",
        description: "The currently selected tab.",
      },
    },
    examples: [{name: "tabs", content: "<Tabs>...</Tabs>"}],
  },
};

const baseVariables: CSSVariable[] = [
  {name: "--white", value: "oklch(1 0 0)", category: "colors"},
  {name: "--black", value: "oklch(0 0 0)", category: "colors"},
  {name: "--spacing-md", value: "0.75rem", category: "spacing"},
];

const semanticVariablesLight: CSSVariable[] = [
  {name: "--accent", value: "oklch(0.7 0.25 260)", category: "colors"},
  {name: "--success", value: "oklch(0.75 0.18 150)", category: "colors"},
  {name: "--surface", value: "oklch(0.98 0 0)", category: "colors"},
];

const semanticVariablesDark: CSSVariable[] = [
  {name: "--accent", value: "oklch(0.75 0.25 260)", category: "colors"},
  {name: "--success", value: "oklch(0.8 0.18 150)", category: "colors"},
  {name: "--surface", value: "oklch(0.2 0 0)", category: "colors"},
];

const calculatedVariables: CSSVariable[] = [
  {
    name: "--accent-hover",
    value: "color-mix(in oklch, var(--accent) 90%, black)",
    category: "colors",
    computed: true,
  },
];

const themeSystem: ThemeSystem = {
  version: FIXTURE_VERSION,
  themes: {
    default: {
      name: "default",
      light: {
        base: baseVariables,
        semantic: semanticVariablesLight,
        calculated: calculatedVariables,
      },
      dark: {
        base: baseVariables,
        semantic: semanticVariablesDark,
        calculated: calculatedVariables,
      },
    },
  },
  sharedVariables: [{name: "--radius", value: "0.5rem", category: "radius"}],
  animations: {
    timings: [
      {
        name: "--ease-in-quad",
        value: "cubic-bezier(0.55, 0.085, 0.68, 0.53)",
        description: "Quadratic ease-in.",
      },
    ],
    presets: [
      {
        name: "--animate-spin-fast",
        value: "spin 0.75s linear infinite",
        description: "Fast continuous spin.",
      },
    ],
  },
};

const versions: Record<string, VersionInfo> = {
  "heroui-react": {
    current: FIXTURE_VERSION,
    lastExtracted: "2026-01-01T00:00:00.000Z",
    extractDuration: 4321,
  },
};

const docCategories = [
  {
    name: "Getting Started",
    docs: [
      {
        title: "Installation",
        path: "/docs/react/getting-started/installation",
        description: "Install HeroUI in a React app.",
      },
      {
        title: "Theming",
        path: "/docs/react/getting-started/theming",
        description: "Customize the design tokens.",
      },
    ],
  },
  {
    name: "Components",
    docs: [
      {
        title: "Button",
        path: "/docs/react/components/button",
        description: "A pressable element that triggers an action.",
      },
      {
        title: "Card",
        path: "/docs/react/components/card",
        description: "A surface that groups related content.",
      },
    ],
  },
];

const ctx = {
  components: Object.keys(components).sort(),
  docs: {
    // Kept in sync with the categories: the API flattens one into the other.
    paths: docCategories.flatMap((category) => category.docs.map((doc) => doc.path)),
    categories: docCategories,
  },
  version: FIXTURE_VERSION,
  timestamp: Date.parse("2026-01-01T00:00:00.000Z"),
};

/**
 * Stand-in for https://heroui.com/llms.txt, which the legacy ctx and docs
 * routes parse at request time. Serving a fixed copy keeps those routes
 * deterministic — otherwise the tests assert against whatever the live docs
 * site happens to publish that day.
 */
export const LLMS_TXT = `# Docs

## Getting Started

- [Installation](https://heroui.com/docs/react/getting-started/installation): Install HeroUI in a React app.
- [Theming](https://heroui.com/docs/react/getting-started/theming): Customize the design tokens.

## Components

- [Button](https://heroui.com/docs/react/components/button): A pressable element that triggers an action.
- [Card](https://heroui.com/docs/react/components/card): A surface that groups related content.
- [Tabs](https://heroui.com/docs/react/components/tabs): A set of layered sections of content.
`;

/**
 * R2 object keys mapped to the JSON payload stored at that key. Covers both the
 * v1 layout and the legacy layout that the legacy routes still read from.
 */
export const R2_FIXTURES: Record<string, unknown> = {
  "react/v1/latest/ctx.json": ctx,
  "react/v1/latest/components.json": components,
  "react/v1/latest/theme.json": themeSystem,
  "react/latest/components.json": legacyComponents,
  "react/latest/theme.json": themeSystem,
  [`react/components/${FIXTURE_VERSION}.json`]: legacyComponents,
  [`react/theme/v${FIXTURE_VERSION}.json`]: themeSystem,
  "react/versions.json": versions,
};
