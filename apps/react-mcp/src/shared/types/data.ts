// Component Data Types (shared across services and lib)
interface ComponentSourceLinks {
  source?: string;
  styles?: string;
  [key: string]: string | undefined | boolean;
}

// V1 API - Minimal component data structure
export interface ComponentData {
  name: string;
  links?: ComponentSourceLinks;
}

export interface ComponentDataset {
  [componentName: string]: ComponentData;
}

// Legacy API - Full component data structure
export interface ComponentProp {
  name: string;
  type: string;
  description?: string;
  default?: unknown;
  required?: boolean;
}

interface ComponentExample {
  name: string;
  content: string;
}

interface CssClass {
  name: string;
  description: string;
}

export interface LegacyComponentData {
  name: string;
  description?: string;
  importStatement?: string;
  anatomy?: string;
  props: Record<string, ComponentProp>;
  subComponents?: Record<
    string,
    {
      name: string;
      props: Record<string, ComponentProp>;
    }
  >;
  examples?: ComponentExample[];
  cssClasses?: CssClass[];
  links?: ComponentSourceLinks;
}

export interface LegacyComponentDataset {
  [componentName: string]: LegacyComponentData;
}

export interface VersionInfo {
  current: string;
  lastExtracted: string;
  extractDuration: number;
}
