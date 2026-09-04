/**
 * Fixture dataset seeded into the local R2 bucket before tests run.
 *
 * The shapes here mirror what the extraction pipeline uploads, so the API
 * tests exercise the real routes and services without reaching the network.
 */

import type {ComponentDataset, VersionInfo} from "../src/shared/types/data";
import type {ThemeSystem} from "../src/shared/types/theme";

export const FIXTURE_VERSION = "1.0.0-alpha.14";

const components: ComponentDataset = {
  Button: {
    name: "Button",
    description: "A pressable element that triggers an action.",
    importStatement: 'import {Button} from "heroui-native";',
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
  },
  Card: {
    name: "Card",
    description: "A surface that groups related content.",
    importStatement: 'import {Card} from "heroui-native";',
    props: {
      surfaceVariant: {
        name: "surfaceVariant",
        type: '"default" | "elevated"',
        description: "Surface treatment of the card.",
        default: "default",
      },
    },
    examples: [{name: "card", content: "<Card>Content</Card>"}],
  },
  Checkbox: {
    name: "Checkbox",
    description: "A control that toggles between checked and unchecked.",
    importStatement: 'import {Checkbox} from "heroui-native";',
    props: {
      isSelected: {
        name: "isSelected",
        type: "boolean",
        description: "Whether the checkbox is checked.",
        default: false,
      },
    },
    examples: [{name: "checkbox", content: "<Checkbox />"}],
  },
};

const themeSystem: ThemeSystem = {
  version: FIXTURE_VERSION,
  themes: {
    default: {
      name: "default",
      light: {
        colors: [
          {name: "background", value: "0 0% 100%", category: "base"},
          {name: "foreground", value: "240 10% 4%", category: "base"},
          {name: "accent", value: "211 100% 50%", category: "semantic"},
          {name: "success", value: "142 71% 45%", category: "status"},
        ],
      },
      dark: {
        colors: [
          {name: "background", value: "240 10% 4%", category: "base"},
          {name: "foreground", value: "0 0% 98%", category: "base"},
          {name: "accent", value: "211 100% 60%", category: "semantic"},
          {name: "success", value: "142 71% 55%", category: "status"},
        ],
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        panel: "0.75rem",
        "panel-inner": "0.5rem",
      },
      opacity: {
        disabled: 0.5,
      },
    },
  },
};

const versions: Record<string, VersionInfo> = {
  "heroui-native": {
    current: FIXTURE_VERSION,
    lastExtracted: "2026-01-01T00:00:00.000Z",
    extractDuration: 1234,
  },
};

const ctx = {
  components: Object.keys(components).sort(),
  docs: {
    paths: [
      "/docs/native/getting-started/installation",
      "/docs/native/getting-started/theming",
      "/docs/native/components/button",
    ],
    categories: [
      {
        name: "Getting Started",
        docs: [
          {
            title: "Installation",
            path: "/docs/native/getting-started/installation",
            description: "Install HeroUI Native in an Expo or React Native app.",
          },
          {
            title: "Theming",
            path: "/docs/native/getting-started/theming",
            description: "Customize colors and radii.",
          },
        ],
      },
      {
        name: "Components",
        docs: [
          {
            title: "Button",
            path: "/docs/native/components/button",
            description: "A pressable element that triggers an action.",
          },
        ],
      },
    ],
  },
  version: FIXTURE_VERSION,
  timestamp: Date.parse("2026-01-01T00:00:00.000Z"),
};

/**
 * R2 object keys mapped to the JSON payload stored at that key. Covers both the
 * v1 layout and the legacy layout that the legacy routes still read from.
 */
export const R2_FIXTURES: Record<string, unknown> = {
  "native/v1/latest/ctx.json": ctx,
  "native/v1/latest/theme.json": themeSystem,
  "native/latest/components.json": components,
  "native/latest/theme.json": themeSystem,
  [`native/components/${FIXTURE_VERSION}.json`]: components,
  [`native/theme/${FIXTURE_VERSION}.json`]: themeSystem,
  "native/versions.json": versions,
};
