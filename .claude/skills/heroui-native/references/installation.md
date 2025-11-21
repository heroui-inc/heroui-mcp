# HeroUI Native Installation Guide

**Version:** v1.0.0-beta.3 (Beta)

⚠️ **CRITICAL:** This guide is for NEW projects only. HeroUI Native requires specific exact versions of dependencies.

## Prerequisites

- **Node.js**: 20.x or later
- **React Native**: Compatible with Expo SDK 53+ or React Native CLI
- **React**: 19.0 or later
- **NativeWind**: v4.2.1 (EXACT version required)
- **react-native-reanimated**: ~4.1.0 (EXACT version required)

## Installation Steps

### 1. Create a New React Native Project

#### Expo (Recommended)

```bash
npx create-expo-app@latest my-heroui-app
cd my-heroui-app
```

#### React Native CLI

⚠️ **Note:** `npx react-native init` is deprecated. Follow the official React Native guide: https://reactnative.dev/docs/getting-started-without-a-framework

```bash
npx @react-native-community/cli@latest init MyHeroUIApp
cd MyHeroUIApp
```

### 2. Install HeroUI Native Core Package

```bash
npm install heroui-native
```

### 3. Install MANDATORY Peer Dependencies

⚠️ **CRITICAL:** Use EXACT versions to avoid compatibility issues

```bash
npm install react-native-screens react-native-reanimated@~4.1.0 react-native-worklets@^0.5.1 react-native-safe-area-context@5.6.0 react-native-svg@^15.12.1 tailwind-variants@^3.1.0 tailwind-merge@^3.3.1 @gorhom/bottom-sheet@^5
```

**Why exact versions matter:**
- `react-native-reanimated@~4.1.0` - Required for animation compatibility
- `react-native-safe-area-context@5.6.0` - Ensures proper safe area handling
- Version mismatches WILL cause unexpected bugs and crashes

### 4. Install and Configure NativeWind v4.2.1 (EXACT version)

⚠️ **CRITICAL:** Must be v4.2.1 for Reanimated v4 compatibility

```bash
npm install nativewind@4.2.1
npm install --save-dev tailwindcss@^3.4.17
```

### 5. Configure Babel

⚠️ **CRITICAL:** `babel-preset-expo` must be in your `dependencies` (NOT `devDependencies`)

```bash
npm install babel-preset-expo
```

**File:** `babel.config.js`

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  };
};
```

### 6. Configure Tailwind CSS

⚠️ **CRITICAL:** Include HeroUI Native plugin and content paths

**File:** `tailwind.config.js`

```javascript
import heroUINativePlugin from 'heroui-native/tailwind-plugin';

module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    // CRITICAL: Must include this path for component styles
    './node_modules/heroui-native/lib/**/*.{js,ts,jsx,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // Optional: Custom theme overrides
    },
  },
  plugins: [heroUINativePlugin],
};
```

**⚠️ CRITICAL NOTES:**

1. Import plugin from `heroui-native/tailwind-plugin` (NOT `heroui-native`)
2. The `node_modules/heroui-native/lib/**/*.{js,ts,jsx,tsx}` path is MANDATORY
3. Without this path, components will NOT be styled correctly

### 7. Configure Metro Bundler

⚠️ **REQUIRED:** Configure Metro to work with NativeWind

**File:** `metro.config.js`

```javascript
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname)

module.exports = withNativeWind(config, { input: './global.css' })
```

### 8. Create Global CSS File

**File:** `global.css` (in root or app directory)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 9. Wrap Your App with Required Providers

⚠️ **REQUIRED:** Wrap your app with `GestureHandlerRootView` and `HeroUINativeProvider`

#### For Expo Router - **File:** `app/_layout.tsx`

```tsx
import { HeroUINativeProvider } from 'heroui-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import '../global.css';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <HeroUINativeProvider>
        <Stack />
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}
```

#### For React Native CLI - **File:** `App.tsx`

```tsx
import React from 'react';
import { HeroUINativeProvider } from 'heroui-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import './global.css';

