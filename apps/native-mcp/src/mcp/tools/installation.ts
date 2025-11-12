/* eslint-disable @typescript-eslint/no-explicit-any */
import type {Tool} from "../types";

import {z} from "zod";

export const installationTool: Tool = {
  name: "installation",
  description: `Get installation guide for HeroUI Native projects (NEW projects only).
Provides comprehensive setup instructions for React Native with Expo.
Includes all required dependencies, exact versions, and critical configuration steps.
HeroUI Native is a React Native component library for mobile applications.`,

  exec(server, {name, description}) {
    const inputSchema = z.object({});

    const handler = async () => {
      // Static comprehensive installation guide for HeroUI Native
      const responseText = `# HeroUI Native Installation Guide (NEW Projects Only)

## Framework: React Native

### Requirements

- Node.js 20.x or later
- React Native compatible with Expo SDK 53+
- React 19.0 or later
- NativeWind v4.2.1 (EXACT version required)
- react-native-reanimated@~4.1.0 (EXACT version required)

**Latest HeroUI Native Version:** latest

### Installation Steps

#### 1. Create a new React Native project (Expo recommended)

\`\`\`bash
npx create-expo-app@latest my-heroui-app
cd my-heroui-app
\`\`\`

For bare React Native CLI:

⚠️ **Note:** \`npx react-native init\` is deprecated. Follow the official React Native guide: https://reactnative.dev/docs/getting-started-without-a-framework

If you previously installed a global \`react-native-cli\` package, remove it first:

\`\`\`bash
npm uninstall -g react-native-cli @react-native-community/cli
\`\`\`

Then create a new project:

\`\`\`bash
npx @react-native-community/cli@latest init MyHeroUIApp
cd MyHeroUIApp
\`\`\`

#### 2. Install HeroUI Native core package

\`\`\`bash
npm install heroui-native
\`\`\`

#### 3. Install MANDATORY peer dependencies

⚠️ **CRITICAL:** Use EXACT versions to avoid compatibility issues

\`\`\`bash
npm install react-native-screens react-native-reanimated@~4.1.0 react-native-worklets@^0.5.1 react-native-safe-area-context@5.6.0 react-native-svg@^15.12.1 tailwind-variants@^3.1.0 tailwind-merge@^3.3.1 @gorhom/bottom-sheet@^5
\`\`\`

**Why exact versions matter:**

- \`react-native-reanimated@~4.1.0\` - Required for animation compatibility
- \`react-native-safe-area-context@5.6.0\` - Ensures proper safe area handling
- Version mismatches WILL cause unexpected bugs and crashes

#### 4. Install and Configure NativeWind v4.2.1 (EXACT version)

⚠️ **CRITICAL:** Must be v4.2.1 for Reanimated v4 compatibility

\`\`\`bash
npm install nativewind@4.2.1
npm install --save-dev tailwindcss@^3.4.17
\`\`\`

For complete NativeWind setup, follow: https://www.nativewind.dev/docs/getting-started/installation

**Babel Configuration** - Add to \`babel.config.js\`:

⚠️ **CRITICAL:** \`babel-preset-expo\` must be in your \`dependencies\` (NOT \`devDependencies\`)

\`\`\`bash
# If not already installed, add babel-preset-expo to dependencies:
npm install babel-preset-expo
\`\`\`

\`\`\`javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  };
};
\`\`\`

#### 5. Configure Tailwind CSS

⚠️ **CRITICAL:** Include HeroUI Native plugin and content paths

**File:** \`tailwind.config.js\`

\`\`\`javascript
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
      colors: {
        // Example: custom colors
        // primary: '#your-color',
      },
    },
  },
  plugins: [heroUINativePlugin],
};
\`\`\`

**⚠️ CRITICAL NOTES:**

1. Import plugin from \`heroui-native/tailwind-plugin\` (NOT \`heroui-native\`)
2. The \`node_modules/heroui-native/lib/**/*.{js,ts,jsx,tsx}\` path is MANDATORY
3. Without this path, components will NOT be styled correctly

#### 6. Configure Metro bundler for NativeWind

⚠️ **REQUIRED:** Configure Metro to work with NativeWind

**File:** \`metro.config.js\`

\`\`\`javascript
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname)

module.exports = withNativeWind(config, { input: './global.css' })
\`\`\`

For complete Metro configuration, see: https://www.nativewind.dev/docs/getting-started/installation

#### 7. Create global CSS file

**File:** \`global.css\` (in root or app directory)

\`\`\`css
@tailwind base;
@tailwind components;
@tailwind utilities;
\`\`\`

#### 8. Wrap your app with HeroUINativeProvider and GestureHandlerRootView

⚠️ **REQUIRED:** Wrap your app with \`GestureHandlerRootView\` for gesture support

**For Expo Router** - **File:** \`app/_layout.tsx\`

\`\`\`tsx
import { HeroUINativeProvider } from 'heroui-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import '../global.css'; // Import global styles

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <HeroUINativeProvider>
        <Stack />
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}
\`\`\`

**For React Native CLI** - **File:** \`App.tsx\`

\`\`\`tsx
import React from 'react';
import { HeroUINativeProvider } from 'heroui-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import './global.css'; // Import global styles
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <SafeAreaProvider>
        <HeroUINativeProvider>{/* Your app content */}</HeroUINativeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
\`\`\`

#### 9. Create your first screen with HeroUI Native components

**File:** \`app/index.tsx\` (Expo Router) or \`screens/HomeScreen.tsx\` (CLI)

\`\`\`tsx
import { View, Text, ScrollView } from 'react-native';
import { Button, Card, Chip } from 'heroui-native';

export default function HomeScreen() {
  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-6 gap-6">
        {/* Card component */}
        <Card>
          <Card.Header>
            <Card.Title>Welcome to HeroUI Native</Card.Title>
            <Card.Description>
              Beautiful, fast and modern React Native UI library
            </Card.Description>
          </Card.Header>
          <Card.Content className="gap-4">
            <View className="flex-row gap-2">
              <Chip type="info">React Native</Chip>
              <Chip type="success">Alpha v1.0.0</Chip>
            </View>
          </Card.Content>
        </Card>

        {/* Interactive button */}
        <Button
          variant="primary"
          onPress={() => console.log('Button pressed!')}
        >
          Get Started
        </Button>

        <Button
          variant="outline"
          onPress={() => console.log('Outline pressed!')}
        >
          Learn More
        </Button>
      </View>
    </ScrollView>
  );
}
\`\`\`

#### 10. Start your development server

**For Expo:**

\`\`\`bash
npx expo start
\`\`\`

**For React Native CLI:**

\`\`\`bash
# iOS
npm run ios

# Android
npm run android
\`\`\`

### Important Notes

- HeroUI Native requires \`HeroUINativeProvider\` wrapper (unlike HeroUI v3 React)
- All components use \`className\` for styling via NativeWind
- Use \`onPress\` instead of \`onClick\` for all touchable components
- Components are designed for React Native (View, Text, TouchableOpacity, etc.)
- Safe area handling is built-in but requires \`react-native-safe-area-context\`
- Animations use \`react-native-reanimated\` - exact version required
- \`GestureHandlerRootView\` wrapper is required for gesture support

### ⚠️ Critical Reminders

1. **NativeWind v4.2.1 is MANDATORY** - Other versions will NOT work with Reanimated v4
2. **Reanimated v4.1.0 is REQUIRED** - Must match exactly for proper animations
3. **babel-preset-expo MUST be in dependencies** - NOT devDependencies, install with \`npm install babel-preset-expo\`
4. **Provider is REQUIRED** - Unlike HeroUI v3 React, you MUST wrap with \`HeroUINativeProvider\`
5. **GestureHandlerRootView is REQUIRED** - Must wrap entire app for gesture support
6. **Tailwind Content Path is CRITICAL** - Must include \`./node_modules/heroui-native/lib/**/*.{js,ts,jsx,tsx}\`
7. **Import Plugin Correctly** - Use \`heroui-native/tailwind-plugin\` NOT \`heroui-native\`
8. **Metro Config is REQUIRED** - Use \`withNativeWind\` in metro.config.js

### 🎨 Theme Customization

HeroUI Native supports theme customization through the provider:

\`\`\`tsx
import { HeroUINativeProvider } from 'heroui-native';

export default function App() {
  return (
    <HeroUINativeProvider
      theme={{
        colors: {
          // Custom color overrides
        },
        // Other theme customizations
      }}
    >
      {/* Your app */}
    </HeroUINativeProvider>
  );
}
\`\`\`

See [Theming Documentation](https://github.com/heroui-inc/heroui-native/blob/beta/src/styles/theme.md) for complete customization options.

### 🔍 Troubleshooting Common Issues

**Issue:** Components not styled correctly or Tailwind styles not applying

- **Solution:** Verify \`./node_modules/heroui-native/lib/**/*.{js,ts,jsx,tsx}\` is in \`tailwind.config.js\` content array
- **Solution:** Ensure \`metro.config.js\` includes \`withNativeWind\` configuration
- **Solution:** Clear Metro cache with \`npx expo start -c\` or \`npx react-native start --reset-cache\`

**Issue:** "HeroUINativeProvider is not defined"

- **Solution:** Check import statement and ensure \`heroui-native\` package is installed

**Issue:** Type errors with TypeScript

- **Solution:** Ensure all peer dependencies are installed with correct versions

### Next Steps

- Explore the [Preview App](#preview-app) to see all components in action
- Check out the [Example Repository](https://github.com/heroui-inc/heroui-native-example) for complete project setup
- Read component documentation in the [Components](#components) section
- Join our [Discord community](https://discord.gg/9b6yyZKmH4) for support
- Review [Provider Configuration](https://github.com/heroui-inc/heroui-native/blob/beta/src/providers/hero-ui-native/provider.md) for advanced setup
- Learn about [Custom Fonts](https://github.com/heroui-inc/heroui-native/blob/beta/src/styles/theme.md#custom-fonts) integration

### 🤖 AI Agent Quick Reference

When creating HeroUI Native projects:

1. **Always verify exact versions** - reanimated@~4.1.0, nativewind@4.2.1, tailwindcss@^3.4.17
2. **Install babel-preset-expo as dependency** - Run \`npm install babel-preset-expo\` (NOT devDependency)
3. **Check Tailwind config** - Must include node_modules path
4. **Configure Metro** - Must use \`withNativeWind\` in metro.config.js
5. **Wrap with GestureHandlerRootView** - Required at app root for gestures
6. **Wrap with Provider** - Required unlike React version
7. **Use className** - Not style prop for Tailwind classes
8. **Import plugin correctly** - From \`/tailwind-plugin\` subpath
9. **Babel config** - Must include nativewind/babel preset with babel-preset-expo
10. **Test on device** - Use Expo Go or build for actual testing

### 📚 Available Components

See README.md [Components section](https://github.com/heroui-inc/heroui-native/blob/beta/README.md#components) for full list of available components with documentation links.`;

      return {
        content: [
          {
            type: "text" as const,
            text: responseText,
          },
        ],
      };
    };

    server.tool(name, description, inputSchema.shape, handler as any);
  },
};
