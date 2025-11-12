export interface ColorToken {
  name: string;
  value: string; // HSL format: "211 100% 50%"
  category: "base" | "semantic" | "status" | "surface" | "utility";
}

export interface Theme {
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

export interface ThemeSystem {
  version: string;
  themes: Record<string, Theme>; // Only 'default' theme is supported
}
