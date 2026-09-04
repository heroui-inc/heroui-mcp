/**
 * Unit Tests for llms.txt Parser
 */

import {describe, expect, it} from "vitest";

import {parseAllDocsFromLlmsTxt, parseLlmsTxt} from "./llms-parser";

const LLMS_TXT = `# HeroUI v3 React Documentation

## Documentation Index

### Components

- [Button](https://heroui.com/en/docs/react/components/button): A clickable button component
- [Card](https://heroui.com/en/docs/react/components/card): A container component

### Releases

- [v3.2.4](https://heroui.com/en/docs/react/releases/v3-2-4): Patch release

### Chinese

- [Button 按钮](https://heroui.com/cn/docs/react/components/button): 可点击的按钮组件

### Native

- [Menu](https://heroui.com/en/docs/native/components/menu): A floating context menu
`;

describe("llms.txt parser", () => {
  describe("parseLlmsTxt", () => {
    it("should extract components from locale-prefixed URLs", () => {
      const components = parseLlmsTxt(LLMS_TXT);

      expect(components.map((component) => component.url)).toEqual([
        "/docs/react/components/button",
        "/docs/react/components/card",
      ]);
    });

    it("should skip non-default locales so translations are not duplicated", () => {
      const components = parseLlmsTxt(LLMS_TXT);

      expect(components).toHaveLength(2);
      expect(components.every((component) => !component.title.includes("按钮"))).toBe(true);
    });

    it("should still support legacy www URLs without a locale prefix", () => {
      const components = parseLlmsTxt(
        "- [Button](https://www.heroui.com/docs/react/components/button): A clickable button",
      );

      expect(components).toEqual([
        {
          title: "Button",
          url: "/docs/react/components/button",
          description: "A clickable button",
          category: undefined,
        },
      ]);
    });

    it("should exclude native components", () => {
      const components = parseLlmsTxt(LLMS_TXT);

      expect(components.every((component) => !component.url.includes("/native/"))).toBe(true);
    });
  });

  describe("parseAllDocsFromLlmsTxt", () => {
    it("should extract all react docs with their category", () => {
      const docs = parseAllDocsFromLlmsTxt(LLMS_TXT);

      expect(docs).toEqual([
        {
          title: "Button",
          url: "/docs/react/components/button",
          description: "A clickable button component",
          category: "Components",
        },
        {
          title: "Card",
          url: "/docs/react/components/card",
          description: "A container component",
          category: "Components",
        },
        {
          title: "v3.2.4",
          url: "/docs/react/releases/v3-2-4",
          description: "Patch release",
          category: "Releases",
        },
      ]);
    });
  });
});
