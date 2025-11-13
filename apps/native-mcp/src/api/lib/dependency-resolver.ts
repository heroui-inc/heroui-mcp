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
 * Optimized to try extensions in parallel and with timeout
 */
async function fetchGitHubFile(
  baseUrl: string,
  filePath: string,
  timeoutMs: number = 5000,
): Promise<{content: string; finalPath: string} | null> {
  // Try with .tsx first (most common for examples)
  // Reduced extensions to most common ones to minimize requests
  const extensions = [".tsx", ".ts", "/index.tsx"];

  // Try extensions in parallel for faster resolution
  // Return as soon as we find a successful fetch
  const fetchPromises = extensions.map(
    async (ext): Promise<{content: string; finalPath: string} | null> => {
      const testPath = filePath.endsWith(ext) ? filePath : filePath + ext;
      const url = `${baseUrl}/${testPath}`;

      try {
        // Create a timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("Timeout")), timeoutMs);
        });

        const fetchPromise = fetch(url).then(async (response) => {
          if (response.ok) {
            const content = await response.text();

            return {content, finalPath: testPath};
          }

          throw new Error("Not found");
        });

        return await Promise.race([fetchPromise, timeoutPromise]);
      } catch {
        // Ignore errors (timeout or fetch failure) and continue
        return null;
      }
    },
  );

  // Return the first successful result
  // Use a race that resolves when any promise succeeds
  const results = await Promise.allSettled(fetchPromises);

  // Return first successful result
  for (const result of results) {
    if (result.status === "fulfilled" && result.value) {
      return result.value;
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
 * Optimized to fetch dependencies in parallel
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

  // Filter and resolve import paths first
  const dependencyPaths = relativeImports
    .map((importPath) => resolveGitHubPath(filePath, importPath))
    .filter((resolvedPath) => {
      // Skip if already processed
      if (visited.has(resolvedPath)) {
        return false;
      }

      // Only include files within the base directory
      return resolvedPath.startsWith(baseDir);
    });

  // Fetch all dependencies in parallel
  const dependencyResults = await Promise.allSettled(
    dependencyPaths.map(async (resolvedPath) => {
      const depResult = await fetchGitHubFile(baseUrl, resolvedPath);

      if (!depResult) {
        return null;
      }

      const componentName = getComponentName(depResult.finalPath);
      const simplifiedPath = simplifyPath(depResult.finalPath);
      const simplifiedContent = simplifyImportPaths(depResult.content);

      return {
        path: resolvedPath,
        dep: {
          name: componentName,
          path: simplifiedPath,
          content: simplifiedContent,
        },
        finalPath: depResult.finalPath,
      };
    }),
  );

  // Process successful fetches and collect nested dependencies in parallel
  const nestedDepPromises: Promise<Map<string, DependencyInfo>>[] = [];

  for (const result of dependencyResults) {
    if (result.status === "fulfilled" && result.value) {
      const {path, dep, finalPath} = result.value;

      dependencies.set(path, dep);

      // Collect nested dependencies (will be processed in parallel)
      nestedDepPromises.push(collectDependenciesFromGitHub(baseUrl, finalPath, baseDir, visited));
    }
  }

  // Wait for all nested dependencies to be collected
  const nestedDepsResults = await Promise.allSettled(nestedDepPromises);

  for (const result of nestedDepsResults) {
    if (result.status === "fulfilled") {
      result.value.forEach((dep, depPath) => {
        if (!dependencies.has(depPath)) {
          dependencies.set(depPath, dep);
        }
      });
    }
  }

  return dependencies;
}

/**
 * Collects dependencies for multiple example files from GitHub
 * Optimized to process examples in parallel
 */
export async function collectExampleDependencies(
  exampleNames: string[],
  githubBaseUrl: string,
): Promise<DependencyInfo[]> {
  const allDependencies = new Map<string, DependencyInfo>();
  const visited = new Set<string>();
  const baseDir = "example/src";

  // Process all examples in parallel
  const examplePaths = exampleNames.map(
    (exampleName) => `example/src/app/(home)/components/${exampleName}.tsx`,
  );

  const dependencyMaps = await Promise.allSettled(
    examplePaths.map((examplePath) =>
      collectDependenciesFromGitHub(githubBaseUrl, examplePath, baseDir, visited),
    ),
  );

  // Merge all dependencies
  for (const result of dependencyMaps) {
    if (result.status === "fulfilled") {
      result.value.forEach((dep, depPath) => {
        if (!allDependencies.has(depPath)) {
          allDependencies.set(depPath, dep);
        }
      });
    }
  }

  return Array.from(allDependencies.values()).sort((a, b) => a.name.localeCompare(b.name));
}
