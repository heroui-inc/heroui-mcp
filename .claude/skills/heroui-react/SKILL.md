---
name: HeroUI React Components
description: Build modern React applications with HeroUI v3 components. Provides installation guides, theme customization, component list, and references to official documentation. Guides you to use HeroUI v3 components correctly with compound component patterns. Use anytime when working with @heroui/react.
---

# HeroUI v3 Development Guide

**Version:** v3.0.0-beta.2 (Beta)

This skill enables effective work with HeroUI v3, a modern React component library built on React Aria Components with Tailwind CSS v4 integration.

**Reference**: https://v3.heroui.com - Official HeroUI v3 documentation

## 🚨 Critical Rules - MUST READ

### Version Requirements

- **CRITICAL:** HeroUI v3 requires Tailwind CSS v4 (v3 is NOT supported)
- **CRITICAL:** Use @heroui/react for React components with full accessibility
- **CRITICAL:** Use @heroui/styles for framework-agnostic BEM classes (styling only)
- **CRITICAL:** Never mix React components with BEM classes - choose one approach
- **CRITICAL:** HeroUI v3 is BETA - expect breaking changes, use for new projects only
- **CRITICAL:** Migration from v2 to v3 is NOT currently supported

### Reference Files

- **CRITICAL:** ALWAYS check reference files before implementing any component
- **CRITICAL:** NEVER guess component APIs or prop names
- **CRITICAL:** Check component anatomy in reference files before using compound components

## Quick Start

### Installation & Setup

See `references/installation.md` for framework-specific installation instructions.

```bash
# React with full accessibility
npm install @heroui/react@beta @heroui/styles@beta tailwindcss@next
```

### Basic Imports

```tsx
// React Components (recommended - includes accessibility)
import { Button, Card, TextField, Tabs } from "@heroui/react";

// Framework-agnostic styles (CSS only - no JavaScript behavior)
import "@heroui/styles";
```

### Tailwind Configuration (Required for React)

```css
/* index.css or global.css (Tailwind CSS v4) */
@import "tailwindcss";
@import "@heroui/styles";

/* Custom theme overrides - Just use CSS! */
:root {
  --radius: 0.75rem;
  --accent: oklch(0.7 0.25 260);
}

[data-theme="dark"],
.dark {
  --background: oklch(0.1 0 0);
  --foreground: oklch(0.95 0 0);
}
```

See `references/theme.md` for complete theme customization guide.

## Design Philosophy

HeroUI v3 follows 10 core principles:

1. **Accessibility First** - Every component is keyboard navigable and screen reader friendly
2. **Composable Architecture** - Build complex UIs from simple, reusable parts
3. **Semantic Intent** - Components express purpose, not just appearance
4. **Progressive Disclosure** - Reveal complexity gradually as needed
5. **Type Safety** - Full TypeScript support with comprehensive types
6. **Separation of Concerns** - Logic, styling, and behavior are cleanly separated
7. **Predictable Behavior** - Consistent patterns across all components
8. **Performance Optimized** - Minimal runtime overhead, tree-shakeable
9. **Framework Flexibility** - React today, more frameworks tomorrow
10. **AI-Ready Design** - Structured for LLM understanding and generation

## Reference Files Workflow

### Essential Reference Files

Always check reference files when implementing HeroUI components:

1. **Component List** - See `references/components.md` for available components
2. **Component Details** - Refer to official documentation at https://v3.heroui.com/docs/components/{component-name} (component name in kebab-case, e.g., `alert-dialog`, `checkbox-group`)
3. **Theme Customization** - See `references/theme.md` for CSS variables
4. **Installation** - See `references/installation.md` for framework setup

### When to Use Each Reference

| Reference File | Use Case | Example Query |
|----------------|----------|---------------|
| `references/components.md` | Starting any project, checking what's available | "What components does HeroUI provide?" |
| Official Docs | Before using any component | "How do I use the Button component?" - Visit https://v3.heroui.com/docs/components/button |
| `references/theme.md` | Customization, theming | "What are the color variables?" |
| `references/installation.md` | Setting up a new project | "How do I install HeroUI in Next.js?" |

### Common Workflows

#### Implementing a New Component

1. Check `references/components.md` - Verify component exists
2. Visit official docs at https://v3.heroui.com/docs/components/{component-name} - Understand anatomy and props
3. Review examples in official docs - See implementation patterns
4. Implement with correct compound component structure

## Component Architecture

### Compound Components Pattern

**CRITICAL:** HeroUI v3 uses compound components. Never use flat prop patterns.

```tsx
// ✅ CORRECT - Compound components with anatomy
<Card>
  <Card.Header>
    <Card.Title>Product Name</Card.Title>
    <Card.Description>Short description</Card.Description>
  </Card.Header>
  <Card.Content>
    <p>Main content goes here with full flexibility</p>
  </Card.Content>
  <Card.Footer>
    <Button variant="primary">Buy Now</Button>
  </Card.Footer>
</Card>

// ❌ WRONG - Flat props (not supported)
<Card
  title="Product Name"
  description="Short description"
  content="Main content"
  footer={<Button>Buy Now</Button>}
/>
```

### Event Handlers

- **Use `onPress`, not `onClick`** - Better accessibility support for keyboard, mouse, and touch
- All interactive components support `onPress`
- Components handle keyboard automatically

```tsx
<Button
  onPress={handleAction} // Uses onPress, not onClick
>
  Click me
</Button>
```

### No Provider Required

Unlike HeroUI v2, v3 components work directly without a Provider wrapper:

