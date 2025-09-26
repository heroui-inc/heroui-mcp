// Type definitions
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

export interface ComponentDataset {
  [componentName: string]: ComponentData;
}

export interface VersionInfo {
  current: string;
  lastExtracted: string;
  extractDuration: number;
}

// Use file-based data store for npm distribution
import {dataStore} from "./data-store-file.js";

// Component Data Service Class
class ComponentDataService {
  /**
   * List all available components for a library
   */
  async listComponents(library: string, version?: string): Promise<string[]> {
    try {
      const data = await dataStore.getComponentData(library, version);

      if (!data) {
        throw new Error(`No data found for ${library}`);
      }

      return Object.keys(data).sort();
    } catch (error) {
      console.error(`Error listing components for ${library}:`, error);
      throw error;
    }
  }

  /**
   * Get detailed component information
   */
  async getComponent(library: string, component: string, version?: string): Promise<ComponentData> {
    try {
      const data = await dataStore.getComponentData(library, version);

      if (!data) {
        throw new Error(`No data found for ${library}`);
      }

      const componentData = data[component];

      if (!componentData) {
        throw new Error(`Component ${component} not found in ${library}`);
      }

      return componentData;
    } catch (error) {
      console.error(`Error getting component ${library}/${component}:`, error);
      throw error;
    }
  }

  /**
   * Get component usage example
   */
  async getComponentExample(library: string, component: string, version?: string): Promise<string> {
    try {
      const example = await dataStore.getComponentExample(library, component, version);

      if (!example) {
        // Fallback: generate basic example from component data
        const componentData = await this.getComponent(library, component, version);
        return this.generateBasicExample(componentData, library);
      }

      return example;
    } catch (error) {
      console.error(`Error getting example for ${library}/${component}:`, error);
      throw error;
    }
  }

  /**
   * Generate a basic example from component data
   */
  private generateBasicExample(component: ComponentData, library: string): string {
    const importStatement = component.importStatement ||
      `import {${component.name}} from "@heroui/${library === 'native' ? 'native' : 'react'}";`;

    const requiredProps = Object.entries(component.props)
      .filter(([, prop]) => prop.required)
      .map(([name, prop]) => {
        if (prop.type === 'string') return `${name}="example"`;
        if (prop.type === 'number') return `${name}={42}`;
        if (prop.type === 'boolean') return `${name}`;
        return `${name}={/* ${prop.type} */}`;
      });

    return `\`\`\`tsx
${importStatement}

export default function Example() {
  return (
    <${component.name}${requiredProps.length ? `\n      ${requiredProps.join('\n      ')}` : ''}>
      {/* Content */}
    </${component.name}>
  );
}
\`\`\``;
  }

  /**
   * Get available versions for libraries
   */
  async getVersions(): Promise<Record<string, string[]>> {
    try {
      const versions = await dataStore.getVersions();
      return versions || {};
    } catch (error) {
      console.error("Error getting versions:", error);
      return {};
    }
  }
}

// Export singleton instance
export const componentDataService = new ComponentDataService();