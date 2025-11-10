/**
 * Format Theme Validation Errors
 *
 * Transforms technical Zod validation errors into human-friendly,
 * actionable error messages for AI agents and developers.
 */

import {z} from "zod";

/**
 * Format a Zod validation error into an actionable error message
 */
export function formatThemeValidationError(error: unknown): string {
  if (!(error instanceof z.ZodError)) {
    return error instanceof Error ? error.message : "Unknown validation error";
  }

  const issues = error.issues;

  // Check for common error patterns and provide targeted guidance

  // Pattern 1: Missing required arrays (base, semantic, calculated)
  const missingArrays = issues.filter(
    (i) =>
      i.code === "invalid_type" &&
      (i.path.includes("base") || i.path.includes("semantic") || i.path.includes("calculated")),
  );
  if (missingArrays.length > 0) {
    const paths = missingArrays.map((i) => i.path.join(".")).join(", ");

    return `❌ Theme Structure Error: Missing required arrays

Problem: Required arrays are missing: ${paths}

Expected structure:
{
  "light": {
    "base": [],       ← Required (can be empty array)
    "semantic": [],   ← Required (can be empty array)
    "calculated": []  ← Required (can be empty array)
  },
  "dark": {
    "base": [],
    "semantic": [],
    "calculated": []
  }
}

Quick Fix:
Ensure all three arrays (base, semantic, calculated) exist in both light and dark modes.
They can be empty arrays [] if you don't have variables for that category.

💡 Need help? Call get_theme_info(theme="default") to see a complete example.`;
  }

  // Pattern 2: Null values instead of arrays
  const nullArrays = issues.filter(
    (i) =>
      i.code === "invalid_type" &&
      i.received === "null" &&
      (i.path.includes("base") || i.path.includes("semantic") || i.path.includes("calculated")),
  );
  if (nullArrays.length > 0) {
    const paths = nullArrays.map((i) => i.path.join(".")).join(", ");

    return `❌ Theme Structure Error: Arrays cannot be null

Problem: Arrays are set to null instead of empty arrays: ${paths}

❌ Wrong:
{
  "light": {
    "base": null,      ← Cannot be null
    "semantic": null,  ← Cannot be null
    "calculated": null ← Cannot be null
  }
}

✅ Correct:
{
  "light": {
    "base": [],       ← Use empty array []
    "semantic": [],   ← Use empty array []
    "calculated": []  ← Use empty array []
  }
}

Quick Fix:
Replace all null values with empty arrays [].`;
  }

  // Pattern 3: Invalid CSS variable name
  const invalidVarName = issues.find(
    (i) => i.code === "invalid_string" && i.path[i.path.length - 1] === "name",
  );
  if (invalidVarName) {
    return `❌ Invalid CSS Variable Name

Problem: CSS variable name doesn't match the required format.

${invalidVarName.message}

Valid examples:
✅ "--color-primary"
✅ "--font-size-lg"
✅ "--spacing-4"
✅ "--_private-var" (underscore allowed after --)

Invalid examples:
❌ "color-primary"  (missing --)
❌ "--color primary"  (contains space)
❌ "--123color"  (cannot start with number after --)
❌ "--color-primary!"  (contains special character)

Rules:
- Must start with --
- After --, first character must be a letter or underscore
- Can contain letters, numbers, hyphens, and underscores
- No spaces or special characters

Quick Fix:
Ensure all variable names start with -- followed by a letter or underscore, then only letters, numbers, hyphens, and underscores.`;
  }

  // Pattern 4: Invalid union (trying both object and string)
  const unionError = issues.find((i) => i.code === "invalid_union");
  if (unionError) {
    return `❌ Theme Data Format Error

Problem: Theme data doesn't match expected structure.

Expected structure:
{
  "light": {
    "base": [
      {"name": "--variable-name", "value": "css-value"}
    ],
    "semantic": [],
    "calculated": []
  },
  "dark": {
    "base": [],
    "semantic": [],
    "calculated": []
  }
}

Common mistakes:
1. Including "name" field in themeData (it should only be at request level)
   ❌ Wrong: { "light": {...}, "name": "My Theme" }
   ✅ Correct: { "light": {...} } (name is separate parameter)

2. Missing required arrays (base, semantic, calculated)
   ❌ Wrong: { "light": { "base": [] } } (missing semantic and calculated)
   ✅ Correct: { "light": { "base": [], "semantic": [], "calculated": [] } }

3. Invalid variable format (must have "name" and "value" fields)
   ❌ Wrong: { "base": [{ "var": "--color", "val": "red" }] }
   ✅ Correct: { "base": [{ "name": "--color", "value": "red" }] }

4. Using null instead of empty arrays
   ❌ Wrong: { "base": null }
   ✅ Correct: { "base": [] }

💡 Pro tip: Call get_theme_info(theme="default") and copy the themeData structure.`;
  }

  // Pattern 5: Empty or missing value
  const emptyValue = issues.find(
    (i) =>
      (i.code === "too_small" || i.code === "invalid_type") &&
      i.path[i.path.length - 1] === "value",
  );
  if (emptyValue) {
    return `❌ Invalid Variable Value

Problem: Variable value cannot be empty.

${emptyValue.message}

Each variable must have:
- name: CSS variable name (e.g., "--color-primary")
- value: Non-empty CSS value (e.g., "oklch(0.7 0.25 260)", "#ff5500", "16px")

Valid example:
{
  "name": "--color-accent",
  "value": "oklch(0.7 0.25 260)",
  "description": "Primary accent color"
}

Invalid example:
{
  "name": "--color-accent",
  "value": "",  ← Empty value not allowed
}`;
  }

  // Pattern 6: Invalid category
  const invalidCategory = issues.find(
    (i) => i.code === "invalid_enum_value" && i.path[i.path.length - 1] === "category",
  );
  if (invalidCategory && "options" in invalidCategory) {
    const validOptions = (invalidCategory.options as string[]).join('", "');

    return `❌ Invalid Category

Problem: Category must be one of the predefined options.

${invalidCategory.message}

Valid categories: "${validOptions}"

Example:
{
  "name": "--color-primary",
  "value": "oklch(0.7 0.25 260)",
  "category": "colors"  ← Must be one of the valid options
}

Note: Category is optional. You can omit it if you're unsure.`;
  }

  // Default: Return formatted Zod error with general guidance
  const errorDetails = issues
    .map((issue) => {
      const path = issue.path.length > 0 ? `at ${issue.path.join(".")}` : "";

      return `  • ${issue.message} ${path}`;
    })
    .join("\n");

  return `❌ Theme Validation Error

${errorDetails}

Expected structure:
{
  "light": {
    "base": [],
    "semantic": [],
    "calculated": []
  },
  "dark": {
    "base": [],
    "semantic": [],
    "calculated": []
  }
}

Each variable needs:
- name: string starting with -- (required)
- value: non-empty string (required)
- description: string (optional but recommended)
- category: "colors"|"typography"|"spacing"|"borders"|"shadows"|"animations" (optional)

Common mistakes to avoid:
- Using null instead of [] for arrays
- Missing required arrays (base, semantic, calculated)
- Invalid CSS variable names (must start with --)
- Empty or missing values
- Including "name" at themeData level (it's only at request level)

💡 Get help:
- Call get_theme_info(theme="default") to see a complete working example
- Check that you're not including "name" at the themeData level (it's only at request level)
- Ensure all arrays use [] not null or undefined`;
}
