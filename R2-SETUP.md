# R2 Storage Setup Guide

This guide explains how to set up and use Cloudflare R2 storage for the HeroUI MCP server.

## Architecture Overview

The HeroUI MCP server now uses Cloudflare R2 for scalable component data storage:

```mermaid
graph TB
    GA[GitHub Actions<br/>Extract Data]
    R2[R2 Bucket<br/>Component Storage]
    MCP[MCP Server<br/>Read Data]
    NPM[npm/GitHub<br/>Versions]
    CLIENTS[Claude/IDEs<br/>Consumers]

    NPM --> GA
    GA --> R2
    R2 --> MCP
    MCP --> CLIENTS

    style GA fill:#e1f5fe
    style R2 fill:#fff3e0
    style MCP fill:#f3e5f5
    style NPM fill:#e8f5e9
    style CLIENTS fill:#fce4ec
```

## R2 Bucket Structure

```
heroui-mcp-data/
├── latest/
│   ├── heroui.json              # Latest HeroUI version data
│   └── native.json              # Latest Native version data
├── heroui/
│   ├── v3.0.0-alpha.31.json     # Specific HeroUI version
│   ├── v3.0.0-alpha.30.json
│   └── ...
├── native/
│   ├── v1.0.0-alpha.13.json     # Specific Native version
│   ├── v1.0.0-alpha.12.json
│   └── ...
└── versions.json                # Version metadata at root
```

### Multiple Environments

The project uses three R2 buckets for different environments:

- **Development**: `heroui-mcp-data-dev` - For local development
- **Staging**: `heroui-mcp-data-staging` - Deployed from develop branch
- **Production**: `heroui-mcp-data` - Deployed from main branch

## Setup Instructions

### 1. Create R2 Buckets

✅ **Required buckets**:
- `heroui-mcp-data` - Production environment
- `heroui-mcp-data-staging` - Staging environment
- `heroui-mcp-data-dev` - Development environment

Create these in your Cloudflare dashboard under R2.

### 2. Configure GitHub Secrets

Add these secrets to your GitHub repository settings:

- `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID
- `R2_ACCESS_KEY_ID` - R2 API access key ID
- `R2_SECRET_ACCESS_KEY` - R2 API secret access key
- `GITHUB_TOKEN` - (Optional but recommended) For higher GitHub API rate limits

**Note**: The `R2_BUCKET_NAME` is automatically determined based on the branch:
- `main` branch → `heroui-mcp-data`
- `develop` branch → `heroui-mcp-data-staging`

To create R2 API tokens:
1. Go to Cloudflare Dashboard → R2 → Manage R2 API tokens
2. Create a token with permissions: **Object Read & Write**
3. Save the credentials securely

### 3. Local Development Setup

For local development, create a `.dev.vars` file:

```bash
# Copy the example file
cp .dev.vars.example .dev.vars

# Edit with your credentials
vim .dev.vars
```

Add your credentials:
```env
# R2 Configuration
CLOUDFLARE_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=heroui-mcp-data-dev

# GitHub Token (recommended to avoid rate limits)
GITHUB_TOKEN=your_github_token
```

### 4. Initial Data Population

#### For Development Environment
```bash
# Extract to development bucket
pnpm extract:all:dev

# Or extract individually
pnpm extract:dev:heroui
pnpm extract:dev:native
```

#### For Production/Staging
Data is automatically populated when code is pushed to the respective branches.

### 5. Verify GitHub Actions

The extraction pipeline runs automatically:
- **On push to `main`** - Deploys to production R2 bucket
- **On push to `develop`** - Deploys to staging R2 bucket
- **Daily at 2 AM UTC** - Checks for new versions
- **Manual trigger** - Via GitHub Actions UI

To manually trigger:
1. Go to Actions → Component Data Extraction Pipeline
2. Click "Run workflow"
3. Select options:
   - Library: `both`, `heroui`, or `native`
   - Force: Re-extract even if version exists
   - Version: Extract specific version

## Usage

### Manual Extraction

#### Development Environment
```bash
# Extract to dev bucket (uses .dev.vars)
pnpm extract:all:dev
pnpm extract:dev:heroui
pnpm extract:dev:native

