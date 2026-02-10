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
  getPackageVersion(owner: string, repo: string, ref: string): Promise<string>;
  listFiles(owner: string, repo: string, dirPath: string, ref: string): Promise<GitHubFile[]>;
  getDocsFiles(owner: string, repo: string, docsPath: string, ref: string): Promise<string[]>;
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
      "User-Agent": "heroui-mcp-extractor",
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

  async getPackageVersion(owner: string, repo: string, ref: string): Promise<string> {
    try {
      const packageJson = await this.fetchFile(owner, repo, "package.json", ref);
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
      "User-Agent": "heroui-mcp-extractor",
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
   * Get all markdown/mdx files recursively from a directory
   */
  async getDocsFiles(
    owner: string,
    repo: string,
    docsPath: string,
    ref: string,
  ): Promise<string[]> {
    const files: string[] = [];

    const processDirectory = async (path: string): Promise<void> => {
      try {
        const items = await this.listFiles(owner, repo, path, ref);

        for (const item of items) {
          if (
            item.type === "file" &&
            (item.name.endsWith(".md") || item.name.endsWith(".mdx")) &&
            item.name !== "index.mdx" &&
            item.name !== "index.md"
          ) {
            files.push(item.path);
          } else if (item.type === "dir") {
            await processDirectory(item.path);
          }
        }
      } catch (error) {
        console.warn(`Warning: Could not process directory ${path}: ${error}`);
      }
    };

    await processDirectory(docsPath);

    return files;
  }
}
