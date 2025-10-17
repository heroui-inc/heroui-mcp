export interface AnalyticsConfig {
  apiKey: string;
  host: string;
  environment: string;
  project: string;
}

export interface EventProperties {
  [key: string]:
    | string
    | number
    | boolean
    | undefined
    | null
    | EventProperties
    | EventProperties[]
    | unknown;
}
