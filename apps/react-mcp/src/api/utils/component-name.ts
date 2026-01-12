/**
 * Convert component name from PascalCase to kebab-case
 * Examples:
 * - "Button" → "button"
 * - "ButtonGroup" → "button-group"
 * - "DateField" → "date-field"
 */
export function componentNameToKebab(name: string): string {
  return name
    .replace(/([A-Z])/g, "-$1")
    .toLowerCase()
    .replace(/^-/, "");
}
