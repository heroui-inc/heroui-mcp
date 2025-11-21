---
name: HeroUI Native Components
description: Build modern React Native mobile applications with HeroUI Native components. Provides installation guides, theme customization, component list, and references to official GitHub documentation. Guides you to use HeroUI Native components correctly with compound component patterns. Use anytime when working with heroui-native.
---

# HeroUI Native Development Guide

This skill enables effective work with HeroUI Native, a modern React Native component library for building mobile applications.

**Reference**: https://github.com/heroui-inc/heroui-native - Official HeroUI Native GitHub repository

## 🚨 Critical Rules - MUST READ

### Version Requirements

- **CRITICAL:** HeroUI Native requires React Native with Expo SDK 53+ or React Native CLI
- **CRITICAL:** React 19.0 or later required
- **CRITICAL:** NativeWind v4.2.1 (EXACT version required) - other versions will NOT work
- **CRITICAL:** react-native-reanimated@~4.1.0 (EXACT version required)
- **CRITICAL:** HeroUI Native is BETA - expect breaking changes, use for new projects only
- **CRITICAL:** Provider is REQUIRED - Must wrap app with `HeroUINativeProvider` (unlike HeroUI v3 React)
- **CRITICAL:** GestureHandlerRootView is REQUIRED - Must wrap entire app for gesture support

### Reference Files

- **CRITICAL:** ALWAYS check reference files before implementing any component
- **CRITICAL:** NEVER guess component APIs or prop names
- **CRITICAL:** Check component anatomy in reference files before using compound components
- **CRITICAL:** Verify exact dependency versions - mismatches WILL cause bugs and crashes

## Quick Start

### Installation & Setup

See `references/installation.md` for complete installation instructions.

```bash
# Install HeroUI Native
npm install heroui-native

# Install MANDATORY peer dependencies (EXACT versions)
npm install react-native-screens react-native-reanimated@~4.1.0 react-native-worklets@^0.5.1 react-native-safe-area-context@5.6.0 react-native-svg@^15.12.1 tailwind-variants@^3.1.0 tailwind-merge@^3.3.1 @gorhom/bottom-sheet@^5

# Install NativeWind v4.2.1 (EXACT version)
npm install nativewind@4.2.1
npm install --save-dev tailwindcss@^3.4.17
```

### Basic Setup

```tsx
// Wrap app with required providers
import { HeroUINativeProvider } from 'heroui-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import '../global.css';

export default function App() {
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <HeroUINativeProvider>
        {/* Your app content */}
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}
```

### Basic Imports

```tsx
// React Native Components
import { Button, Card, TextField, Tabs } from 'heroui-native';
import { View, Text } from 'react-native';

// Use className for styling (NativeWind)
<View className="flex-1 bg-background p-6">
  <Card>
    <Card.Header>
      <Card.Title>Welcome</Card.Title>
    </Card.Header>
  </Card>
</View>
```

## Design Philosophy

HeroUI Native follows core principles:

1. **Mobile-First** - Designed specifically for React Native mobile applications
2. **Native Performance** - Optimized for native rendering and animations
3. **Composable Architecture** - Build complex UIs from simple, reusable parts
4. **Type Safety** - Full TypeScript support with comprehensive types
5. **Accessibility** - Built-in accessibility support for mobile
6. **Gesture Support** - Full gesture handling with react-native-gesture-handler
7. **Theme Customization** - Flexible theming system via provider
8. **NativeWind Integration** - Uses className for styling via NativeWind

## Reference Files Workflow

### Essential Reference Files

Always check reference files when implementing HeroUI Native components:

1. **Component List** - See `references/components.md` for available components
2. **Component Details** - Refer to official GitHub documentation at https://github.com/heroui-inc/heroui-native/blob/beta/src/components/{component-name}/{component-name}.md
3. **Theme Customization** - See `references/theme.md` for theme variables
4. **Installation** - See `references/installation.md` for complete setup

### When to Use Each Reference

