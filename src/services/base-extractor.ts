/**
 * Base GitHub extractor with version-based data organization
 */

import type {ComponentDataset} from "./component-data-service.js";
import type {GitHubClient} from "./github-client.js";

import * as fs from "fs/promises";
import * as path from "path";

import {dataStore} from "./data-store.js";
import {SimpleGitHubClient} from "./github-client.js";

export interface ExtractionConfig {
  owner: string;
  repo: string;
  branch: string;
  docsPath: string;
  outputLibraryName: string;
}

export interface PropDefinition {
  name: string;
  type: string;
  default?: unknown;
  description: string;
}

export interface ComponentDefinition {
  name: string;
  description: string;
  importStatement: string;
  props: Record<string, PropDefinition>;
  subComponents?: Record<
    string,
    {
      name: string;
      props: Record<string, PropDefinition>;
    }
  >;
  examples?: string[];
}

export interface ComponentParser {
  parseContent(content: string, filePath: string): ComponentDefinition | null;
}

interface VersionMetadata {
  [libraryName: string]: {
    current: string;
    lastExtracted: string;
    extractDuration: number;
  };
}

export abstract class BaseGitHubExtractor {
  protected github: GitHubClient;
  protected config: ExtractionConfig;
  protected parser: ComponentParser;

  constructor(config: ExtractionConfig, parser: ComponentParser, token?: string) {
    this.config = config;
    this.parser = parser;
    this.github = new SimpleGitHubClient(token);
  }

  async extract(): Promise<void> {
    const startTime = Date.now();

    console.log(`🔍 Extracting ${this.config.outputLibraryName} from GitHub...`);
    console.log(`📍 Repository: ${this.config.owner}/${this.config.repo}@${this.config.branch}`);

    try {
      // 1. Get package.json version
      const version = await this.github.getPackageVersion(
        this.config.owner,
        this.config.repo,
        this.config.branch,
      );

      console.log(`📦 Found version: ${version}`);

      // 2. Setup output directory (simplified structure)
      const latestDir = path.join(process.cwd(), "data", "latest");

      await fs.mkdir(latestDir, {recursive: true});
      console.log(`📁 Output to: data/latest/${this.config.outputLibraryName}.json`);

      // 3. Get documentation files
      const docFiles = await this.github.getDocsFiles(
        this.config.owner,
        this.config.repo,
        this.config.docsPath,
        this.config.branch,
      );

      console.log(`📄 Found ${docFiles.length} documentation files`);

      // 4. Extract components
      const components: Record<string, ComponentDefinition> = {};

      for (const filePath of docFiles) {
        try {
          console.log(`   Processing ${filePath}...`);

          const content = await this.github.fetchFile(
            this.config.owner,
            this.config.repo,
            filePath,
            this.config.branch,
          );

          const component = this.parser.parseContent(content, filePath);

          if (component && Object.keys(component.props).length > 0) {
            components[component.name] = component;
            console.log(`      ✓ ${component.name} (${Object.keys(component.props).length} props)`);

            // Log sub-components if any
            if (component.subComponents) {
              for (const [subName, subComp] of Object.entries(component.subComponents)) {
                console.log(
                  `        ✓ ${component.name}.${subName} (${Object.keys(subComp.props).length} props)`,
                );
              }
            }
          } else {
            console.log("      ⚠️  (no props found)");
          }
        } catch (error) {
          console.log(
            `      ❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
        }
      }

      // 5. Save extracted data to new simplified structure
      const latestPath = path.join(
        process.cwd(),
        "data",
        "latest",
        `${this.config.outputLibraryName}.json`,
      );

      await fs.writeFile(latestPath, JSON.stringify(components, null, 2), "utf-8");

      // 6. Save to external database (DataStore)
      const versionString = `v${version}`;

      await dataStore.saveVersion(
        this.config.outputLibraryName,
        versionString,
        components as ComponentDataset,
      );

      // 7. Update version metadata
      const duration = Date.now() - startTime;

      await this.updateVersionMetadata(version, duration);

      const totalProps = Object.values(components).reduce((sum, comp) => {
        const mainProps = Object.keys(comp.props).length;
        const subProps = comp.subComponents
          ? Object.values(comp.subComponents).reduce(
              (s, sub) => s + Object.keys(sub.props).length,
              0,
            )
          : 0;

        return sum + mainProps + subProps;
      }, 0);

      console.log("\n✅ Extraction complete!");
      console.log(`📊 Statistics:`);
      console.log(`   - Components: ${Object.keys(components).length}`);
      console.log(`   - Total props: ${totalProps}`);
      console.log(`   - Processing time: ${(duration / 1000).toFixed(2)}s`);
      console.log(`   - Output: ${latestPath}`);
    } catch (error) {
      console.error(
        `❌ Extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  private async updateVersionMetadata(version: string, duration: number): Promise<void> {
    const metadataPath = path.join(process.cwd(), "data", "versions.json");
    let metadata: VersionMetadata = {};

    try {
      const existing = await fs.readFile(metadataPath, "utf-8");

      metadata = JSON.parse(existing);
    } catch {
      // File doesn't exist, start fresh
    }

    metadata[this.config.outputLibraryName] = {
      current: `v${version}`,
      extractDuration: duration,
      lastExtracted: new Date().toISOString(),
    };

    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), "utf-8");
  }
}
