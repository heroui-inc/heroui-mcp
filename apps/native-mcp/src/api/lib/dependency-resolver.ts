interface DependencyInfo {
  name: string;
  path: string;
  content: string;
}

/**
 * Extracts relative import paths from TypeScript/TSX file content
 */
function extractRelativeImports(content: string): string[] {
  const importRegex = /import\s+(?:{[^}]+}|\*\s+as\s+\w+|\w+)\s+from\s+['"](\.[^'"]+)['"]/g;
  const imports: string[] = [];
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }

  return imports;
}

/**
 * Resolves a relative import path to a GitHub URL path
 */
function resolveGitHubPath(fromPath: string, importPath: string): string {
  // Split paths into segments
  const fromSegments = fromPath.split("/").filter(Boolean);
  const importSegments = importPath.split("/").filter(Boolean);

  // Remove the file name from fromPath
  fromSegments.pop();

  // Process import path segments
  for (const segment of importSegments) {
    if (segment === "..") {
      fromSegments.pop();
    } else if (segment !== ".") {
      fromSegments.push(segment);
    }
  }

  return fromSegments.join("/");
}

/**
 * Tries to fetch a file from GitHub with various extension attempts
 */
async function fetchGitHubFile(
  baseUrl: string,
  filePath: string,
): Promise<{content: string; finalPath: string} | null> {
  // Try with .tsx first (most common for examples)
  const extensions = [".tsx", ".ts", ".jsx", ".js", "/index.tsx", "/index.ts"];

  for (const ext of extensions) {
    const testPath = filePath.endsWith(ext) ? filePath : filePath + ext;
    const url = `${baseUrl}/${testPath}`;

    try {
      const response = await fetch(url);

      if (response.ok) {
        const content = await response.text();

        return {content, finalPath: testPath};
      }
    } catch {
      continue;
    }
  }

  return null;
}

/**
 * Gets a human-readable component name from a file path
 */
function getComponentName(filePath: string): string {
  const segments = filePath.split("/");
  const fileName = segments[segments.length - 1];
  const basename = fileName.replace(/\.(tsx|ts|jsx|js)$/, "");

  // Convert kebab-case to PascalCase
  if (basename === "index") {
    // Use parent directory name
    return segments[segments.length - 2] || "Unknown";
  }

  return basename
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

/**
 * Simplifies a file path to just the filename with extension
 */
function simplifyPath(filePath: string): string {
  const segments = filePath.split("/");
  const fileName = segments[segments.length - 1];

  return `./${fileName}`;
}

/**
 * Simplifies relative import paths in content to just ./filename format
 */
function simplifyImportPaths(content: string): string {
  // Match import statements with relative paths
  const importRegex = /import\s+((?:{[^}]+}|\*\s+as\s+\w+|\w+))\s+from\s+['"](\.[^'"]+)['"]/g;

  return content.replace(importRegex, (match, importClause, importPath) => {
    // Extract just the filename from the path
    const segments = importPath.split("/").filter(Boolean);
    const lastSegment = segments[segments.length - 1];

    // Remove leading dots from segments
    const fileName = lastSegment.replace(/^\.+/, "");

    // Reconstruct import with simplified path
    return `import ${importClause} from './${fileName}'`;
  });
}

/**
 * Recursively collects all dependencies from a GitHub file
 */
async function collectDependenciesFromGitHub(
  baseUrl: string,
  filePath: string,
  baseDir: string,
  visited: Set<string> = new Set(),
): Promise<Map<string, DependencyInfo>> {
  const dependencies = new Map<string, DependencyInfo>();

  if (visited.has(filePath)) {
    return dependencies;
  }

  visited.add(filePath);

  // Fetch the file from GitHub
  const fileResult = await fetchGitHubFile(baseUrl, filePath);

  if (!fileResult) {
    return dependencies;
  }

  const {content} = fileResult;
  const relativeImports = extractRelativeImports(content);

  // Process each relative import
  for (const importPath of relativeImports) {
    const resolvedPath = resolveGitHubPath(filePath, importPath);

    // Skip if already processed
    if (visited.has(resolvedPath)) {
      continue;
    }

    // Only include files within the base directory
    if (!resolvedPath.startsWith(baseDir)) {
      continue;
    }

    // Fetch the dependency file
    const depResult = await fetchGitHubFile(baseUrl, resolvedPath);

    if (!depResult) {
      continue;
    }

    const componentName = getComponentName(depResult.finalPath);
    const simplifiedPath = simplifyPath(depResult.finalPath);
    const simplifiedContent = simplifyImportPaths(depResult.content);

    dependencies.set(resolvedPath, {
      name: componentName,
      path: simplifiedPath,
      content: simplifiedContent,
    });

    // Recursively collect dependencies from this file
    const nestedDeps = await collectDependenciesFromGitHub(
      baseUrl,
      depResult.finalPath,
      baseDir,
      visited,
    );

    nestedDeps.forEach((dep, depPath) => {
      if (!dependencies.has(depPath)) {
        dependencies.set(depPath, dep);
      }
    });
  }

  return dependencies;
}

/**
 * Collects dependencies for multiple example files from GitHub
 */
export async function collectExampleDependencies(
  exampleNames: string[],
  githubBaseUrl: string,
): Promise<DependencyInfo[]> {
  const allDependencies = new Map<string, DependencyInfo>();
  const visited = new Set<string>();
  const baseDir = "example/src";

  for (const exampleName of exampleNames) {
    const examplePath = `example/src/app/(home)/components/${exampleName}.tsx`;

    const deps = await collectDependenciesFromGitHub(githubBaseUrl, examplePath, baseDir, visited);

    deps.forEach((dep, depPath) => {
      if (!allDependencies.has(depPath)) {
        allDependencies.set(depPath, dep);
      }
    });
  }

  return Array.from(allDependencies.values()).sort((a, b) => a.name.localeCompare(b.name));
}
