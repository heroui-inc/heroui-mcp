/**
 * Theme System Types
 */

export interface CSSVariable {
  name: string; // Variable name (e.g., "--accent")
  value: string; // Variable value (e.g., "oklch(0.7 0.25 260)")
  description?: string; // Human-readable description
  category?: string; // Category (colors, spacing, etc.)
  computed?: boolean; // Whether it's a calculated variable
}

export interface ThemeVariables {
  base: CSSVariable[]; // Base variables (--white, --black, spacing, typography)
  semantic: CSSVariable[]; // Semantic variables (--accent, --success, etc.)
  calculated: CSSVariable[]; // Calculated variables (hover states, sizes)
}

export interface ThemeDefinition {
  name: string; // Theme name (e.g., "default", "glass")
  light: ThemeVariables; // Light mode variables
  dark: ThemeVariables; // Dark mode variables
  components?: string; // Optional component-specific CSS overrides
}

// Optimized theme structure that extracts common variables
export interface OptimizedThemeDefinition {
  name: string; // Theme name (e.g., "default", "glass")
  common: {
    base: CSSVariable[]; // Base variables shared between modes
    calculated: CSSVariable[]; // Calculated variables shared between modes
  };
  light: {
    semantic: CSSVariable[]; // Light mode specific semantic variables
  };
  dark: {
    semantic: CSSVariable[]; // Dark mode specific semantic variables
  };
  components?: string; // Optional component-specific CSS overrides
}

export interface AnimationTiming {
  name: string; // e.g., "--ease-in-quad"
  value: string; // e.g., "cubic-bezier(0.55, 0.085, 0.68, 0.53)"
  description?: string;
}

export interface AnimationPreset {
  name: string; // e.g., "--animate-spin-fast"
  value: string; // e.g., "spin 0.75s linear infinite"
  description?: string;
}

export interface GuideContent {
  title: string;
  description: string;
  content: string; // Markdown content
  examples?: CodeExample[];
}

export interface CodeExample {
  title: string;
  language: string;
  code: string;
}

export interface ThemeSystem {
  version: string;
  themes: {
    [themeName: string]: ThemeDefinition;
  };
  sharedVariables: CSSVariable[]; // Variables from shared/theme.css
  animations: {
    timings: AnimationTiming[];
    presets: AnimationPreset[];
  };
  guides: {
    theming?: GuideContent;
    colors?: GuideContent;
    styling?: GuideContent;
    animation?: GuideContent;
    composition?: GuideContent;
    designPrinciples?: GuideContent;
    quickStart?: GuideContent;
  };
}

export interface ThemeGenerationOptions {
  name: string;
  baseTheme: "default" | "glass"; // Base theme to extend from
  mode: "light" | "dark" | "both";
  colors?: {
    accent?: string;
    success?: string;
    warning?: string;
    danger?: string;
    background?: string;
    foreground?: string;
    [key: string]: string | undefined;
  };
  radius?: string;
  fontFamily?: string;
}
