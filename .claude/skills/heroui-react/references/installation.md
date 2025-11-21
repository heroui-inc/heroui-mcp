# HeroUI Installation Guide

**Version:** v3.0.0-beta.2 (Beta)

## Prerequisites

- **Node.js**: 20.0.0 or higher
- **React**: 18.0.0 or higher
- **Tailwind CSS**: v4.0.0 or higher (v3 is NOT supported)

## Installation

### Install Packages

```bash
npm install @heroui/react@beta @heroui/styles@beta
```

Or with other package managers:

```bash
# pnpm
pnpm add @heroui/react@beta @heroui/styles@beta

# yarn
yarn add @heroui/react@beta @heroui/styles@beta

# bun
bun add @heroui/react@beta @heroui/styles@beta
```

## Framework Setup

### Next.js App Router

1. **Install dependencies:**
```bash
npm install @heroui/react@beta @heroui/styles@beta tailwindcss@next
```

2. **Create or update `app/globals.css`:**
```css
@import "tailwindcss";
@import "@heroui/styles";
```

3. **Use components:**
```tsx
"use client";

import { Button } from "@heroui/react";

export default function Page() {
  return <Button onPress={() => console.log("Clicked")}>Click me</Button>;
}
```

**Important:** Add `"use client"` directive for components with event handlers.

### Next.js Pages Router

1. **Install dependencies** (same as App Router)

2. **Create or update `pages/_app.tsx`:**
```tsx
import "@heroui/styles";
import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
```

3. **Create `styles/globals.css`:**
```css
@import "tailwindcss";
@import "@heroui/styles";
```

4. **Import in `_app.tsx`:**
```tsx
import "../styles/globals.css";
```

### Vite + React

1. **Install dependencies:**
```bash
npm install @heroui/react@beta @heroui/styles@beta tailwindcss@next @tailwindcss/vite
```

2. **Update `vite.config.ts`:**
```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

3. **Create or update `src/index.css`:**
```css
@import "tailwindcss";
@import "@heroui/styles";
```

4. **Import in `src/main.tsx`:**
```tsx
import "./index.css";
```

### Astro

1. **Install dependencies:**
```bash
npm install @heroui/react@beta @heroui/styles@beta tailwindcss@next @tailwindcss/vite
```

2. **Update `astro.config.mjs`:**
```js
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
```

3. **Create or update global CSS:**
```css
@import "tailwindcss";
@import "@heroui/styles";
```

4. **Use with client directives:**
```tsx
---
import { Button } from "@heroui/react";
---

<Button client:load onPress={() => console.log("Clicked")}>
  Click me
</Button>
```

## Critical CSS Import Order

**ALWAYS import Tailwind CSS before HeroUI styles:**

```css
/* ✅ Correct */
@import "tailwindcss";
@import "@heroui/styles";

/* ❌ Wrong */
@import "@heroui/styles";
@import "tailwindcss";
```

## TypeScript Support

HeroUI v3 includes full TypeScript support. No additional type packages needed.

```tsx
import { Button } from "@heroui/react";
import type { ButtonProps } from "@heroui/react";

const MyButton: React.FC<ButtonProps> = (props) => {
  return <Button {...props} />;
};
```

## Verification

After installation, verify it works:

```tsx
import { Button } from "@heroui/react";

export default function Test() {
  return <Button onPress={() => alert("HeroUI is working!")}>Test</Button>;
}
```

## Troubleshooting

### Components not rendering
- Check Tailwind CSS v4 is installed (not v3)
- Verify CSS import order (Tailwind first, then HeroUI)
- Ensure CSS file is imported in your app entry point

### Styling issues
- Verify Tailwind CSS v4 is properly configured
- Check that `@heroui/styles` is imported after Tailwind
- Ensure your build tool processes CSS correctly

### TypeScript errors
- Ensure React 18+ and TypeScript 5+
- Check that `@heroui/react` types are installed
- Verify `tsconfig.json` includes proper module resolution

## Next Steps

- See `references/components.md` for available components
- See `references/theme.md` for theme customization
- For detailed component docs, refer to the official documentation at https://v3.heroui.com/docs/components/{component-name}
  - The component name in url is kebab case (eg. `alert-dialog` or `checkbox-group`)

