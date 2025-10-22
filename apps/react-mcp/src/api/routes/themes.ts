/* eslint-disable @typescript-eslint/no-explicit-any */
import type {Env} from "../types";

import {Hono} from "hono";

import {getAnalytics, getThemeService, initAnalytics} from "../services";

const themes = new Hono<{Bindings: Env}>();

// Get themes system
themes.get("/", async (c) => {
  const version = c.req.query("version");
  const startTime = Date.now();
  initAnalytics(c.env);
  const analytics = getAnalytics();

  try {
    const service = await getThemeService(c.env);
    const themeSystem = await service.getThemeSystem(version);

    if (!themeSystem) {
      return c.json(
        {error: `Theme system not available${version ? ` for version ${version}` : ""}`},
        404,
      );
    }

    // Get the latest version if not specified
    const latestVersion = await service.getLatestVersion();
    const actualVersion = version || latestVersion || "latest";

    const responseTime = Date.now() - startTime;

    analytics?.trackFeatureUsage("api-user", "theme-system", {
      endpoint: "full",
      version: actualVersion,
      responseTime,
    });

    return c.json({
      ...themeSystem,
      requestedVersion: version,
      actualVersion,
      latestVersion,
    });
  } catch (error) {
    console.error("Error getting theme system:", error);

    return c.json(
      {
        error: "Failed to get theme system",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

// Get theme variables
themes.get("/variables", async (c) => {
  const themeName = c.req.query("theme");
  const mode = c.req.query("mode") as "light" | "dark" | undefined;
  const version = c.req.query("version");
  const startTime = Date.now();

  initAnalytics(c.env);
  const analytics = getAnalytics();

  try {
    const service = await getThemeService(c.env);
    const latestVersion = await service.getLatestVersion();
    const actualVersion = version || latestVersion || "latest";

    // If specific theme is requested
    if (themeName) {
      if (mode) {
        // Get specific mode variables
        const variables = await service.getThemeVariables(themeName, mode, version);
        if (!variables) {
          return c.json(
            {error: `Theme ${themeName} not found${version ? ` for version ${version}` : ""}`},
            404,
          );
        }

        const responseTime = Date.now() - startTime;
        analytics?.trackFeatureUsage("api-user", "theme-variables", {
          theme: themeName,
          mode,
          version: actualVersion,
          responseTime,
        });

        return c.json({
          theme: themeName,
          mode,
          variables,
          version: actualVersion,
          latestVersion,
        });
      } else {
        // Get both light and dark for specific theme
        const themeData = await service.getTheme(themeName, version);
        if (!themeData) {
          return c.json(
            {error: `Theme ${themeName} not found${version ? ` for version ${version}` : ""}`},
            404,
          );
        }

        const responseTime = Date.now() - startTime;
        analytics?.trackFeatureUsage("api-user", "theme-variables", {
          theme: themeName,
          mode: "both",
          version: actualVersion,
          responseTime,
        });

        // Check if optimized structure exists
        const optimized = (themeData as any).optimized;
        if (optimized) {
          // Return optimized structure with common variables extracted
          return c.json({
            theme: themeName,
            common: optimized.common,
            light: optimized.light,
            dark: optimized.dark,
            version: actualVersion,
            latestVersion,
          });
        }

        // Fallback: Create optimized structure from standard format
        // Extract common base and calculated from light mode
        const common = {
          base: themeData.light.base,
          calculated: themeData.light.calculated,
        };

        return c.json({
          theme: themeName,
          common,
          light: {
            semantic: themeData.light.semantic,
          },
          dark: {
            semantic: themeData.dark.semantic,
          },
          version: actualVersion,
          latestVersion,
        });
      }
    } else {
      // No specific theme requested - return all themes
      const availableThemes = await service.getAvailableThemes(version);
      const themes = [];

      for (const name of availableThemes) {
        const themeData = await service.getTheme(name, version);
        if (themeData) {
          // Check if optimized structure exists
          const optimized = (themeData as any).optimized;
          if (optimized) {
            themes.push({
              theme: name,
              common: optimized.common,
              light: optimized.light,
              dark: optimized.dark,
            });
          } else {
            // Fallback: Create optimized structure from standard format
            const common = {
              base: themeData.light.base,
              calculated: themeData.light.calculated,
            };

            themes.push({
              theme: name,
              common,
              light: {
                semantic: themeData.light.semantic,
              },
              dark: {
                semantic: themeData.dark.semantic,
              },
            });
          }
        }
      }

      const responseTime = Date.now() - startTime;
      analytics?.trackFeatureUsage("api-user", "theme-variables", {
        theme: "all",
        mode: "both",
        version: actualVersion,
        responseTime,
        themesCount: themes.length,
      });

      return c.json({
        themes,
        count: themes.length,
        version: actualVersion,
        latestVersion,
      });
    }
  } catch (error) {
    console.error("Error getting theme variables:", error);

    return c.json(
      {
        error: "Failed to get theme variables",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

// Get colors
themes.get("/colors", async (c) => {
  const themeName = c.req.query("theme");
  const mode = c.req.query("mode") as "light" | "dark" | undefined;
  const version = c.req.query("version");
  const startTime = Date.now();

  initAnalytics(c.env);
  const analytics = getAnalytics();

  try {
    const service = await getThemeService(c.env);
    const latestVersion = await service.getLatestVersion();
    const actualVersion = version || latestVersion || "latest";

    // If specific theme is requested
    if (themeName) {
      if (mode) {
        // Specific mode requested - return only that mode
        const variables = await service.getThemeVariables(themeName, mode, version);

        if (!variables) {
          return c.json(
            {error: `Theme ${themeName} not found${version ? ` for version ${version}` : ""}`},
            404,
          );
        }

        // Filter for color variables
        const colorVars = [...variables.semantic, ...variables.base].filter(
          (v) =>
            v.category === "colors" ||
            v.name.includes("color") ||
            v.name.includes("accent") ||
            v.name.includes("success") ||
            v.name.includes("warning") ||
            v.name.includes("danger"),
        );

        const responseTime = Date.now() - startTime;
        analytics?.trackFeatureUsage("api-user", "theme-colors", {
          theme: themeName,
          mode,
          version: actualVersion,
          responseTime,
          colorsCount: colorVars.length,
        });

        return c.json({
          theme: themeName,
          mode,
          colors: colorVars,
          version: actualVersion,
          latestVersion,
        });
      } else {
        // No mode specified - return both light and dark colors
        const lightVars = await service.getThemeVariables(themeName, "light", version);
        const darkVars = await service.getThemeVariables(themeName, "dark", version);

        if (!lightVars || !darkVars) {
          return c.json(
            {error: `Theme ${themeName} not found${version ? ` for version ${version}` : ""}`},
            404,
          );
        }

        // Filter for color variables
        const lightColors = [...lightVars.semantic, ...lightVars.base].filter(
          (v) =>
            v.category === "colors" ||
            v.name.includes("color") ||
            v.name.includes("accent") ||
            v.name.includes("success") ||
            v.name.includes("warning") ||
            v.name.includes("danger"),
        );

        const darkColors = [...darkVars.semantic, ...darkVars.base].filter(
          (v) =>
            v.category === "colors" ||
            v.name.includes("color") ||
            v.name.includes("accent") ||
            v.name.includes("success") ||
            v.name.includes("warning") ||
            v.name.includes("danger"),
        );

        const responseTime = Date.now() - startTime;
        analytics?.trackFeatureUsage("api-user", "theme-colors", {
          theme: themeName,
          mode: "both",
          version: actualVersion,
          responseTime,
          lightColorsCount: lightColors.length,
          darkColorsCount: darkColors.length,
        });

        return c.json({
          theme: themeName,
          light: lightColors,
          dark: darkColors,
          version: actualVersion,
          latestVersion,
        });
      }
    } else {
      // No specific theme requested - return all themes' colors
      const availableThemes = await service.getAvailableThemes(version);
      const themes = [];

      for (const name of availableThemes) {
        if (mode) {
          // Specific mode requested for all themes
          const variables = await service.getThemeVariables(name, mode, version);
          if (variables) {
            // Filter for color variables
            const colorVars = [...variables.semantic, ...variables.base].filter(
              (v) =>
                v.category === "colors" ||
                v.name.includes("color") ||
                v.name.includes("accent") ||
                v.name.includes("success") ||
                v.name.includes("warning") ||
                v.name.includes("danger"),
            );

            themes.push({
              theme: name,
              mode,
              colors: colorVars,
            });
          }
        } else {
          // No mode specified - return both light and dark for all themes
          const lightVars = await service.getThemeVariables(name, "light", version);
          const darkVars = await service.getThemeVariables(name, "dark", version);

          if (lightVars && darkVars) {
            // Filter for color variables
            const lightColors = [...lightVars.semantic, ...lightVars.base].filter(
              (v) =>
                v.category === "colors" ||
                v.name.includes("color") ||
                v.name.includes("accent") ||
                v.name.includes("success") ||
                v.name.includes("warning") ||
                v.name.includes("danger"),
            );

            const darkColors = [...darkVars.semantic, ...darkVars.base].filter(
              (v) =>
                v.category === "colors" ||
                v.name.includes("color") ||
                v.name.includes("accent") ||
                v.name.includes("success") ||
                v.name.includes("warning") ||
                v.name.includes("danger"),
            );

            themes.push({
              theme: name,
              light: lightColors,
              dark: darkColors,
            });
          }
        }
      }

      const responseTime = Date.now() - startTime;
      analytics?.trackFeatureUsage("api-user", "theme-colors", {
        theme: "all",
        mode: mode || "both",
        version: actualVersion,
        responseTime,
        themesCount: themes.length,
      });

      return c.json({
        themes,
        count: themes.length,
        version: actualVersion,
        latestVersion,
      });
    }
  } catch (error) {
    console.error("Error getting colors:", error);

    return c.json(
      {
        error: "Failed to get colors",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

// Get available versions
themes.get("/versions", async (c) => {
  const startTime = Date.now();
  initAnalytics(c.env);
  const analytics = getAnalytics();

  try {
    const service = await getThemeService(c.env);
    const latestVersion = await service.getLatestVersion();

    const responseTime = Date.now() - startTime;
    analytics?.trackFeatureUsage("api-user", "theme-versions", {
      responseTime,
    });

    // For now, we only return the latest version
    // In the future, this could list all available versions from R2
    return c.json({
      latest: latestVersion,
      versions: [latestVersion],
    });
  } catch (error) {
    console.error("Error getting theme versions:", error);

    return c.json(
      {
        error: "Failed to get theme versions",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

// Get animations
themes.get("/animations", async (c) => {
  const version = c.req.query("version");
  const startTime = Date.now();
  initAnalytics(c.env);
  const analytics = getAnalytics();

  try {
    const service = await getThemeService(c.env);
    const latestVersion = await service.getLatestVersion();
    const actualVersion = version || latestVersion || "latest";
    const animations = await service.getAnimations(version);

    if (!animations) {
      return c.json(
        {error: `Animations not available${version ? ` for version ${version}` : ""}`},
        404,
      );
    }

    const responseTime = Date.now() - startTime;
    analytics?.trackFeatureUsage("api-user", "theme-animations", {
      version: actualVersion,
      responseTime,
    });

    return c.json({
      ...animations,
      version: actualVersion,
      latestVersion,
    });
  } catch (error) {
    console.error("Error getting animations:", error);

    return c.json(
      {
        error: "Failed to get animations",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

export {themes};
