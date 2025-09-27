#!/bin/bash

# Load development environment variables
if [ -f .dev.vars ]; then
    echo "Loading development environment variables..."
    set -a
    source .dev.vars
    set +a
else
    echo "Error: .dev.vars file not found"
    exit 1
fi

# Override bucket name for development
export R2_BUCKET_NAME="heroui-mcp-data-dev"

# Check if GitHub token is set to avoid rate limiting
if [ -z "$GITHUB_TOKEN" ]; then
    echo "⚠️  Warning: GITHUB_TOKEN not set. You may hit GitHub API rate limits."
    echo "   Consider adding GITHUB_TOKEN to your .dev.vars file."
    echo "   Create a token at: https://github.com/settings/tokens"
    echo ""
fi

echo "🚀 Extracting to development bucket: $R2_BUCKET_NAME"

# Run extraction based on argument
case "$1" in
    heroui)
        echo "Extracting HeroUI components..."
        npx tsx scripts/extract-heroui-r2.ts "${@:2}"
        ;;
    native)
        echo "Extracting HeroUI Native components..."
        npx tsx scripts/extract-native-r2.ts "${@:2}"
        ;;
    both|all)
        echo "Extracting both HeroUI and HeroUI Native components..."
        npx tsx scripts/extract-heroui-r2.ts "${@:2}"
        npx tsx scripts/extract-native-r2.ts "${@:2}"
        ;;
    *)
        echo "Usage: $0 {heroui|native|both} [--force] [--version=VERSION]"
        echo ""
        echo "Examples:"
        echo "  $0 heroui              # Extract HeroUI components"
        echo "  $0 native              # Extract HeroUI Native components"
        echo "  $0 both                # Extract both libraries"
        echo "  $0 heroui --force      # Force re-extraction"
        exit 1
        ;;
esac