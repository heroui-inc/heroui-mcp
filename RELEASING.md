# Releasing HeroUI MCP

This document describes the release process for the HeroUI MCP server package.

## Prerequisites

Before releasing, ensure you have:

1. **npm account** with publish permissions for `@heroui/mcp`
2. **Git push permissions** to the main repository
3. **Clean working directory** (all changes committed)
4. **Updated component data** (if needed):
   ```bash
   pnpm extract:heroui
   pnpm extract:native
   ```

## Release Process

### 1. Prepare for Release

First, ensure your local repository is up to date:

```bash
git checkout main
git pull origin main
```

Make sure all tests pass:

```bash
pnpm typecheck
pnpm lint
pnpm build
```

### 2. Create a New Release

Run the release command:

```bash
pnpm release
```

This command will:
1. Prompt you to select the version bump type (patch/minor/major)
2. Update the version in `package.json`
3. Commit the changes with message `chore(release): v{version}`
4. Create a git tag `v{version}`
5. Push the commit and tag to GitHub

### 3. Publish to npm

After the release is tagged, publish to npm:

```bash
npm publish --access public
```

> Note: The `prepublishOnly` script will automatically build the package before publishing.

### 4. Create GitHub Release

1. Go to [GitHub Releases](https://github.com/your-org/heroui-mcp/releases)
2. Click "Create a new release"
3. Select the tag you just created
4. Add release notes describing:
   - New features
   - Bug fixes
   - Breaking changes (if any)
   - Component data updates
5. Click "Publish release"

## Version Guidelines

### Patch Release (0.0.x)

Use for:
- Bug fixes
- Minor documentation updates
- Component data updates (same schema)
- Dependency updates (non-breaking)

### Minor Release (0.x.0)

Use for:
- New features (backward compatible)
- New tools added to MCP server
- Performance improvements
- Component data schema improvements (backward compatible)

### Major Release (x.0.0)

Use for:
- Breaking changes in API
- Tool parameter changes
- Removal of tools
- Major architecture changes
- Component data schema breaking changes

## Release Checklist

Before releasing, verify:

- [ ] All tests pass (`pnpm typecheck && pnpm lint`)
- [ ] Build succeeds (`pnpm build`)
- [ ] Component data is up to date
- [ ] Documentation is updated
- [ ] CONTRIBUTING.md reflects any process changes
- [ ] No uncommitted changes in working directory
- [ ] You're on the `main` branch
- [ ] You've pulled the latest changes

## Troubleshooting

### Release Command Fails

If the release command fails:

1. Check if you have uncommitted changes:
   ```bash
   git status
   ```

2. Ensure you're on the main branch:
   ```bash
   git checkout main
   ```

3. Make sure you have the latest changes:
   ```bash
   git pull origin main
   ```

### npm Publish Fails

If npm publish fails:

1. Check if you're logged in:
   ```bash
   npm whoami
   ```

2. Login if needed:
   ```bash
   npm login
   ```

3. Verify the package name is correct in `package.json`

4. Check if the version already exists:
   ```bash
   npm view @heroui/mcp versions
   ```

### Build Fails

If the build fails during release:

1. Clean the build directory:
   ```bash
   pnpm clean
   ```

2. Reinstall dependencies:
   ```bash
   rm -rf node_modules pnpm-lock.yaml
   pnpm install
   ```

3. Try building manually:
   ```bash
   pnpm build
   ```

## Post-Release

After a successful release:

1. **Update dependent projects** that use the MCP server
2. **Announce the release** in relevant channels
3. **Monitor issues** for any problems with the new release
4. **Update HeroUI documentation** if there are significant changes

## Emergency Rollback

If a critical issue is found after release:

1. **Deprecate the broken version**:
   ```bash
   npm deprecate @heroui/mcp@{version} "Critical issue found, please use previous version"
   ```

2. **Create a patch release** with the fix

3. **Document the issue** in the release notes

## Automated CI/CD (Future)

In the future, we plan to automate releases using GitHub Actions:

- Automatic version bumping on merge to main
- Automated npm publishing on tag creation
- Automatic GitHub Release creation
- Changelog generation from commit messages

Until then, follow the manual process described above.