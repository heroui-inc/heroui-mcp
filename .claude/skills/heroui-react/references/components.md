# HeroUI v3 Components List

**Version:** v3.0.0-beta.2 (Beta)

⚠️ **Version Notice:**
- This is HeroUI v3 BETA - NOT v2
- Migration from v2 not supported yet (coming with v3 stable)
- v3 uses compound components (different from v2)

## Available Components (40 total)

### Form Components
- **TextField** - Text input with label and validation
- **TextArea** - Multi-line text input
- **Input** - Basic text input
- **InputGroup** - Input with addons
- **InputOTP** - One-time password input
- **NumberField** - Numeric input with controls
- **Select** - Dropdown selection
- **Checkbox** - Single checkbox
- **CheckboxGroup** - Group of checkboxes
- **RadioGroup** - Radio button group
- **Switch** - Toggle switch
- **Form** - Form container
- **Fieldset** - Form field grouping
- **Label** - Form label
- **FieldError** - Error message display

### Layout Components
- **Card** - Content container with header/footer
- **Surface** - Surface container
- **Separator** - Visual divider
- **Tabs** - Tabbed navigation

### Interactive Components
- **Button** - Clickable button with variants
- **CloseButton** - Close/dismiss button
- **Link** - Navigation link
- **Disclosure** - Expandable content
- **DisclosureGroup** - Group of disclosures
- **Accordion** - Accordion component

### Feedback Components
- **Alert** - Alert message
- **Alert Dialog** - Modal alert dialog
- **Skeleton** - Loading placeholder
- **Spinner** - Loading spinner
- **Tooltip** - Hover tooltip

### Navigation Components
- **ListBox** - List selection
- **ComboBox** - Autocomplete input
- **Dropdown** - Dropdown menu
- **Popover** - Popover container
- **Modal** - Modal dialog

### Data Display
- **Avatar** - User avatar
- **Chip** - Tag/chip component
- **Description** - Description text
- **Kbd** - Keyboard key display

## Component Details

For detailed component docs, refer to the official documentation at https://v3.heroui.com/docs/components/{component-name}
The component name in url is kebab case (eg. `alert-dialog` or `checkbox-group`)

## Import Pattern

```tsx
import { ComponentName } from "@heroui/react";
```

Example:
```tsx
import { Button, Card, TextField } from "@heroui/react";
```

## Component Architecture

All HeroUI v3 components use **compound component patterns**. Components are structured hierarchically:

```tsx
<Card>
  <Card.Header>
    <Card.Title>Title</Card.Title>
    <Card.Description>Description</Card.Description>
  </Card.Header>
  <Card.Content>Content</Card.Content>
</Card>
```

**Important:** Do NOT use flat props like `<Card title="...">` - this is v2 syntax and not supported in v3.