# Force re-extraction
pnpm extract:dev:heroui -- --force
```

#### Direct R2 Upload
```bash
# Requires environment variables
export R2_BUCKET_NAME="heroui-mcp-data"
pnpm extract:heroui-r2
pnpm extract:native-r2

# With options
pnpm extract:heroui-r2 -- --force
pnpm extract:heroui-r2 -- --version=v3.0.0-alpha.30
```

### Monitoring

Check extraction status in GitHub Actions:
- ✅ Green check: Successfully extracted and uploaded
- ℹ️ Info: No update needed (version already exists)
- ❌ Red X: Extraction failed

### Troubleshooting

#### Missing R2 Credentials
```
❌ Missing required R2 credentials in environment variables
   Required: CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY
```
**Solution**: Ensure all GitHub secrets are properly configured.

#### Version Already Exists
```
ℹ️  Version v3.0.0-alpha.31 already exists in R2. Use --force to overwrite.
```
**Solution**: Use `--force` flag if you need to re-extract.

#### GitHub API Rate Limit
```
❌ GitHub API error: 403 rate limit exceeded
```
**Solution**:
1. Add `GITHUB_TOKEN` to your `.dev.vars` file (for local dev)
2. Add `GITHUB_TOKEN` to GitHub secrets (for CI/CD)
3. The extraction scripts include automatic rate limiting:
   - With token: 100ms delay between requests
   - Without token: 500ms delay between requests

## Benefits of R2 Storage

1. **Scalability**: No repository size limits
2. **Performance**: CDN-backed global distribution
3. **Versioning**: Keep all historical versions
4. **Cost-effective**: Pay only for storage used
5. **Reliability**: Cloudflare's infrastructure
6. **Automation**: GitHub Actions integration

## Data Flow

1. **Version Detection**
   - GitHub Actions checks for new versions from:
     - HeroUI: `packages/react/package.json` on v3 branch
     - Native: `package.json` on alpha branch
   - Compares with stored versions in R2

2. **Data Extraction**
   - Fetches documentation from GitHub
   - Parses component props and examples
   - Validates extracted data

3. **R2 Upload**
   - Uploads versioned data to `{library}/{version}.json`
   - Updates latest data in `latest/{library}.json`
   - Updates metadata in `versions.json`

4. **MCP Server Access**
   - Production: Reads from `heroui-mcp-data` bucket
   - Staging: Reads from `heroui-mcp-data-staging` bucket
   - Development: Reads from `heroui-mcp-data-dev` bucket
   - Falls back to bundled data if R2 unavailable
   - 5-minute cache for performance

## Development

### Local Testing with R2

```bash
# Start dev server with R2 bindings
pnpm dev

# Test R2 connection
curl http://localhost:8787/ -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'
```

### Using Wrangler for R2

```bash
# List R2 buckets
npx wrangler r2 bucket list

# List objects in bucket
npx wrangler r2 object list --bucket=heroui-mcp-data

# Download object
npx wrangler r2 object get metadata/versions.json \
  --bucket=heroui-mcp-data --file=versions.json
```

## Migration from Local Data

The system maintains backward compatibility:
- NPM package still includes `/data` folder as fallback
- Server uses R2 when available, falls back to bundled data
- Gradual migration path for existing users

## Security

- R2 bucket is private (no public access)
- API tokens have minimal required permissions
- GitHub secrets are encrypted
- Worker has read-only access to R2

## Future Enhancements

- [ ] Webhook triggers for instant updates
- [ ] Differential updates (only changed components)
- [ ] Compression for large datasets
- [ ] Multi-region replication
- [ ] Usage analytics and metrics