export default function App() {
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <SafeAreaProvider>
        <HeroUINativeProvider>
          {/* Your app content */}
        </HeroUINativeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

### 10. Create Your First Screen

**File:** `app/index.tsx` (Expo Router) or `screens/HomeScreen.tsx` (CLI)

```tsx
import { View, Text, ScrollView } from 'react-native';
import { Button, Card, Chip } from 'heroui-native';

export default function HomeScreen() {
  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-6 gap-6">
        <Card>
          <Card.Header>
            <Card.Title>Welcome to HeroUI Native</Card.Title>
            <Card.Description>
              Beautiful, fast and modern React Native UI library
            </Card.Description>
          </Card.Header>
          <Card.Body className="gap-4">
            <View className="flex-row gap-2">
              <Chip type="info">React Native</Chip>
              <Chip type="success">Beta v1.0.0</Chip>
            </View>
          </Card.Body>
        </Card>

        <Button
          variant="primary"
          onPress={() => console.log('Button pressed!')}
        >
          Get Started
        </Button>
      </View>
    </ScrollView>
  );
}
```

### 11. Start Your Development Server

**For Expo:**

```bash
npx expo start
```

**For React Native CLI:**

```bash
# iOS
npm run ios

# Android
npm run android
```

## ⚠️ Critical Reminders

1. **NativeWind v4.2.1 is MANDATORY** - Other versions will NOT work with Reanimated v4
2. **Reanimated v4.1.0 is REQUIRED** - Must match exactly for proper animations
3. **babel-preset-expo MUST be in dependencies** - NOT devDependencies
4. **Provider is REQUIRED** - Must wrap with `HeroUINativeProvider`
5. **GestureHandlerRootView is REQUIRED** - Must wrap entire app for gesture support
6. **Tailwind Content Path is CRITICAL** - Must include `./node_modules/heroui-native/lib/**/*.{js,ts,jsx,tsx}`
7. **Import Plugin Correctly** - Use `heroui-native/tailwind-plugin` NOT `heroui-native`
8. **Metro Config is REQUIRED** - Use `withNativeWind` in metro.config.js

## Theme Customization

HeroUI Native supports theme customization through the provider:

```tsx
import { HeroUINativeProvider } from 'heroui-native';

export default function App() {
  return (
    <HeroUINativeProvider
      theme={{
        colors: {
          // Custom color overrides
          accent: 'oklch(0.7 0.25 260)',
        },
      }}
    >
      {/* Your app */}
    </HeroUINativeProvider>
  );
}
```

See `references/theme.md` for complete customization options.

## Troubleshooting Common Issues

### Components not styled correctly

- **Solution:** Verify `./node_modules/heroui-native/lib/**/*.{js,ts,jsx,tsx}` is in `tailwind.config.js` content array
- **Solution:** Ensure `metro.config.js` includes `withNativeWind` configuration
- **Solution:** Clear Metro cache with `npx expo start -c` or `npx react-native start --reset-cache`

### "HeroUINativeProvider is not defined"

- **Solution:** Check import statement: `import { HeroUINativeProvider } from 'heroui-native'`
- **Solution:** Ensure `heroui-native` package is installed

### Type errors with TypeScript

- **Solution:** Ensure all peer dependencies are installed with correct versions
- **Solution:** Verify React 19+ and TypeScript 5+

### Version mismatch errors

- **Solution:** Verify exact versions match requirements
- **Solution:** Clear node_modules and reinstall: `rm -rf node_modules && npm install`

## Next Steps

- See `references/components.md` for available components
- See `references/theme.md` for theme customization
- For detailed component docs, refer to the official GitHub documentation at https://github.com/heroui-inc/heroui-native/blob/beta/src/components/{component-name}/{component-name}.md
- Check out the [Example Repository](https://github.com/heroui-inc/heroui-native-example) for complete project setup
- Join our [Discord community](https://discord.gg/9b6yyZKmH4) for support

