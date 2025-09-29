/**
 * Base GitHub extractor with version-based data organization
 */

import type {GitHubClient} from "./github-client";
import type {ComponentDataset} from "../src/types/data";

import {dataStore} from "./data-store";
import {SimpleGitHubClient} from "./github-client";

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

export interface ComponentExample {
  name: string;
  content: string;
}

export interface CssClass {
  name: string;
  description: string;
}

export interface ComponentSourceLinks {
  source?: string; // Path to the React/TS source file
  styles?: string; // Path to the CSS file
  [key: string]: string | undefined | boolean; // Allow any other source link
}

export interface ComponentDefinition {
  name: string;
  description: string;
  importStatement: string;
  anatomy?: string;
  props: Record<string, PropDefinition>;
  subComponents?: Record<
    string,
    {
      name: string;
      props: Record<string, PropDefinition>;
    }
  >;
  examples?: ComponentExample[];
  cssClasses?: CssClass[];
  links?: ComponentSourceLinks;
}

export interface ComponentParser {
  parseContent(
    content: string,
    filePath: string,
  ): ComponentDefinition | null | Promise<ComponentDefinition | null>;
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

  async extract(): Promise<{data: ComponentDataset; version: string}> {
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

      // 2. Log extraction details (no local output directory needed)
      console.log(`📁 Will upload to R2: ${this.config.outputLibraryName}/v${version}.json`);

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

      // Add delay between requests to avoid rate limiting
      const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
      const DELAY_MS = process.env.GITHUB_TOKEN ? 100 : 500; // Less delay with token

      for (const filePath of docFiles) {
        try {
          console.log(`   Processing ${filePath}...`);

          // Add delay to avoid rate limiting
          await delay(DELAY_MS);

          const content = await this.github.fetchFile(
            this.config.owner,
            this.config.repo,
            filePath,
            this.config.branch,
          );

          const component = await this.parser.parseContent(content, filePath);

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

      // 5. Skip local file saving - data will be saved to R2 only

      // 6. Save to R2 database (DataStore)
      const versionString = `v${version}`;

      await dataStore.saveVersion(
        this.config.outputLibraryName,
        versionString,
        components as ComponentDataset,
      );

      // Also save as 'latest'
      await dataStore.saveVersion(
        this.config.outputLibraryName,
        "latest",
        components as ComponentDataset,
      );

      // 7. Update version metadata in R2
      const duration = Date.now() - startTime;

      await this.updateVersionMetadataInR2(version, duration);

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
      console.log(`   - Output: R2 bucket (${this.config.outputLibraryName}/v${version})`);

      return {
        data: components as ComponentDataset,
        version,
      };
    } catch (error) {
      console.error(
        `❌ Extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  private async updateVersionMetadataInR2(version: string, duration: number): Promise<void> {
    // Get existing metadata from R2
    let metadata: VersionMetadata = {};

    try {
      const existingMetadata = await dataStore.getVersionInfo();
      metadata = existingMetadata;
    } catch {
      // No existing metadata, start fresh
    }

    // Update metadata for this library
    metadata[this.config.outputLibraryName] = {
      current: `v${version}`,
      extractDuration: duration,
      lastExtracted: new Date().toISOString(),
    };

    // Save updated metadata back to R2
    if (dataStore.saveVersionInfo) {
      await dataStore.saveVersionInfo(metadata);
    }
    console.log(`📝 Updated version metadata for ${this.config.outputLibraryName}: v${version}`);
  }
}
