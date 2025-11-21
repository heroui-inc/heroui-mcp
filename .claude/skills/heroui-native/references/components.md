# HeroUI Native Components List

**Version:** v1.0.0-beta.3 (Beta)

⚠️ **Version Notice:**
- This is HeroUI Native BETA - for React Native mobile applications
- Requires React Native with Expo SDK 53+ or React Native CLI
- Uses compound components pattern
- Requires NativeWind v4.2.1 (exact version)

## Available Components (23 total)

### Form Components
- **TextField** - Text input with label, description, and error handling
- **FormField** - Form field wrapper with validation
- **Checkbox** - Single checkbox input
- **RadioGroup** - Radio button group selection
- **Switch** - Toggle switch input
- **Select** - Dropdown selection component

### Layout Components
- **Card** - Card container with header, body, and footer sections
- **Surface** - Surface container component
- **Divider** - Visual divider component
- **Tabs** - Tabbed navigation component
- **ScrollShadow** - Scrollable container with shadow effects

### Interactive Components
- **Button** - Interactive button with multiple variants
- **PressableFeedback** - Pressable component with feedback effects
- **Accordion** - Expandable accordion component
- **Popover** - Popover container component
- **Dialog** - Modal dialog component

### Feedback Components
- **Spinner** - Loading spinner component
- **Skeleton** - Loading skeleton placeholder
- **SkeletonGroup** - Group of skeleton loaders
- **ErrorView** - Error display component

### Data Display
- **Avatar** - User avatar component
- **Chip** - Tag/chip component
- **DropShadowView** - View with drop shadow effect

## Component Details

For detailed component docs, refer to the official GitHub documentation at https://github.com/heroui-inc/heroui-native/blob/beta/src/components/{component-name}/{component-name}.md

The component name in the URL is kebab-case (e.g., `text-field`, `radio-group`). For example:
- Button: https://github.com/heroui-inc/heroui-native/blob/beta/src/components/button/button.md
- TextField: https://github.com/heroui-inc/heroui-native/blob/beta/src/components/text-field/text-field.md
- Card: https://github.com/heroui-inc/heroui-native/blob/beta/src/components/card/card.md

## Import Pattern

```tsx
import { ComponentName } from 'heroui-native';
```

Example:
```tsx
import { Button, Card, TextField } from 'heroui-native';
```

## Component Architecture

All HeroUI Native components use **compound component patterns**. Components are structured hierarchically:

```tsx
<Card>
  <Card.Header>
    <Card.Title>Title</Card.Title>
    <Card.Description>Description</Card.Description>
  </Card.Header>
  <Card.Body>
    <Text>Content</Text>
  </Card.Body>
  <Card.Footer>
    <Button onPress={handlePress}>Action</Button>
  </Card.Footer>
</Card>
```

**Important:** Do NOT use flat props like `<Card title="...">` - compound components are required.

## Styling

All components use `className` prop for styling via NativeWind:

```tsx
<Card className="rounded-lg">
  <Card.Body className="p-4 gap-2">
    <Text className="text-foreground text-lg">Content</Text>
  </Card.Body>
</Card>
```

## Provider Required

Unlike HeroUI v3 React, HeroUI Native REQUIRES a Provider wrapper:

```tsx
import { HeroUINativeProvider } from 'heroui-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

<GestureHandlerRootView style={{flex: 1}}>
  <HeroUINativeProvider>
    {/* Your components */}
  </HeroUINativeProvider>
</GestureHandlerRootView>
```

