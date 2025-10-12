#!/bin/bash

# Unified extraction script for all environments
# Usage: extract.sh [environment] [target] [options]
#   environment: dev | staging | production
#   target: components | theme | both
#   options: --force | --version=VERSION

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check for help flag
if [[ "$1" == "--help" ]] || [[ "$1" == "-h" ]]; then
    echo "Usage: $0 [environment] [target] [options]"
    echo ""
    echo "Arguments:"
    echo "  environment: dev | staging | production (default: dev)"
    echo "  target: components | theme | both (default: components)"
    echo "  options: --force | --version=VERSION"
    echo ""
    echo "Examples:"
    echo "  $0 dev components             # Extract components to dev bucket"
    echo "  $0 dev theme                  # Extract theme to dev bucket"
    echo "  $0 dev both                   # Extract both to dev bucket"
    echo "  $0 dev components --force     # Force re-extraction"
    echo ""
    echo "Required environment variables:"
    echo "  CLOUDFLARE_ACCOUNT_ID"
    echo "  R2_ACCESS_KEY_ID"
    echo "  R2_SECRET_ACCESS_KEY"
    exit 0
fi

# Parse arguments
ENVIRONMENT=${1:-dev}
TARGET=${2:-components}
shift 2 2>/dev/null || true
OPTIONS="$@"

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|production)$ ]]; then
    echo -e "${RED}Error: Invalid environment '$ENVIRONMENT'${NC}"
    echo "Usage: $0 [environment] [target] [options]"
    echo "  environment: dev | staging | production"
    echo "  target: components | theme | both"
    echo "  options: --force | --version=VERSION"
    exit 1
fi

# Validate target
if [[ ! "$TARGET" =~ ^(components|both|all|theme)$ ]]; then
    echo -e "${RED}Error: Invalid target '$TARGET'${NC}"
    echo "Valid targets: components | theme | both"
    exit 1
fi

echo -e "${GREEN}🚀 Starting extraction${NC}"
echo "Environment: $ENVIRONMENT"
echo "Target: $TARGET"
echo "Options: $OPTIONS"

# Set bucket name based on environment
case "$ENVIRONMENT" in
    dev)
        export R2_BUCKET_NAME="heroui-mcp-data-dev"
        # Load dev vars if available
        if [ -f .env ]; then
            echo "Loading development environment variables..."
            set -a
            source .env
            set +a
        fi
        ;;
    staging)
        export R2_BUCKET_NAME="heroui-mcp-data-staging"
        ;;
    production)
        export R2_BUCKET_NAME="heroui-mcp-data"
        ;;
esac

echo "Using R2 bucket: $R2_BUCKET_NAME"

# Check required environment variables
REQUIRED_VARS="CLOUDFLARE_ACCOUNT_ID R2_ACCESS_KEY_ID R2_SECRET_ACCESS_KEY"
MISSING_VARS=""

for var in $REQUIRED_VARS; do
    if [ -z "${!var}" ]; then
        MISSING_VARS="$MISSING_VARS $var"
    fi
done

if [ -n "$MISSING_VARS" ]; then
    echo -e "${RED}Error: Missing required environment variables:${NC}$MISSING_VARS"
    echo ""
    echo "For local development, create a .env file with:"
    for var in $REQUIRED_VARS; do
        echo "  $var=your_value"
    done
    exit 1
fi

# Check if GitHub token is set (optional but recommended)
if [ -z "$GITHUB_TOKEN" ]; then
    echo -e "${YELLOW}⚠️  Warning: GITHUB_TOKEN not set. You may hit GitHub API rate limits.${NC}"
    echo "   Consider adding GITHUB_TOKEN to your environment."
    echo ""
fi

# Parse options to properly handle version and force flags
FORCE_FLAG=""
VERSION_FLAG=""

for option in $OPTIONS; do
    case $option in
        --force)
            FORCE_FLAG="--force"
            ;;
        --version=*)
            # Extract version value and validate it's not a boolean
            VERSION_VALUE="${option#*=}"
            # Check if version is not "true" or "false" (common mistake from CI)
            if [[ "$VERSION_VALUE" != "true" && "$VERSION_VALUE" != "false" && -n "$VERSION_VALUE" ]]; then
                VERSION_FLAG="--version=$VERSION_VALUE"
            fi
            ;;
    esac
done

# Combine flags for extraction scripts
EXTRACT_FLAGS="$FORCE_FLAG $VERSION_FLAG"

# Execute extraction based on target
case "$TARGET" in
    components)
        echo -e "${GREEN}Extracting HeroUI components...${NC}"
        pnpm exec tsx scripts/extract-components.ts $EXTRACT_FLAGS
        ;;
    both|all)
        echo -e "${GREEN}Extracting both HeroUI components and theme...${NC}"
        pnpm exec tsx scripts/extract-components.ts $EXTRACT_FLAGS
        if [ $? -eq 0 ]; then
            pnpm exec tsx scripts/extract-theme.ts $EXTRACT_FLAGS
        else
            echo -e "${RED}Component extraction failed, skipping theme extraction${NC}"
            exit 1
        fi
        ;;
    theme)
        echo -e "${GREEN}Extracting HeroUI theme system...${NC}"
        pnpm exec tsx scripts/extract-theme.ts $EXTRACT_FLAGS
        ;;
esac

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Extraction completed successfully!${NC}"
else
    echo -e "${RED}❌ Extraction failed${NC}"
    exit 1
fi