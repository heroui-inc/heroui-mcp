# HeroUI Native Theme Customization Guide

**Version:** v1.0.0-beta.3 (Beta)

HeroUI Native uses a theme system via the `HeroUINativeProvider` for customization. All colors use the `oklch()` color format.

## Theme System Overview

HeroUI Native uses a semantic color system organized into categories:

1. **Base Colors** - Background, foreground, muted
2. **Semantic Colors** - Overlay, default, accent, field colors
3. **Status Colors** - Success, warning, danger
4. **Surface Colors** - Surface and surface-foreground
5. **Utility Colors** - Border, divider, link

## Light Mode Colors

### Base
- **background**: `oklch(0.9702 0 0)`
- **foreground**: `oklch(0.2103 0.0059 285.89)`
- **muted**: `oklch(55.2% 0.016 285.938)`

### Semantic
- **overlay**: `oklch(100% 0 0)`
- **overlay-foreground**: `var(--eclipse)`
- **default**: `oklch(94% 0.001 286.375)`
- **default-foreground**: `oklch(0.2103 0.0059 285.89)`
- **accent**: `oklch(0.6204 0.195 253.83)`
- **accent-foreground**: `oklch(0.9911 0 0)`
- **field-background**: `oklch(100% 0 0)`
- **field-foreground**: `oklch(0.2103 0.0059 285.89)`
- **field-placeholder**: `oklch(55.2% 0.016 285.938)`
- **field-border**: `transparent`
- **segment**: `oklch(100% 0 0)`
- **segment-foreground**: `oklch(0.2103 0.0059 285.89)`

### Status
- **success**: `oklch(0.7329 0.1935 150.81)`
- **success-foreground**: `oklch(0.2103 0.0059 285.89)`
- **warning**: `oklch(0.7819 0.1585 72.33)`
- **warning-foreground**: `oklch(0.2103 0.0059 285.89)`
- **danger**: `oklch(0.6532 0.2328 25.74)`
- **danger-foreground**: `oklch(0.9911 0 0)`

### Surface
- **surface**: `oklch(100% 0 0)`
- **surface-foreground**: `var(--eclipse)`

### Utility
- **border**: `oklch(0 0 0 / 0%)`
- **divider**: `oklch(72% 0.004 286.32)`
- **link**: `var(--eclipse)`

## Dark Mode Colors

### Base
- **background**: `oklch(0% 0 0)`
- **foreground**: `oklch(0.9911 0 0)`
- **muted**: `oklch(70.5% 0.015 286.067)`

### Semantic
- **overlay**: `oklch(0.2563 0.0058 271.19)`
- **overlay-foreground**: `var(--snow)`
- **default**: `oklch(27.4% 0.006 286.033)`
- **default-foreground**: `oklch(0.9911 0 0)`
- **accent**: `oklch(0.6204 0.195 253.83)`
- **accent-foreground**: `oklch(0.9911 0 0)`
- **field-background**: `oklch(27.4% 0.006 286.033)`
- **field-foreground**: `var(--snow)`
- **field-placeholder**: `oklch(70.5% 0.015 286.067)`
- **field-border**: `transparent`
- **segment**: `oklch(0.3964 0.01 285.93)`
- **segment-foreground**: `var(--snow)`

### Status
- **success**: `oklch(0.7329 0.1935 150.81)`
- **success-foreground**: `oklch(0.2103 0.0059 285.89)`
- **warning**: `oklch(0.8203 0.1388 76.34)`
- **warning-foreground**: `oklch(0.2103 0.0059 285.89)`
- **danger**: `oklch(0.594 0.1967 24.63)`
- **danger-foreground**: `oklch(0.9911 0 0)`

### Surface
- **surface**: `oklch(0.2103 0.0059 285.89)`
- **surface-foreground**: `var(--snow)`

### Utility
- **border**: `oklch(1 0 0 / 0%)`
- **divider**: `oklch(38% 0.006 286.033)`
- **link**: `var(--snow)`

## Border Radius

- **DEFAULT**: `8`
- **panel**: `16`
- **panel-inner**: `12`

## Opacity

- **disabled**: `0.5`

## Usage

### Customize Theme via Provider

```tsx
import { HeroUINativeProvider } from 'heroui-native';

export default function App() {
  return (
    <HeroUINativeProvider
      theme={{
        colors: {
          // Custom accent color
          accent: 'oklch(0.7 0.25 280)',
          
          // Custom success color
          success: 'oklch(0.65 0.2 145)',
          
          // Custom background
          background: 'oklch(0.95 0 0)',
        },
      }}
    >
      {/* Your app */}
    </HeroUINativeProvider>
  );
}
```

### Color Format

HeroUI Native uses `oklch()` color format:
- **L** (Lightness): 0-100% or 0-1
- **C** (Chroma): 0-0.4 (saturation)
- **H** (Hue): 0-360 (degrees)

Example: `oklch(0.7 0.25 260)` = 70% lightness, 25% chroma, 260° hue

## Best Practices

1. **Use oklch() format** - Better color manipulation and consistency
2. **Set base values** - Define accent, background as base colors
3. **Test both modes** - Always test light and dark themes
4. **Maintain contrast** - Ensure sufficient contrast ratios for accessibility
5. **Use semantic colors** - Prefer semantic tokens over direct color values

## Resources

- Official theme documentation: https://github.com/heroui-inc/heroui-native/blob/beta/src/styles/theme.md
- Color system guide: See GitHub repository for detailed color system documentation
- Custom fonts: https://github.com/heroui-inc/heroui-native/blob/beta/src/styles/theme.md#custom-fonts

---

**Note:** Theme variables may change during beta. Check version notes for updates.

