#!/usr/bin/env node

/**
 * File-based Data Store for NPM distribution
 * Simplified version without Cloudflare R2 dependencies
 */

import * as fs from "fs/promises";
import * as path from "path";
import {fileURLToPath} from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface ComponentProp {
  name: string;
  type: string;
  description?: string;
  default?: unknown;
  required?: boolean;
}

export interface ComponentData {
  name: string;
  description?: string;
  importStatement?: string;
  props: Record<string, ComponentProp>;
}

export interface DataStore {
  getComponentData(
    library: string,
    version?: string,
  ): Promise<Record<string, ComponentData> | null>;
  getComponentExample(library: string, component: string, version?: string): Promise<string | null>;
  getVersions(): Promise<Record<string, string[]> | null>;
}

class FileDataStore implements DataStore {
  private dataDir: string;

  constructor() {
    // Use the data directory relative to the package root
    this.dataDir = path.resolve(__dirname, "../../../data");
  }

  async getComponentData(
    library: string,
    version?: string,
  ): Promise<Record<string, ComponentData> | null> {
    try {
      const dataPath =
        version && version !== "latest"
          ? path.join(this.dataDir, version, library, "components.json")
          : path.join(this.dataDir, "latest", library, "components.json");

      const data = await fs.readFile(dataPath, "utf-8");

      return JSON.parse(data) as Record<string, ComponentData>;
    } catch (error) {
      console.error(`Error loading component data for ${library}:`, error);

      return null;
    }
  }

  async getComponentExample(
    library: string,
    component: string,
    version?: string,
  ): Promise<string | null> {
    try {
      const componentData = await this.getComponentData(library, version);

      if (!componentData || !componentData[component]) {
        return null;
      }

      const comp = componentData[component];
      const importStatement =
        comp.importStatement || `import {${component}} from "@heroui/${library}";`;

      // Generate a basic example
      const propsList = Object.entries(comp.props)
        .filter(([, prop]) => prop.required)
        .map(([name]) => `${name}="..."`);

      const example = `\`\`\`tsx\n${importStatement}\n\nexport default function Example() {\n  return (\n    <${component}${propsList.length ? ` ${propsList.join(" ")}` : ""}>\n      {/* Content */}\n    </${component}>\n  );\n}\n\`\`\``;

      return example;
    } catch (error) {
      console.error(`Error loading example for ${library}/${component}:`, error);

      return null;
    }
  }

  async getVersions(): Promise<Record<string, string[]> | null> {
    try {
      const versionsPath = path.join(this.dataDir, "versions.json");
      const data = await fs.readFile(versionsPath, "utf-8");

      return JSON.parse(data) as Record<string, string[]>;
    } catch (error) {
      console.error("Error loading versions:", error);

      return null;
    }
  }
}

export const dataStore = new FileDataStore();