```tsx
// ✅ Correct - No Provider needed
<Button onPress={handleClick}>Click me</Button>

// ❌ Wrong - Provider not needed
<HeroUIProvider>
  <Button onPress={handleClick}>Click me</Button>
</HeroUIProvider>
```

## Styling System

### CSS Variables Architecture

HeroUI uses a three-layer CSS variable system. See `references/theme.md` for complete details:

```css
/* Layer 1: Base Primitives */
--white: oklch(100% 0 0);
--black: oklch(0% 0 0);
--spacing: 0.25rem;

/* Layer 2: Semantic Tokens */
--accent: oklch(0.6204 0.195 253.83);
--success: oklch(0.7329 0.1935 150.81);
--danger: oklch(0.6532 0.2328 25.74);

/* Layer 3: Calculated/Dynamic */
--field-radius: calc(var(--radius) * 1.5);
```

### Tailwind Integration

```tsx
// Using Tailwind utilities with HeroUI components
<Button
  className="px-8 py-4 text-lg font-bold" // Tailwind utilities
  variant="primary" // HeroUI variant
>
  Large Button
</Button>

// Responsive design with Tailwind
<Card className="w-full md:w-1/2 lg:w-1/3">
  <Card.Content className="p-4 md:p-6 lg:p-8">
    Responsive padding
  </Card.Content>
</Card>
```

### CSS Import Order

**CRITICAL:** Always import Tailwind CSS before HeroUI styles:

```css
/* ✅ Correct order */
@import "tailwindcss";
@import "@heroui/styles";

/* ❌ Wrong order */
@import "@heroui/styles";
@import "tailwindcss";
```

## Framework-Specific Guides

### Next.js App Router

- Use `"use client"` directive for components with event handlers
- Server components can use HeroUI components without event handlers
- Import global CSS in `app/globals.css`

See `references/installation.md` for complete setup.

### Next.js Pages Router

- Import styles in `pages/_app.tsx`
- Add `suppressHydrationWarning` to prevent hydration mismatches

### Vite

- Use `@tailwindcss/vite` plugin (no PostCSS config needed)
- Import CSS in `src/index.css`
- HMR works seamlessly with HeroUI components

### Astro

- Use `@tailwindcss/vite` plugin in `astro.config.mjs`
- React components need client directives (`client:load`, `client:visible`, etc.)

## Accessibility Best Practices

All HeroUI React components include full keyboard support:

- **Keyboard Navigation** - Arrow keys, Tab, Enter, Escape
- **Screen Reader Support** - ARIA attributes automatically applied
- **Focus Management** - Proper focus indicators and focus trapping
- **Event Handlers** - Use `onPress` for better accessibility

## Troubleshooting Guide

### Component Not Rendering

```tsx
// PROBLEM: Component doesn't appear
<Card title="Test" />  // ❌ Wrong

// SOLUTION: Use compound components
<Card>  // ✅ Correct
  <Card.Header>
    <Card.Title>Test</Card.Title>
  </Card.Header>
</Card>

// DEBUGGING: Check official documentation
// See https://v3.heroui.com/docs/components/card for correct structure
```

### Styling Not Applied

1. Check Tailwind CSS v4 is installed (not v3)
2. Verify CSS import order (Tailwind first, then HeroUI)
3. Ensure CSS file is imported in your app entry point
4. Check `references/theme.md` for CSS variable setup

### TypeScript Errors

1. Ensure React 18+ and TypeScript 5+
2. Check that `@heroui/react` types are installed
3. Verify `tsconfig.json` includes proper module resolution
4. Visit official docs at https://v3.heroui.com/docs/components/{component-name} for correct prop types

### Event Handlers Not Working

1. In Next.js App Router, ensure component has `"use client"` directive
2. Use `onPress` instead of `onClick` for HeroUI components
3. Check that the component is a client component if needed

### Debugging Checklist

1. **Component Issues**
   - [ ] Checked reference files for component structure?
   - [ ] Following compound component pattern?
   - [ ] Imported from correct package (`@heroui/react`)?

2. **Styling Issues**
   - [ ] Tailwind CSS v4 installed?
   - [ ] CSS import order correct (Tailwind before HeroUI)?
   - [ ] CSS variables defined (see `references/theme.md`)?
   - [ ] Dark mode class applied correctly?

3. **Behavior Issues**
   - [ ] Using `onPress` instead of `onClick`?
   - [ ] Client component directive added (Next.js App Router)?
   - [ ] Keyboard navigation working?

## Version Compatibility

| HeroUI Version | Tailwind CSS | React | Status |
|---------------|--------------|-------|--------|
| 3.0.0-beta.2+ | v4.0+ | 18.0+ | Beta |
| 2.x.x | v3.x | 17.0+ | Stable (not covered) |

### Component Checklist

Before implementing any component:

1. ✅ Check `references/components.md` - Verify component exists
2. ✅ Visit official docs at https://v3.heroui.com/docs/components/{component-name} - Understand anatomy
3. ✅ Review examples in official docs - See patterns
4. ✅ Use compound components - Not flat props
5. ✅ Use `onPress` - Not `onClick`

## Resources

- **Component Reference**: See `references/components.md` for component list
- **Component Details**: Visit https://v3.heroui.com/docs/components/{component-name} for detailed component documentation
- **Theme Guide**: See `references/theme.md` for theming
- **Installation**: See `references/installation.md` for setup
- **Official Documentation**: https://v3.heroui.com
- **GitHub Repository**: https://github.com/heroui-inc/heroui/tree/v3

---

**Remember**: Always check `references/components.md` and official documentation for accurate, up-to-date component information. Never assume or guess component APIs. HeroUI v3 is actively evolving - verify everything with the official docs at https://v3.heroui.com
