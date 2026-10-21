# Dependency security mitigations

## braces 3.0.3

[GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)
has no patched npm release as of October 21, 2026. The local pnpm patch follows
the depth-limit mitigation described in the
[upstream report](https://github.com/micromatch/braces/issues/70):

- Reject strings with more than 100 nested brace or parenthesis groups before
  building an AST that could exhaust recursive walkers.
- Guard compile, expand, and stringify traversal when callers supply an AST
  directly, including cyclic child nodes.
- Reject excessive nesting with a deliberate `SyntaxError`, consistent with the
  parser's existing input-length validation. Callers processing untrusted patterns
  must still handle validation errors.

`pnpm install --frozen-lockfile` applies the checked-in patch.

Version-based scanners, including Dependabot and `pnpm audit`, will continue to
report this advisory because the package version remains 3.0.3. No advisory is
ignored or dismissed. Replace the patch with an upstream fixed release when one
becomes available.

## sprintf-js removal

[GHSA-hp3w-g68c-fv3c](https://github.com/advisories/GHSA-hp3w-g68c-fv3c)
also has no patched release. The `js-yaml@3>argparse` override selects argparse
2.0.1, which retains legacy v1 API support and does not depend on sprintf-js.
This preserves gray-matter's js-yaml 3 safe-loading API. A companion js-yaml patch
registers the CLI version flag explicitly because argparse 2's deprecated
constructor version option otherwise prints an empty string.

## Pinned transitive dependencies

Scoped overrides upgrade the MCP v2 client/server packages, their shared core,
sharp, and undici where parents pin vulnerable releases. Vite is declared as a
development dependency in each test workspace to resolve Vitest's auto-installed
peer to a patched version. Other compatible security updates live in the
lockfile. Remove overrides when parent dependencies require fixed versions.
