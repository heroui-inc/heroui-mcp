# HeroUI React MCP API Documentation

This document provides detailed information about the HeroUI React MCP REST API endpoints.

## Quick Reference

### Available Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | API information and endpoint list |
| `/health` | GET | Health check |
| `/components` | GET | List all HeroUI components |
| `/components/:component` | GET | Get component details |
| `/components/:component/props` | GET | Get component props documentation |
| `/components/:component/examples` | GET | Get component usage examples |
| `/components/:component/source` | GET | Get component source code |
| `/components/:component/styles` | GET | Get component CSS styles |
| `/themes` | GET | Get complete theme system |
| `/themes/variables` | GET | Get theme CSS variables |
| `/themes/colors` | GET | Get theme color variables |
| `/themes/animations` | GET | Get animation definitions |
| `/themes/versions` | GET | Get available theme versions |
| `/docs/available` | GET | Get all available documentation paths |
| `/docs/content` | GET | Get documentation content from a specific path |
| `/versions` | GET | Get all version information |
| `/versions/:package` | GET | Check specific package version |

## Base URL

- **Production**: `https://mcp-api.heroui.com`
- **Staging**: `https://staging-mcp-api.heroui.com`
- **Development**: `http://localhost:8787`

## Authentication

The API is public and does not require authentication.

## Endpoints

### Core Information

#### `GET /`

Returns API information and available endpoints.

**Response:**

```json
{
  "name": "HeroUI MCP API",
  "version": "1.0.0-alpha.9",
  "description": "REST API for HeroUI component documentation",
  "endpoints": {...}
}
```

#### `GET /health`

