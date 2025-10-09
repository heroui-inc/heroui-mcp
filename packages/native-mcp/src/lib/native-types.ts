/**
 * Type definitions for HeroUI Native MCP
 */

// Component Types
export interface PropDefinition {
  name: string;
  type: string;
  default?: string;
  description: string;
  required?: boolean;
}

export interface ComponentExample {
  name: string;
  code?: string;
  content?: string;
}

export interface SubComponent {
  name: string;
  description?: string;
  props?: Record<string, PropDefinition>;
}

export interface NativeComponentDefinition {
  name: string;
  description: string;
  importStatement?: string;
  anatomy?: string;
  props: Record<string, PropDefinition>;
  subComponents?: SubComponent[];
  examples?: ComponentExample[];
  links?: {
    source?: string;
    styles?: string;
  };
}

export type NativeComponentDataset = Record<string, NativeComponentDefinition>;

// Theme Types
export interface ColorToken {
  name: string;
  value: string; // HSL format: "211 100% 50%"
  category: "base" | "semantic" | "status" | "surface" | "utility";
}

export interface NativeTheme {
  name: string;
  light: {
    colors: ColorToken[];
  };
  dark: {
    colors: ColorToken[];
  };
  borderRadius: {
    DEFAULT: string;
    panel: string;
    "panel-inner": string;
  };
  opacity: {
    disabled: number;
  };
}

export interface NativeThemeSystem {
  version: string;
  themes: Record<string, NativeTheme>; // 'default', 'lavender-dream', etc.
}
