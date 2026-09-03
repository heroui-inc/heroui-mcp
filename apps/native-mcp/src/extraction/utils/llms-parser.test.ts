/**
 * Unit Tests for llms.txt Parser
 */

import {describe, expect, it} from "vitest";

import {parseAllDocsFromLlmsTxt, parseLlmsTxt} from "./llms-parser";

const LLMS_TXT = `# HeroUI Native Documentation

## Documentation Index

### Components

- [Button](https://heroui.com/en/docs/native/components/button): A pressable button component
- [Menu](https://heroui.com/en/docs/native/components/menu): A floating context menu

### Releases

- [v1.0.9](https://heroui.com/en/docs/native/releases/v1-0-9): Patch release

### Chinese

- [Button 按钮](https://heroui.com/cn/docs/native/components/button): 可点击的按钮组件

### React

- [Card](https://heroui.com/en/docs/react/components/card): A container component
`;

describe("llms.txt parser", () => {
  describe("parseLlmsTxt", () => {
    it("should extract components from locale-prefixed URLs", () => {
      const components = parseLlmsTxt(LLMS_TXT);

      expect(components.map((component) => component.url)).toEqual([
        "/docs/native/components/button",
        "/docs/native/components/menu",
      ]);
    });

    it("should skip non-default locales so translations are not duplicated", () => {
      const components = parseLlmsTxt(LLMS_TXT);

      expect(components).toHaveLength(2);
      expect(components.every((component) => !component.title.includes("按钮"))).toBe(true);
    });

    it("should still support legacy www URLs without a locale prefix", () => {
      const components = parseLlmsTxt(
        "- [Button](https://www.heroui.com/docs/native/components/button): A pressable button",
      );

      expect(components).toEqual([
        {
          title: "Button",
          url: "/docs/native/components/button",
          description: "A pressable button",
          category: undefined,
        },
      ]);
    });

    it("should exclude react components", () => {
      const components = parseLlmsTxt(LLMS_TXT);

      expect(components.every((component) => !component.url.includes("/react/"))).toBe(true);
    });
  });

  describe("parseAllDocsFromLlmsTxt", () => {
    it("should extract all native docs with their category", () => {
      const docs = parseAllDocsFromLlmsTxt(LLMS_TXT);

      expect(docs).toEqual([
        {
          title: "Button",
          url: "/docs/native/components/button",
          description: "A pressable button component",
          category: "Components",
        },
        {
          title: "Menu",
          url: "/docs/native/components/menu",
          description: "A floating context menu",
          category: "Components",
        },
        {
          title: "v1.0.9",
          url: "/docs/native/releases/v1-0-9",
          description: "Patch release",
          category: "Releases",
        },
      ]);
    });
  });
});
