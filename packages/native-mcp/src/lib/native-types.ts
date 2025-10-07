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
  value: string;
  description?: string;
}

export interface TypographyToken {
  name: string;
  value: string | number;
  description?: string;
}

export interface SpacingToken {
  name: string;
  value: string | number;
  description?: string;
}

export interface NativeThemeDefinition {
  colors?: {
    semantic: ColorToken[];
    palette: ColorToken[];
    brand: ColorToken[];
  };
  typography?: {
    fonts: TypographyToken[];
    sizes: TypographyToken[];
    weights: TypographyToken[];
    lineHeights: TypographyToken[];
  };
  spacing?: {
    base: SpacingToken[];
    padding: SpacingToken[];
    margin: SpacingToken[];
    gap: SpacingToken[];
  };
  borders?: {
    radius: Array<{name: string; value: string}>;
    width: Array<{name: string; value: string}>;
  };
  shadows?: Array<{name: string; value: string}>;
  variables?: Record<string, string>; // Raw CSS variables
}