| Reference File | Use Case | Example Query |
|----------------|----------|---------------|
| `references/components.md` | Starting any project, checking what's available | "What components does HeroUI Native provide?" |
| Official GitHub Docs | Before using any component | "How do I use the Button component?" - Visit https://github.com/heroui-inc/heroui-native/blob/beta/src/components/button/button.md |
| `references/theme.md` | Customization, theming | "What are the color variables?" |
| `references/installation.md` | Setting up a new project | "How do I install HeroUI Native in Expo?" |

### Common Workflows

#### Implementing a New Component

1. Check `references/components.md` - Verify component exists
2. Visit official GitHub docs at https://github.com/heroui-inc/heroui-native/blob/beta/src/components/{component-name}/{component-name}.md - Understand anatomy and props
3. Review examples in official docs - See implementation patterns
4. Implement with correct compound component structure

## Component Architecture

### Compound Components Pattern

**CRITICAL:** HeroUI Native uses compound components. Never use flat prop patterns.

```tsx
// ✅ CORRECT - Compound components with anatomy
<Card>
  <Card.Header>
    <Card.Title>Product Name</Card.Title>
    <Card.Description>Short description</Card.Description>
  </Card.Header>
  <Card.Body>
    <Text>Main content goes here</Text>
  </Card.Body>
  <Card.Footer>
    <Button variant="primary" onPress={handlePress}>
      Buy Now
    </Button>
  </Card.Footer>
</Card>

// ❌ WRONG - Flat props (not supported)
<Card
  title="Product Name"
  description="Short description"
  content="Main content"
/>
```

### Event Handlers

- **Use `onPress`, not `onClick`** - Standard React Native pattern
- All interactive components support `onPress`
- Components handle gestures automatically via react-native-gesture-handler

```tsx
<Button
  variant="primary"
  onPress={() => console.log("Pressed")}
>
  Click me
</Button>
```

### Provider Required

**CRITICAL:** Unlike HeroUI v3 React, HeroUI Native REQUIRES a Provider wrapper:

```tsx
// ✅ Correct - Provider required
<GestureHandlerRootView style={{flex: 1}}>
  <HeroUINativeProvider>
    <Button onPress={handleClick}>Click me</Button>
  </HeroUINativeProvider>
</GestureHandlerRootView>

// ❌ Wrong - Provider missing
<Button onPress={handleClick}>Click me</Button>
```

### Styling with className

HeroUI Native uses NativeWind for styling - use `className` prop:

```tsx
// ✅ Correct - Use className
<View className="flex-1 bg-background p-6">
  <Card className="rounded-lg">
    <Card.Body className="gap-4">
      <Text className="text-foreground text-lg">Content</Text>
    </Card.Body>
  </Card>
</View>

// ❌ Wrong - Don't use style prop for Tailwind classes
<View style={{flex: 1, backgroundColor: 'white'}}>
```

## Styling System

### Theme Variables

HeroUI Native uses a theme system via the provider. See `references/theme.md` for complete details:

```tsx
// Customize theme via provider
<HeroUINativeProvider
  theme={{
    colors: {
      accent: 'oklch(0.7 0.25 260)',
      // Custom colors
    },
  }}
>
  {/* Your app */}
</HeroUINativeProvider>
```

### NativeWind Integration

HeroUI Native uses NativeWind v4.2.1 for styling:

```tsx
// Using Tailwind utilities with HeroUI Native components
<Button
  className="px-8 py-4" // Tailwind utilities
  variant="primary" // HeroUI variant
>
  Large Button
</Button>

// Responsive design with NativeWind
<Card className="w-full">
  <Card.Body className="p-4">
    Responsive padding
  </Card.Body>
</Card>
```

### Critical Configuration

**CRITICAL:** Tailwind config must include HeroUI Native paths:

```javascript
// tailwind.config.js
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    // CRITICAL: Must include this path
    './node_modules/heroui-native/lib/**/*.{js,ts,jsx,tsx}',
  ],
  plugins: [require('heroui-native/tailwind-plugin')],
};
```

## Framework-Specific Guides

### Expo (Recommended)

- Use Expo SDK 53+
- Configure `babel.config.js` with NativeWind preset
- Wrap app with `GestureHandlerRootView` and `HeroUINativeProvider`
- Import `global.css` in root layout

