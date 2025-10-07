/**
 * Parser for HeroUI Native theme documentation
 */

export interface ThemeColor {
  name: string;
  description: string;
  usage: string;
}

export interface ThemeUtility {
  name: string;
  values: string[];
  description: string;
}

export interface NativeThemeDefinition {
  description: string;
  colors: {
    semantic: ThemeColor[];
    status: ThemeColor[];
    surface: ThemeColor[];
  };
  utilities: {
    borderRadius: ThemeUtility;
    opacity: ThemeUtility;
  };
  configuration: {
    colorScheme: string[];
    examples: Array<{
      name: string;
      code: string;
    }>;
  };
}

export class ThemeParser {
  /**
   * Parse theme documentation and extract theme definition
   */
  parseContent(content: string): NativeThemeDefinition {
    const description = this.extractDescription(content);
    const colors = this.extractColors(content);
    const utilities = this.extractUtilities(content);
    const configuration = this.extractConfiguration(content);

    return {
      description,
      colors,
      utilities,
      configuration,
    };
  }

  private extractDescription(content: string): string {
    const overviewMatch = content.match(/##\s+Overview[\s\S]*?(?=##)/);
    if (overviewMatch) {
      const lines = overviewMatch[0].split('\n')
        .filter(line => !line.startsWith('#'))
        .filter(line => line.trim())
        .slice(0, 2);
      return lines.join(' ');
    }
    return 'HeroUI Native theme system provides comprehensive theming with semantic colors and utilities';
  }

  private extractColors(content: string): NativeThemeDefinition['colors'] {
    const colors = {
      semantic: [] as ThemeColor[],
      status: [] as ThemeColor[],
      surface: [] as ThemeColor[],
    };

    // Extract color examples from NativeWind Classes section
    const classesSection = content.match(/###\s+NativeWind Classes[\s\S]*?(?=###|\n##|$)/);
    if (classesSection) {
      const lines = classesSection[0].split('\n');

      for (const line of lines) {
        if (line.includes('bg-') || line.includes('text-')) {
          // Semantic colors
          if (line.includes('background') || line.includes('panel') || line.includes('border')) {
            const match = line.match(/<\w+\s+className="([\w-]+)"\s*\/>/);
            if (match) {
              const colorName = match[1].replace('bg-', '').replace('text-', '');
              colors.semantic.push({
                name: colorName,
                description: this.getColorDescription(colorName),
                usage: match[1],
              });
            }
          }

          // Status colors
          if (line.match(/success|warning|danger|info/)) {
            const match = line.match(/className="([\w-]+)"/);
            if (match) {
              const colorName = match[1].replace('bg-', '');
              if (!colors.status.find(c => c.name === colorName)) {
                colors.status.push({
                  name: colorName,
                  description: this.getColorDescription(colorName),
                  usage: match[1],
                });
              }
            }
          }

          // Surface levels
          if (line.includes('surface-')) {
            const match = line.match(/bg-surface-(\d)/);
            if (match) {
              colors.surface.push({
                name: `surface-${match[1]}`,
                description: `Surface level ${match[1]} for layered UI`,
                usage: `bg-surface-${match[1]}`,
              });
            }
          }
        }
      }
    }

    // Add core semantic colors
    if (colors.semantic.length === 0) {
      colors.semantic = [
        { name: 'background', description: 'Main background color', usage: 'bg-background' },
        { name: 'foreground', description: 'Main foreground text color', usage: 'text-foreground' },
        { name: 'accent', description: 'Primary accent color', usage: 'bg-accent' },
        { name: 'accent-soft', description: 'Soft variant of accent', usage: 'bg-accent-soft' },
      ];
    }

    return colors;
  }

  private extractUtilities(content: string): NativeThemeDefinition['utilities'] {
    const utilities = {
      borderRadius: {
        name: 'borderRadius',
        values: [] as string[],
        description: 'Border radius utilities',
      },
      opacity: {
        name: 'opacity',
        values: [] as string[],
        description: 'Opacity utilities',
      },
    };

    // Extract border radius utilities
    const radiusMatches = content.matchAll(/rounded-(xs|sm|md|lg|xl)/g);
    const radiusSet = new Set<string>();
    for (const match of radiusMatches) {
      radiusSet.add(`rounded-${match[1]}`);
    }
    utilities.borderRadius.values = Array.from(radiusSet);

    // Extract opacity utilities
    if (content.includes('opacity-disabled')) {
      utilities.opacity.values = ['opacity-disabled'];
    }

    return utilities;
  }

  private extractConfiguration(content: string): NativeThemeDefinition['configuration'] {
    const configuration = {
      colorScheme: ['light', 'dark', 'system'],
      examples: [] as Array<{ name: string; code: string }>,
    };

    // Extract configuration examples
    const configMatches = content.matchAll(/```tsx\n<HeroUINativeProvider[\s\S]*?```/g);
    let index = 0;
    for (const match of configMatches) {
      const code = match[0].replace(/```tsx\n/, '').replace(/\n```/, '');
      configuration.examples.push({
        name: `config-example-${++index}`,
        code,
      });
    }

    return configuration;
  }

  private getColorDescription(colorName: string): string {
    const descriptions: Record<string, string> = {
      background: 'Main background color of the app',
      foreground: 'Main text color',
      panel: 'Panel background color',
      border: 'Border color for components',
      surface: 'Surface color for cards and modals',
      'surface-foreground': 'Text color on surface backgrounds',
      accent: 'Primary accent color for interactive elements',
      'accent-soft': 'Soft variant of accent color',
      'accent-foreground': 'Text color on accent backgrounds',
      success: 'Success state color',
      warning: 'Warning state color',
      danger: 'Error/danger state color',
      info: 'Information state color',
    };

    return descriptions[colorName] || `${colorName} color`;
  }
}