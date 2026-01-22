/**
 * Convert component name from PascalCase or space-separated to kebab-case
 * Examples:
 * - "Button" → "button"
 * - "ButtonGroup" → "button-group"
 * - "DateField" → "date-field"
 * - "Alert Dialog" → "alert-dialog"
 * - "Scroll Shadow" → "scroll-shadow"
 * - "ComboBox" → "combobox" (special case - file is combobox.mdx, not combo-box.mdx)
 * - "ListBox" → "listbox" (special case - file is listbox.mdx, not list-box.mdx)
 * - "TextArea" → "textarea" (special case - file is textarea.mdx, not text-area.mdx)
 */
export function componentNameToKebab(name: string): string {
  const trimmed = name.trim();

  // Special case mappings for components that don't follow standard PascalCase-to-kebab conversion
  const specialCases: Record<string, string> = {
    ComboBox: "combobox",
    ListBox: "listbox",
    TextArea: "textarea",
  };

  if (specialCases[trimmed]) {
    return specialCases[trimmed];
  }

  return (
    trimmed
      // First, replace spaces with hyphens
      .replace(/\s+/g, "-")
      // Then convert PascalCase to kebab-case by adding hyphen before uppercase letters
      // (but not if it's already preceded by a hyphen)
      .replace(/([a-z])([A-Z])/g, "$1-$2")
      // Handle consecutive uppercase letters (e.g., "InputOTP" → "Input-OTP")
      .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
      // Convert to lowercase
      .toLowerCase()
      // Clean up any double hyphens (can occur if space was before uppercase)
      .replace(/-+/g, "-")
      // Remove leading hyphen if present (shouldn't happen after trim, but just in case)
      .replace(/^-/, "")
      // Remove trailing hyphen if present (shouldn't happen after trim, but just in case)
      .replace(/-$/, "")
  );
}
