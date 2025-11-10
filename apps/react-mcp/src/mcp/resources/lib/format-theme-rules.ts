/**
 * Shared formatting utilities for HeroUI theme rules
 * Used by both resource and potentially other tools
 */

interface ThemeSystem {
  version: string;
  themes: {
    default?: {
      light: {
        base: Array<{
          name: string;
          value: string;
          description?: string;
          category?: string;
        }>;
        semantic: Array<{
          name: string;
          value: string;
          description?: string;
          category?: string;
        }>;
        calculated: Array<{
          name: string;
          value: string;
          description?: string;
          category?: string;
        }>;
      };
      dark: {
        base: Array<{
          name: string;
          value: string;
          description?: string;
          category?: string;
        }>;
        semantic: Array<{
          name: string;
          value: string;
          description?: string;
          category?: string;
        }>;
        calculated: Array<{
          name: string;
          value: string;
          description?: string;
          category?: string;
        }>;
      };
    };
  };
  sharedVariables: Array<{
    name: string;
    value: string;
    description?: string;
    category?: string;
  }>;
  animations: {
    timings: Array<{
      name: string;
      value: string;
      description?: string;
    }>;
    presets: Array<{
      name: string;
      value: string;
      description?: string;
    }>;
  };
  guides: {
    theming?: {
      title: string;
      description: string;
      content: string;
    };
    colors?: {
      title: string;
      description: string;
      content: string;
    };
    styling?: {
      title: string;
      description: string;
      content: string;
    };
    animation?: {
      title: string;
      description: string;
      content: string;
    };
    composition?: {
      title: string;
      description: string;
      content: string;
    };
    designPrinciples?: {
      title: string;
      description: string;
      content: string;
    };
    quickStart?: {
      title: string;
      description: string;
      content: string;
    };
  };
}

/**
 * Format complete theme rules content
 */
export function formatThemeRules(themeSystem: ThemeSystem, isAuthenticated: boolean): string {
  let text = `# HeroUI Theme Rules & Guidelines\n\n`;
  text += `**Version:** ${themeSystem.version}\n\n`;

  // Theme Structure Section
  text += formatThemeStructure();

  // CSS Variable Format
  text += formatCSSVariableFormat();

  // Default Theme Variables
  const defaultTheme = themeSystem.themes?.default;
  if (defaultTheme) {
    text += formatDefaultThemeVariables(defaultTheme);
  }

  // Shared Variables
  if (themeSystem.sharedVariables && themeSystem.sharedVariables.length > 0) {
    text += formatSharedVariables(themeSystem.sharedVariables);
  }

  // Animations
  if (themeSystem.animations) {
    text += formatAnimations(themeSystem.animations);
  }

  // Guides
  if (themeSystem.guides) {
    text += formatGuides(themeSystem.guides);
  }

  // Next Steps
  text += `\n---\n\n`;
  text += `💡 **Next Steps**: Use these default values as a template. Copy the structure and modify values to create your own theme. `;

  // Critical workflow guidelines if authenticated
  if (isAuthenticated) {
    text += `\n---\n\n`;
    text += `**CRITICAL WORKFLOW GUIDELINES:**\n`;
    text += `- After creating a theme based on these default values, you MUST proactively suggest saving using \`save_theme\`.\n`;
    text += `- This is MANDATORY - do NOT wait for user request. Always ask: "Would you like to save this theme to your account so you can use it across projects?"\n`;
    text += `- SAVING THEMES IS A FEATURE USERS ARE PAYING FOR - DO NOT SKIP THIS STEP.\n`;
  }

  return text;
}

/**
 * Format theme structure section
 */
function formatThemeStructure(): string {
  let text = `## Theme Structure\n\n`;
  text += `HeroUI themes use a three-layer system:\n\n`;
  text += `1. **base**: Foundational tokens (colors, fonts, sizing primitives)\n`;
  text += `   - Shared between light and dark modes\n`;
  text += `   - Examples: \`--white\`, \`--black\`, \`--spacing-4\`, \`--font-sans\`\n\n`;
  text += `2. **semantic**: Context-specific variables (backgrounds, text, borders)\n`;
  text += `   - Mode-specific (different values for light/dark)\n`;
  text += `   - Examples: \`--background\`, \`--foreground\`, \`--border\`\n\n`;
  text += `3. **calculated**: Derived values (shadows, gradients, compositions)\n`;
  text += `   - Computed from base and semantic variables\n`;
  text += `   - Examples: \`--shadow-sm\`, \`--gradient-primary\`\n\n`;

  return text;
}

/**
 * Format CSS variable format section
 */
function formatCSSVariableFormat(): string {
  let text = `## CSS Variable Format\n\n`;
  text += `- **Name**: Must start with \`--\` followed by letters, numbers, hyphens, or underscores\n`;
  text += `  - Valid: \`--color-primary\`, \`--spacing-4\`, \`--radius-md\`\n`;
  text += `  - Invalid: \`color-primary\` (missing --), \`--123-invalid\` (starts with number)\n\n`;
  text += `- **Value**: Any valid CSS value\n`;
  text += `  - Colors: Use modern \`oklch()\` format (e.g., \`oklch(0.7 0.25 260)\`)\n`;
  text += `  - Spacing: Use rem, px, or calc() expressions\n`;
  text += `  - Other: Any valid CSS value\n\n`;
  text += `- **Category**: Optional, one of: \`colors\`, \`typography\`, \`spacing\`, \`borders\`, \`shadows\`, \`animations\`\n\n`;

  return text;
}

