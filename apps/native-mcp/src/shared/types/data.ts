// Component Data Types (shared across services and lib)
interface ComponentSourceLinks {
  source?: string;
  styles?: string;
  [key: string]: string | undefined | boolean;
}

export interface ComponentData {
  name: string;
  links?: ComponentSourceLinks;
}

export interface ComponentDataset {
  [componentName: string]: ComponentData;
}