Health check endpoint.

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production"
}
```

### Component Endpoints

#### `GET /components`

List all HeroUI components (always returns latest version).

**Parameters:** None

**Response:**

```json
{
  "latestVersion": "v3.0.0-alpha.31",
  "components": ["Button", "Card", "Input", ...],
  "count": 17
}
```

#### `GET /components/:component`

Get complete component information (always returns latest version).

**Parameters:**

- `component` (path): Component name - Required

**Response:**

```json
{
  "component": "Button",
  "version": "v3.0.0-alpha.31",
  "data": {
    "name": "Button",
    "description": "Buttons allow users to perform actions...",
    "importStatement": "import { Button } from '@heroui/react';",
    "anatomy": "<Button>Click me</Button>",
    "props": {...},
    "examples": [...],
    "cssClasses": [...],
    "links": {...}
  }
}
```

#### `GET /components/:component/props`

Get component props documentation (always returns latest version).

**Parameters:**

- `component` (path): Component name - Required

**Response:**

```json
{
  "component": "Button",
  "version": "v3.0.0-alpha.31",
  "props": "# Button Component Props - HeroUI (v3.0.0-alpha.31)..."
}
```

#### `GET /components/:component/examples`

Get component usage examples (always returns latest version).

**Parameters:**

- `component` (path): Component name - Required

**Response:**

```json
{
  "component": "Button",
  "version": "v3.0.0-alpha.31",
  "examples": [
    {
      "name": "basic",
      "content": "// Button Component Example..."
    }
  ]
}
```

#### `GET /components/:component/source`

Get component source code (always returns latest version).

**Parameters:**

- `component` (path): Component name - Required

**Response:**

```json
{
  "component": "Button",
  "version": "v3.0.0-alpha.31",
  "filePath": "button/button.tsx",
  "sourceCode": "import React from 'react'...",
  "githubUrl": "https://github.com/heroui-inc/heroui/blob/v3/..."
}
```

#### `GET /components/:component/styles`

Get component CSS styles (always returns latest version).

**Parameters:**

- `component` (path): Component name - Required

**Response:**

```json
{
  "component": "Button",
  "version": "v3.0.0-alpha.31",
  "filePath": "button.css",
  "stylesCode": ".button { ... }",
  "githubUrl": "https://github.com/heroui-inc/heroui/blob/v3/..."
}
```

### Theme Endpoints

#### `GET /themes`

Get complete theme system data.

**Response:**

```json
{
  "version": "3.0.0-alpha.31",
  "themes": {
    "default": {...}
  },
  "sharedVariables": [...],
  "animations": {...},
  "guides": {...}
}
```

#### `GET /themes/variables`

Get theme CSS variables with optimized structure (common variables extracted).

**Query Parameters:**

- `theme`: Theme name (e.g., `"default"`) - Optional, returns all themes if not specified
- `mode`: `"light"` | `"dark"` - Optional, only applies when specific theme is requested
- `version`: Version string - Optional

**Response (When no theme specified - returns array):**

```json
{
  "themes": [
    {
      "theme": "default",
      "common": {
        "base": [
          {
            "name": "--white",
            "value": "oklch(100% 0 0)",
            "description": "Primitive Colors (Do not change between light and dark)",
            "category": "misc"
          }
          // ... other base variables shared between modes
        ],
        "calculated": [
          {
            "name": "--radius-panel-inner",
            "value": "calc(var(--radius-panel) * 0.5)",
            "category": "radius"
          }
        ]
      },
      "light": {
        "semantic": [
          // ... light mode specific semantic variables
        ]
      },
      "dark": {
        "semantic": [
          // ... dark mode specific semantic variables
        ]
      }
    }
    // ... additional themes
  ],
  "count": 1,
  "version": "3.0.0-alpha.31",
  "latestVersion": "3.0.0-alpha.31"
}
```

**Response (When specific theme requested without mode):**

```json
{
  "theme": "default",
  "common": {
    "base": [...],
    "calculated": [...]
  },
  "light": {
    "semantic": [...]
  },
  "dark": {
    "semantic": [...]
  },
  "version": "3.0.0-alpha.31",
  "latestVersion": "3.0.0-alpha.31"
}
```

**Response (When specific theme and mode requested):**

```json
{
  "theme": "default",
  "mode": "light",
  "variables": {
    "base": [...],
    "semantic": [...],
    "calculated": [...]
  },
  "version": "3.0.0-alpha.31",
  "latestVersion": "3.0.0-alpha.31"
}
```

#### `GET /themes/colors`

Get theme color variables.

**Query Parameters:**

- `theme`: Theme name (e.g., `"default"`) - Optional, returns all themes if not specified
- `mode`: `"light"` | `"dark"` - Optional, returns both modes if not specified
- `version`: Version string - Optional

**Response (When no theme and no mode specified - returns all themes with both modes):**

```json
{
  "themes": [
    {
      "theme": "default",
      "light": [
        {
          "name": "--background",
          "value": "var(--white)",
          "description": "Base Colors",
          "category": "colors"
        }
        // ... more light color variables
      ],
      "dark": [
        {
          "name": "--background",
          "value": "var(--black)",
          "description": "Base Colors",
          "category": "colors"
        }
        // ... more dark color variables
      ]
    }
    // ... additional themes
  ],
  "count": 1,
  "version": "3.0.0-alpha.31",
  "latestVersion": "3.0.0-alpha.31"
}
```

**Response (When specific theme requested without mode - returns both modes):**

```json
{
  "theme": "default",
  "light": [
    {
      "name": "--background",
      "value": "var(--white)",
      "description": "Base Colors",
      "category": "colors"
    }
    // ... more light color variables
  ],
  "dark": [
    {
      "name": "--background",
      "value": "var(--black)",
      "description": "Base Colors",
      "category": "colors"
    }
    // ... more dark color variables
  ],
  "version": "3.0.0-alpha.31",
  "latestVersion": "3.0.0-alpha.31"
}
```

**Response (When specific theme and mode requested):**

```json
{
  "theme": "default",
  "mode": "light",
  "colors": [
    {
      "name": "--background",
      "value": "var(--white)",
      "description": "Base Colors",
      "category": "colors"
    }
    // ... more color variables for the specified mode
  ],
  "version": "3.0.0-alpha.31",
  "latestVersion": "3.0.0-alpha.31"
}
```

#### `GET /themes/animations`

Get animation timings and presets.

**Query Parameters:**

- `version`: Version string - Optional

**Response:**

```json
{
  "timings": [
    {
      "name": "--ease-in-quad",
      "value": "cubic-bezier(0.55, 0.085, 0.68, 0.53)",
      "description": "Smooth acceleration (quadratic)"
    }
  ],
  "presets": [
    {
      "name": "--animate-spin-fast",
      "value": "spin 0.75s linear infinite",
      "description": "Fast spinning animation"
    }
  ],
  "version": "3.0.0-alpha.31",
  "latestVersion": "3.0.0-alpha.31"
}
```

#### `GET /themes/versions`

Get available theme versions.

**Response:**

```json
{
  "latest": "3.0.0-alpha.31",
  "versions": ["3.0.0-alpha.31"]
}
```

#### `GET /docs/available`

Get all available documentation paths from HeroUI v3 docs.

**Parameters:** None

**Response:**

```json
{
  "baseUrl": "https://v3.heroui.com",
  "categories": [
    {
      "name": "components",
      "docs": [
        {
          "title": "Button",
          "path": "/docs/components/button",
          "description": "A clickable button component"
        },
        // ... more components
      ]
    },
    // ... more categories
  ],
  "total": 26
}
```

#### `GET /docs/content`

Get documentation content from a specific path.

**Query Parameters:**

- `path`: Documentation path (e.g., `/docs/introduction`, `/docs/components/button`) - Required

**Response:**

```json
{
  "path": "/docs/introduction",
  "url": "https://v3.heroui.com/docs/introduction.mdx",
  "content": "# Introduction\n\n...",
  "contentType": "text/mdx"
}
```


### Version Endpoints

#### `GET /versions`

Get all version information.

**Response:**

```json
{
  "heroui": {
    "latest": "v3.0.0-alpha.31",
    "versions": ["v3.0.0-alpha.31", "v3.0.0-alpha.30", ...]
  },
  "mcp": {
    "current": "1.0.0-alpha.9"
  }
}
```

#### `GET /versions/:package`

Check specific package version.

**Parameters:**

- `package` (path): Package name - Required
  - Valid values: `"heroui"` or `"mcp"`

**Response:**

```json
{
  "package": "heroui",
  "currentVersion": "v3.0.0-alpha.31",
  "latestVersion": "v3.0.0-alpha.31",
  "isLatest": true,
  "availableVersions": ["v3.0.0-alpha.31", ...]
}
```

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error message",
  "details": "Additional error details"
}
```

### Common Status Codes

- `200 OK` - Request successful
- `400 Bad Request` - Invalid parameters
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

## Rate Limiting

The API currently has no rate limiting, but this may change in the future.

## CORS

The API supports CORS and allows requests from all origins.

## Analytics

The API tracks usage analytics for improving the service. No personal data is collected.

## Deployment

The API is deployed as a Cloudflare Worker and uses R2 for data storage.

### Environments

- **Production**: Deployed via `npm run deploy:api:production`
- **Staging**: Deployed via `npm run deploy:api:staging`
- **Development**: Run locally via `npm run dev:api`

## Testing

Test the API endpoints:

```bash
# Test local development
npm run test:api

# Test staging
npm run test:api:staging

# Test production
npm run test:api:production
```