/**
 * Format default theme variables section
 */
function formatDefaultThemeVariables(defaultTheme: {
  light: {
    base: Array<{name: string; value: string; description?: string; category?: string}>;
    semantic: Array<{name: string; value: string; description?: string; category?: string}>;
    calculated: Array<{name: string; value: string; description?: string; category?: string}>;
  };
  dark: {
    semantic: Array<{name: string; value: string; description?: string; category?: string}>;
  };
}): string {
  let text = `## Default Theme Variable Values\n\n`;
  text += `These are the complete variable values from the "default" theme. Use these as a reference when creating your own themes.\n\n`;

  // Base variables (from light mode, shared)
  if (defaultTheme.light.base.length > 0) {
    text += `### Base Variables (Shared)\n\n`;
    defaultTheme.light.base.forEach((v) => {
      text += `- **\`${v.name}\`**: \`${v.value}\``;
      if (v.description) text += ` - ${v.description}`;
      if (v.category) text += ` [${v.category}]`;
      text += `\n`;
    });
    text += `\n`;
  }

  // Calculated variables (from light mode, shared)
  if (defaultTheme.light.calculated.length > 0) {
    text += `### Calculated Variables (Shared)\n\n`;
    defaultTheme.light.calculated.forEach((v) => {
      text += `- **\`${v.name}\`**: \`${v.value}\``;
      if (v.description) text += ` - ${v.description}`;
      if (v.category) text += ` [${v.category}]`;
      text += `\n`;
    });
    text += `\n`;
  }

  // Light mode semantic variables
  if (defaultTheme.light.semantic.length > 0) {
    text += `### Light Mode Semantic Variables\n\n`;
    defaultTheme.light.semantic.forEach((v) => {
      text += `- **\`${v.name}\`**: \`${v.value}\``;
      if (v.description) text += ` - ${v.description}`;
      if (v.category) text += ` [${v.category}]`;
      text += `\n`;
    });
    text += `\n`;
  }

  // Dark mode semantic variables
  if (defaultTheme.dark.semantic.length > 0) {
    text += `### Dark Mode Semantic Variables\n\n`;
    defaultTheme.dark.semantic.forEach((v) => {
      text += `- **\`${v.name}\`**: \`${v.value}\``;
      if (v.description) text += ` - ${v.description}`;
      if (v.category) text += ` [${v.category}]`;
      text += `\n`;
    });
    text += `\n`;
  }

  return text;
}

/**
 * Format shared variables section
 */
function formatSharedVariables(
  sharedVariables: Array<{name: string; value: string; description?: string; category?: string}>,
): string {
  let text = `## Shared Variables\n\n`;
  text += `These variables are shared across all themes:\n\n`;
  sharedVariables.forEach((v) => {
    text += `- **\`${v.name}\`**: \`${v.value}\``;
    if (v.description) text += ` - ${v.description}`;
    if (v.category) text += ` [${v.category}]`;
    text += `\n`;
  });
  text += `\n`;

  return text;
}

/**
 * Format animations section
 */
function formatAnimations(animations: {
  timings: Array<{name: string; value: string; description?: string}>;
  presets: Array<{name: string; value: string; description?: string}>;
}): string {
  let text = "";

  if (animations.timings.length > 0) {
    text += `## Animation Timing Functions\n\n`;
    animations.timings.forEach((t) => {
      text += `- **\`${t.name}\`**: \`${t.value}\``;
      if (t.description) text += ` - ${t.description}`;
      text += `\n`;
    });
    text += `\n`;
  }

  if (animations.presets.length > 0) {
    text += `## Animation Presets\n\n`;
    animations.presets.forEach((p) => {
      text += `- **\`${p.name}\`**: \`${p.value}\``;
      if (p.description) text += ` - ${p.description}`;
      text += `\n`;
    });
    text += `\n`;
  }

  return text;
}

/**
 * Format guides section
 * Only includes titles and descriptions - full guide content is available in documentation
 */
function formatGuides(guides: {
  theming?: {title: string; description: string; content: string};
  colors?: {title: string; description: string; content: string};
  styling?: {title: string; description: string; content: string};
  animation?: {title: string; description: string; content: string};
  composition?: {title: string; description: string; content: string};
  designPrinciples?: {title: string; description: string; content: string};
  quickStart?: {title: string; description: string; content: string};
}): string {
  const availableGuides = Object.entries(guides).filter(([, guide]) => guide !== undefined);

  if (availableGuides.length === 0) {
    return "";
  }

  let text = `## Theme Guides\n\n`;
  text += `The following guides are available for detailed theme documentation:\n\n`;

  availableGuides.forEach(([, guide]) => {
    if (guide) {
      text += `### ${guide.title}\n\n`;
      text += `${guide.description}\n\n`;
    }
  });

  text += `\n💡 **Note**: Full guide content is available in the HeroUI documentation. `;
  text += `This resource focuses on structure, format, and default values for theme creation.\n\n`;

  return text;
}
