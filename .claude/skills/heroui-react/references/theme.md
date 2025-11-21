# HeroUI Theme Variables

**Version:** v3.0.0-beta.2 (Beta)

## Theme System Overview

HeroUI v3 uses CSS custom properties (CSS variables) organized in three layers:

1. **Primitives** - Base color values (oklch format)
2. **Semantic** - Named tokens (e.g., `--color-accent`, `--color-background`)
3. **Calculated** - Derived values (e.g., hover states, borders)

## Base Variables (Shared)

```css
--white: oklch(100% 0 0);
--black: oklch(0% 0 0);
--snow: oklch(0.9911 0 0);
--eclipse: oklch(0.2103 0.0059 285.89);
--spacing: 0.25rem;
--field-radius: calc(var(--radius) * 1.5);
```

## Light Mode Variables

### Base Colors
```css
--background: oklch(0.9702 0 0);
--foreground: var(--eclipse);
--surface: var(--white);
--surface-foreground: var(--foreground);
--overlay: var(--white);
--overlay-foreground: var(--foreground);
```

### Semantic Colors
```css
--accent: oklch(0.6204 0.195 253.83);
--accent-foreground: var(--snow);
--success: oklch(0.7329 0.1935 150.81);
--success-foreground: var(--eclipse);
--warning: oklch(0.7819 0.1585 72.33);
--warning-foreground: var(--eclipse);
--danger: oklch(0.6532 0.2328 25.74);
--danger-foreground: var(--snow);
```

### Form Fields
```css
--field-background: var(--white);
--field-foreground: oklch(0.2103 0.0059 285.89);
--field-placeholder: var(--muted);
--field-border: transparent;
```

### Borders & Separators
```css
--border: oklch(0 0 0 / 0%);
--separator: oklch(92% 0.004 286.32);
--border-width: 0px;
```

### Shadows
```css
--surface-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
--overlay-shadow: 0 4px 16px 0 rgba(24, 24, 27, 0.08), 0 8px 24px 0 rgba(24, 24, 27, 0.09);
--field-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
```

### Radius
```css
--radius: 0.5rem;
```

## Dark Mode Variables

Dark mode overrides (only differences from light mode):

```css
[data-theme="dark"],
.dark {
  --background: oklch(12% 0.005 285.823);
  --foreground: var(--snow);
  --surface: oklch(0.2103 0.0059 285.89);
  --overlay: oklch(0.22 0.0059 285.89);
  --field-background: var(--default);
  --warning: oklch(0.8203 0.1388 76.34);
  --danger: oklch(0.594 0.1967 24.63);
  --surface-shadow: 0 0 0 0 transparent inset;
  --overlay-shadow: 0 0 0 0 transparent inset;
  --field-shadow: 0 0 0 0 transparent inset;
}
```

## Usage

### Basic Setup
```css
/* globals.css or your main CSS file */
@import "tailwindcss";
@import "@heroui/styles";

:root {
  /* Customize theme variables */
  --radius: 0.75rem;
  --accent: oklch(0.7 0.25 260);
}

[data-theme="dark"],
.dark {
  --background: oklch(0.1 0 0);
  --foreground: oklch(0.95 0 0);
}
```

### Customizing Colors
```css
:root {
  /* Custom accent color */
  --accent: oklch(0.7 0.25 280);
  
  /* Custom success color */
  --success: oklch(0.65 0.2 145);
}
```

### Customizing Radius
```css
:root {
  --radius: 1rem;
  /* Other radius values are calculated automatically */
}
```

## Color Format

HeroUI uses `oklch()` color format:
- **L** (Lightness): 0-100% or 0-1
- **C** (Chroma): 0-0.4 (saturation)
- **H** (Hue): 0-360 (degrees)

Example: `oklch(0.7 0.25 260)` = 70% lightness, 25% chroma, 260° hue

## Best Practices

1. **Use oklch() format** - Better color manipulation and consistency
2. **Set base values** - Define `--radius`, `--accent` as base
3. **Use calculated values** - Let HeroUI calculate derived values
4. **Test dark mode** - Always test both light and dark themes
5. **Maintain contrast** - Ensure sufficient contrast ratios

## Component-Specific Variables

Some components have specific variables:
- `--field-*` - Form field variables
- `--surface-*` - Surface component variables
- `--overlay-*` - Overlay component variables

## Animation Variables

```css
--skeleton-animation: shimmer; /* shimmer, pulse, or none */
```

