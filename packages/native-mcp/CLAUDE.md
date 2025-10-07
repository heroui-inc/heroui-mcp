# HeroUI Native MCP - R2 Storage Structure

## Overview

The HeroUI Native MCP server stores extracted component and theme data in Cloudflare R2 (S3-compatible object storage). This document explains the folder structure and data organization.

## R2 Bucket Structure

```
native/
├── components/          # Version-specific component data
│   ├── 1.0.0.json      # Component data for v1.0.0
│   ├── 1.0.1.json      # Component data for v1.0.1
│   └── ...
├── theme/              # Version-specific theme data
│   ├── 1.0.0.json      # Theme data for v1.0.0
│   ├── 1.0.1.json      # Theme data for v1.0.1
│   └── ...
├── latest/             # Latest version shortcuts
│   ├── components.json # Always points to latest component data
│   └── theme.json      # Always points to latest theme data
└── versions.json       # Version metadata and history
```

## File Descriptions

### Version-Specific Data

**`native/components/{version}.json`**
- Complete component data for a specific version
- Includes: component info, props, examples, anatomy, source code
- Used by API endpoints to serve version-specific component documentation

**`native/theme/{version}.json`**
- Complete theme data for a specific version
- Includes: theme tokens, design variables, color palettes, typography
- Used by API endpoints to serve version-specific theme configuration

### Latest Version Shortcuts

**`native/latest/components.json`**
- Always contains the most recent component data
- Updated whenever a new version is uploaded
- Provides fast access without version lookup

**`native/latest/theme.json`**
- Always contains the most recent theme data
- Updated whenever a new version is uploaded
- Provides fast access without version lookup

### Version Metadata

**`native/versions.json`**
- Central registry of all available versions
- Contains version history and metadata
- Used for version validation and listing

## How Data is Uploaded

The R2Uploader class (in `lib/r2-uploader.ts`) handles all uploads:

1. **Component Data**: `uploadComponentData(version, data)` → `native/components/{version}.json`
2. **Theme Data**: `uploadThemeData(version, data)` → `native/theme/{version}.json`
3. **Latest Version**: `uploadLatestVersion(type, data)` → `native/latest/{type}.json`
4. **Metadata**: `updateVersionMetadata(metadata)` → `native/versions.json`

## API Access Patterns

The MCP API routes fetch data from R2:

- **Get specific version**: Read `native/components/{version}.json`
- **Get latest version**: Read `native/latest/components.json`
- **List versions**: List objects in `native/components/` or query `native/versions.json`
- **Check version exists**: Attempt to read `native/{type}/{version}.json`

## Key Features

- **Version Isolation**: Each version stored separately, no conflicts
- **Fast Latest Access**: `/latest/` shortcuts eliminate version lookup overhead
- **Immutable History**: Version files never overwritten, only appended
- **Simple Structure**: Flat hierarchy, easy to navigate and debug

## Data Structure

### Component Data Structure

Each component in `native/components/{version}.json` follows this structure:

```typescript
{
  "ComponentName": {
    name: string;              // Component name (e.g., "Button")
    description: string;        // Brief description of the component
    importStatement: string;    // Import statement (e.g., "import { Button } from 'heroui-native'")
    anatomy?: string;          // Component anatomy/structure example
    props: {                   // Component props
      [propName: string]: {
        name: string;          // Prop name
        type: string;          // TypeScript type (e.g., "string", "boolean", "() => void")
        description: string;   // Prop description
        default?: string;      // Default value (if any)
      }
    };
    subComponents?: {          // Sub-components (e.g., Button.Icon, Button.Text)
      [subName: string]: {
        name: string;          // Full sub-component name (e.g., "Button.Icon")
        props: {               // Sub-component props
          [propName: string]: {
            name: string;
            type: string;
            description: string;
            default?: string;
          }
        }
      }
    };
    examples?: [               // Code examples
      {
        name: string;          // Example name (e.g., "basic", "with-icon")
        code: string;          // TypeScript/TSX example code
      }
    ]
  }
}
```

### Example Component Entry

```json
{
  "Button": {
    "name": "Button",
    "description": "A pressable button component with various styles and states",
    "importStatement": "import { Button } from 'heroui-native';",
    "anatomy": "<Button>\n  <Button.Icon />\n  <Button.Text>Press me</Button.Text>\n</Button>",
    "props": {
      "onPress": {
        "name": "onPress",
        "type": "() => void",
        "description": "Called when the button is pressed"
      },
      "disabled": {
        "name": "disabled",
        "type": "boolean",
        "description": "Whether the button is disabled",
        "default": "false"
      }
    },
    "subComponents": {
      "Icon": {
        "name": "Button.Icon",
        "props": {
          "source": {
            "name": "source",
            "type": "ImageSourcePropType",
            "description": "Icon image source"
          }
        }
      }
    },
    "examples": [
      {
        "name": "basic",
        "code": "import { Button } from 'heroui-native';\n\nexport default () => (\n  <Button onPress={() => console.log('pressed')}>\n    <Button.Text>Click me</Button.Text>\n  </Button>\n);"
      }
    ]
  }
}
```

### Version Metadata Structure

The `native/versions.json` file contains:

```typescript
{
  current: string;          // Latest version (e.g., "v0.1.0-alpha.1")
  lastExtracted: string;    // ISO timestamp of last extraction
  extractDuration: number;  // Extraction duration in milliseconds
}
```

### Theme Data Structure

Theme data in `native/theme/{version}.json` contains design tokens, colors, spacing, typography, and other theme-related values specific to HeroUI Native.
