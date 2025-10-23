// Component Data Types (shared across services and lib)
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

interface ComponentSourceLinks {
  source?: string;
  styles?: string;
  [key: string]: string | undefined | boolean;
}

export interface ComponentData {
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

export interface ComponentDataset {
  [componentName: string]: ComponentData;
}

export interface VersionInfo {
  current: string;
  lastExtracted: string;
  extractDuration: number;
}