See `references/installation.md` for complete Expo setup.

### React Native CLI

- Follow React Native CLI setup guide
- Configure Metro bundler with NativeWind
- Wrap app with required providers
- Ensure all peer dependencies are installed

## Accessibility Best Practices

HeroUI Native components include accessibility support:

- **Screen Reader Support** - ARIA attributes automatically applied
- **Touch Targets** - Proper sizing for mobile touch interactions
- **Focus Management** - Proper focus indicators
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

// DEBUGGING: Check official GitHub documentation
// See https://github.com/heroui-inc/heroui-native/blob/beta/src/components/card/card.md
```

### Styling Not Applied

1. Check NativeWind v4.2.1 is installed (exact version)
2. Verify Tailwind config includes `./node_modules/heroui-native/lib/**/*.{js,ts,jsx,tsx}` path
3. Ensure Metro config includes `withNativeWind`
4. Clear Metro cache: `npx expo start -c` or `npx react-native start --reset-cache`
5. Check `references/theme.md` for theme variable setup

### Provider Errors

1. Ensure `HeroUINativeProvider` wraps your app
2. Ensure `GestureHandlerRootView` wraps the provider
3. Check imports are correct: `import { HeroUINativeProvider } from 'heroui-native'`

### Version Mismatch Errors

1. Verify exact versions:
   - `react-native-reanimated@~4.1.0` (exact)
   - `nativewind@4.2.1` (exact)
   - `react-native-safe-area-context@5.6.0` (exact)
2. Clear node_modules and reinstall
3. Check `references/installation.md` for version requirements

### TypeScript Errors

1. Ensure React 19+ and TypeScript 5+
2. Check that `heroui-native` types are installed
3. Verify `tsconfig.json` includes proper module resolution
4. Visit official GitHub docs for correct prop types

### Debugging Checklist

1. **Component Issues**
   - [ ] Checked `references/components.md` for component structure?
   - [ ] Following compound component pattern?
   - [ ] Imported from correct package (`heroui-native`)?
   - [ ] Provider and GestureHandlerRootView wrapping app?

2. **Styling Issues**
   - [ ] NativeWind v4.2.1 installed (exact version)?
   - [ ] Tailwind config includes node_modules path?
   - [ ] Metro config includes `withNativeWind`?
   - [ ] Metro cache cleared?
   - [ ] Theme variables defined (see `references/theme.md`)?

3. **Behavior Issues**
   - [ ] Using `onPress` instead of `onClick`?
   - [ ] Using `className` for styling?
   - [ ] GestureHandlerRootView wrapping app?
   - [ ] All peer dependencies installed?

## Version Compatibility

| HeroUI Native Version | React Native | React | NativeWind | Reanimated | Status |
|----------------------|--------------|------|------------|------------|--------|
| v1.0.0-beta.3+ | Expo SDK 53+ | 19.0+ | 4.2.1 (exact) | ~4.1.0 (exact) | Beta |

### Component Checklist

Before implementing any component:

1. ✅ Check `references/components.md` - Verify component exists
2. ✅ Visit official GitHub docs - Understand anatomy
3. ✅ Review examples in official docs - See patterns
4. ✅ Use compound components - Not flat props
5. ✅ Use `onPress` - Not `onClick`
6. ✅ Use `className` - For styling
7. ✅ Verify Provider setup - Required wrapper

## Resources

- **Component Reference**: See `references/components.md` for component list
- **Component Details**: Visit https://github.com/heroui-inc/heroui-native/blob/beta/src/components/{component-name}/{component-name}.md for detailed component documentation
- **Theme Guide**: See `references/theme.md` for theming
- **Installation**: See `references/installation.md` for setup
- **Official GitHub Repository**: https://github.com/heroui-inc/heroui-native
- **Example Repository**: https://github.com/heroui-inc/heroui-native-example

---

**Remember**: Always check `references/components.md` and official GitHub documentation for accurate, up-to-date component information. Never assume or guess component APIs. HeroUI Native is actively evolving - verify everything with the official docs at https://github.com/heroui-inc/heroui-native

