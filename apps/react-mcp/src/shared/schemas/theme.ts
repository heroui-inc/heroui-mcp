/**
 * Theme Schema Validation
 *
 * Strict validation for HeroUI theme structure to ensure consistency
 * between stock themes (R2) and custom themes (Platform API).
 *
 * This schema enforces the ThemeDefinition structure for all themes.
 */

import {z} from "zod";

/**
 * CSS Variable Schema
 * Validates individual CSS custom properties
 */
export const CSSVariableSchema = z.object({
  name: z
    .string()
    .regex(
      /^--[a-zA-Z_][\w-]*$/,
      "CSS variable name must start with -- followed by a letter or underscore, then letters, numbers, hyphens, or underscores",
    )
    .describe("CSS variable name (e.g., '--color-primary', '--spacing-4')"),
  value: z.string().min(1, "Value is required and cannot be empty"),
  description: z.string().optional(),
  category: z
    .enum(["colors", "typography", "spacing", "borders", "shadows", "animations"])
    .optional(),
  computed: z.boolean().optional(),
});

/**
 * Theme Variables Schema
 * Organizes variables into three layers: base, semantic, calculated
 * All arrays are required but can be empty
 */
const ThemeVariablesSchema = z.object({
  base: z
    .array(CSSVariableSchema)
    .min(0)
    .describe("Base variables (foundational tokens like colors, fonts, sizing primitives)"),
  semantic: z
    .array(CSSVariableSchema)
    .min(0)
    .describe("Semantic variables (context-specific like backgrounds, text, borders)"),
  calculated: z
    .array(CSSVariableSchema)
    .min(0)
    .describe("Calculated variables (derived values like shadows, gradients, compositions)"),
});

/**
 * Theme Definition Schema
 * Complete theme structure with light and dark modes
 *
 * Note: Theme name is stored at the API request level, not in the theme data itself.
 * This eliminates redundancy and matches standard REST API patterns.
 */
export const ThemeDefinitionSchema = z.object({
  light: ThemeVariablesSchema,
  dark: ThemeVariablesSchema,
  components: z.string().optional(),
});

/**
 * Theme Data Input Schema
 * Accepts either a ThemeDefinition object or a JSON string
 * Validates and transforms to ThemeDefinition
 *
 * Note: Object branch must come first in union to avoid incorrect type coercion
 */
export const ThemeDataInputSchema = z.union([
  // Try object first (most common case from MCP clients)
  ThemeDefinitionSchema,
  // Try string second (for manual JSON string input)
  z.string().transform((str, ctx) => {
    try {
      const parsed = JSON.parse(str);

      return ThemeDefinitionSchema.parse(parsed);
    } catch (e) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          e instanceof Error
            ? e.message
            : "Invalid theme structure. Must be a valid JSON string matching ThemeDefinition format.",
      });

      return z.NEVER;
    }
  }),
]);

/**
 * Type Exports
 */
export type CSSVariable = z.infer<typeof CSSVariableSchema>;
export type ThemeVariables = z.infer<typeof ThemeVariablesSchema>;
export type ThemeDefinition = z.infer<typeof ThemeDefinitionSchema>;
export type ThemeDataInput = z.infer<typeof ThemeDataInputSchema>;

/**
 * Validation Helper Functions
 */

/**
 * Validate theme data and return parsed result
 * @throws {z.ZodError} if validation fails
 */
export function validateThemeData(data: unknown): ThemeDefinition {
  return ThemeDefinitionSchema.parse(data);
}

/**
 * Check if data is valid theme data without throwing
 */
export function isValidThemeData(data: unknown): data is ThemeDefinition {
  return ThemeDefinitionSchema.safeParse(data).success;
}

/**
 * Parse and validate theme data input (string or object)
 * @throws {z.ZodError} if validation fails
 */
export function parseThemeDataInput(input: unknown): ThemeDefinition {
  return ThemeDataInputSchema.parse(input);
}
