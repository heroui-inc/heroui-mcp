/**
 * Simple GitHub API client for fetching repository content
 * No caching - direct API calls only
 */

export interface GitHubFile {
  name: string;
  path: string;
  type: "file" | "dir";
}

export interface GitHubClient {
  fetchFile(owner: string, repo: string, path: string, ref: string): Promise<string>;
  getPackageVersion(owner: string, repo: string, packagePath: string, ref: string): Promise<string>;
  listFiles(owner: string, repo: string, dirPath: string, ref: string): Promise<GitHubFile[]>;
  getComponentFiles(
    owner: string,
    repo: string,
    componentsPath: string,
    ref: string,
  ): Promise<string[]>;
}

export class SimpleGitHubClient implements GitHubClient {
  private token?: string;

  constructor(token?: string) {
    this.token = token;
  }

  async fetchFile(owner: string, repo: string, path: string, ref: string): Promise<string> {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${ref}`;
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "heroui-native-mcp-extractor",
    };

    if (this.token) {
      headers["Authorization"] = `token ${this.token}`;
    }

    const response = await fetch(url, {headers});

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText} for ${path}`);
    }

    const data = (await response.json()) as {
      name: string;
      path: string;
      type: "file" | "dir";
      content: string;
    };

    if (data.type !== "file") {
      throw new Error(`Expected file but got ${data.type} for ${path}`);
    }

    return Buffer.from(data.content, "base64").toString("utf-8");
  }

  async getPackageVersion(
    owner: string,
    repo: string,
    packagePath: string,
    ref: string,
  ): Promise<string> {
    try {
      const packageJson = await this.fetchFile(owner, repo, `${packagePath}/package.json`, ref);
      const parsed = JSON.parse(packageJson);

      return parsed.version;
    } catch (error) {
      throw new Error(`Failed to get package version: ${error}`);
    }
  }

  async listFiles(
    owner: string,
    repo: string,
    dirPath: string,
    ref: string,
  ): Promise<GitHubFile[]> {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${dirPath}?ref=${ref}`;
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "heroui-native-mcp-extractor",
    };

    if (this.token) {
      headers["Authorization"] = `token ${this.token}`;
    }

    const response = await fetch(url, {headers});

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText} for ${dirPath}`);
    }

    const data = (await response.json()) as {name: string; path: string; type: "file" | "dir"}[];

    if (!Array.isArray(data)) {
      throw new Error(`Expected directory listing but got: ${typeof data}`);
    }

    return data.map((item) => ({
      name: item.name,
      path: item.path,
      type: item.type === "file" ? "file" : "dir",
    }));
  }

  /**
   * Get all component markdown files from the components directory
   */
  async getComponentFiles(
    owner: string,
    repo: string,
    componentsPath: string,
    ref: string,
  ): Promise<string[]> {
    const componentFiles: string[] = [];

    try {
      // List all directories in the components path
      const items = await this.listFiles(owner, repo, componentsPath, ref);

      for (const item of items) {
        if (item.type === "dir") {
          // Look for a markdown file with the same name as the directory
          const mdFile = `${item.path}/${item.name}.md`;

          try {
            // Try to fetch the file to verify it exists
            await this.fetchFile(owner, repo, mdFile, ref);
            componentFiles.push(mdFile);
            console.log(`   Found component doc: ${item.name}/${item.name}.md`);
          } catch (error) {
            // File doesn't exist, skip
            console.log(`   No doc file for: ${item.name}`);
          }
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not process components directory ${componentsPath}: ${error}`);
    }

    return componentFiles;
  }
}
