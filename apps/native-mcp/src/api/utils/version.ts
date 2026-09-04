/**
 * Version comparison helpers for the MCP client version check
 */

const VERSION_PATTERN = /^v?(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/;

interface ParsedVersion {
  release: [number, number, number];
  isPrerelease: boolean;
}

function parseVersion(version: string): ParsedVersion | null {
  const match = version.trim().match(VERSION_PATTERN);

  if (!match) {
    return null;
  }

  const [, major, minor, patch, prerelease] = match;

  return {
    release: [Number(major), Number(minor), Number(patch)],
    isPrerelease: Boolean(prerelease),
  };
}

/**
 * Whether the client is running an older release than the server.
 *
 * Missing, unparsable and prerelease client versions count as up to date: a client
 * started from source reports a placeholder version instead of its package version,
 * and telling those users to update is advice they cannot act on.
 */
export function isClientOutdated(
  clientVersion: string | undefined,
  serverVersion: string,
): boolean {
  if (!clientVersion) {
    return false;
  }

  const client = parseVersion(clientVersion);
  const server = parseVersion(serverVersion);

  if (!client || !server || client.isPrerelease) {
    return false;
  }

  for (let i = 0; i < client.release.length; i++) {
    if (client.release[i] !== server.release[i]) {
      return client.release[i] < server.release[i];
    }
  }

  return false;
}
