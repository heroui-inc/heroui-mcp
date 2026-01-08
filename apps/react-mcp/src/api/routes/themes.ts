/* eslint-disable @typescript-eslint/no-explicit-any */
import type {HonoContext} from "../types/context";

import {Hono} from "hono";

import {getThemeService} from "../services/theme";
import {AnalyticsErrorEvent, AnalyticsEvent} from "../types/analytics";

const themes = new Hono<HonoContext>();

// Get themes system
themes.get("/", async (c) => {
  const endpoint = "get-themes";
  const startTime = Date.now();
  const analytics = c.get("analytics");

  try {
    const service = await getThemeService(c.env);
    const themeSystem = await service.getThemeSystem();

    if (!themeSystem) {
      analytics.trackError({
        error: "Theme system not found",
        errorEvent: AnalyticsErrorEvent.GET_THEMES_ERROR,
        properties: {
          endpoint,
          responseTime: Date.now() - startTime,
        },
      });

      return c.json({error: "Theme system not available"}, 404);
    }

    const latestVersion = await service.getLatestVersion();

    analytics.track({
      event: AnalyticsEvent.GET_THEMES,
      properties: {
        endpoint,
        latestVersion,
        themesCount: themeSystem.themes ? Object.keys(themeSystem.themes).length : 0,
        responseTime: Date.now() - startTime,
      },
    });

    return c.json({
      version: latestVersion || themeSystem.version || "latest",
      themes: themeSystem.themes ? Object.keys(themeSystem.themes) : [],
      latestVersion,
    });
  } catch (error) {
    analytics.trackError({
      error,
      errorEvent: AnalyticsErrorEvent.GET_THEMES_ERROR,
      fallbackMessage: "Failed to get theme system",
      properties: {
        endpoint,
        responseTime: Date.now() - startTime,
      },
    });

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
  const endpoint = "get-theme-variables";
  const startTime = Date.now();
  const analytics = c.get("analytics");

  let themeName: string | undefined;
  let mode: "light" | "dark" | undefined;

  try {
    themeName = c.req.query("theme");
    mode = c.req.query("mode") as "light" | "dark" | undefined;

    const service = await getThemeService(c.env);
    const latestVersion = await service.getLatestVersion();

    if (themeName) {
      if (mode) {
        const variables = await service.getThemeVariables(themeName, mode);
        if (!variables) {
          return c.json({error: `Theme ${themeName} not found`}, 404);
        }

        analytics.track({
          event: AnalyticsEvent.GET_THEME_VARIABLES,
          properties: {
            endpoint,
            theme: themeName,
            mode,
            latestVersion,
            responseTime: Date.now() - startTime,
          },
        });

        return c.json({
          theme: themeName,
          mode,
          variables,
          latestVersion,
        });
      } else {
        const themeData = await service.getTheme(themeName);
        if (!themeData) {
          return c.json({error: `Theme ${themeName} not found`}, 404);
        }

        analytics.track({
          event: AnalyticsEvent.GET_THEME_VARIABLES,
          properties: {
            endpoint,
            theme: themeName,
            mode: "both",
            latestVersion,
            responseTime: Date.now() - startTime,
          },
        });

        const optimized = (themeData as any).optimized;
        if (optimized) {
          return c.json({
            theme: themeName,
            common: optimized.common,
            light: optimized.light,
            dark: optimized.dark,
            latestVersion,
          });
        }

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
          latestVersion,
        });
      }
    } else {
      const availableThemes = await service.getAvailableThemes();
      const themes = [];

      for (const name of availableThemes) {
        const themeData = await service.getTheme(name);
        if (themeData) {
          const optimized = (themeData as any).optimized;
          if (optimized) {
            themes.push({
              theme: name,
              common: optimized.common,
              light: optimized.light,
              dark: optimized.dark,
            });
          } else {
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

      analytics.track({
        event: AnalyticsEvent.GET_THEME_VARIABLES,
        properties: {
          endpoint,
          theme: "all",
          mode: "both",
          latestVersion,
          themesCount: themes.length,
          responseTime: Date.now() - startTime,
        },
      });

      return c.json({
        themes,
        count: themes.length,
        latestVersion,
      });
    }
  } catch (error) {
    analytics.trackError({
      error,
      errorEvent: AnalyticsErrorEvent.GET_THEME_VARIABLES_ERROR,
      fallbackMessage: "Failed to get theme variables",
      properties: {
        endpoint,
        themeName,
        mode,
        responseTime: Date.now() - startTime,
      },
    });

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
  const endpoint = "get-theme-colors";
  const startTime = Date.now();
  const analytics = c.get("analytics");

  let themeName: string | undefined;
  let mode: "light" | "dark" | undefined;

  try {
    themeName = c.req.query("theme");
    mode = c.req.query("mode") as "light" | "dark" | undefined;

    const service = await getThemeService(c.env);
    const latestVersion = await service.getLatestVersion();

    if (themeName) {
      if (mode) {
        const variables = await service.getThemeVariables(themeName, mode);

        if (!variables) {
          return c.json({error: `Theme ${themeName} not found`}, 404);
        }

        const colorVars = [...variables.semantic, ...variables.base].filter(
          (v) =>
            v.category === "colors" ||
            v.name.includes("color") ||
            v.name.includes("accent") ||
            v.name.includes("success") ||
            v.name.includes("warning") ||
            v.name.includes("danger"),
        );

        analytics.track({
          event: AnalyticsEvent.GET_THEMES,
          properties: {
            endpoint,
            theme: themeName,
            mode,
            latestVersion,
            colorsCount: colorVars.length,
            responseTime: Date.now() - startTime,
          },
        });

        return c.json({
          theme: themeName,
          mode,
          colors: colorVars,
          latestVersion,
        });
      } else {
        const lightVars = await service.getThemeVariables(themeName, "light");
        const darkVars = await service.getThemeVariables(themeName, "dark");

        if (!lightVars || !darkVars) {
          return c.json({error: `Theme ${themeName} not found`}, 404);
        }

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

        analytics.track({
          event: AnalyticsEvent.GET_THEMES,
          properties: {
            endpoint,
            theme: themeName,
            mode: "both",
            latestVersion,
            lightColorsCount: lightColors.length,
            darkColorsCount: darkColors.length,
            responseTime: Date.now() - startTime,
          },
        });

        return c.json({
          theme: themeName,
          light: lightColors,
          dark: darkColors,
          latestVersion,
        });
      }
    } else {
      const availableThemes = await service.getAvailableThemes();
      const themes = [];

      for (const name of availableThemes) {
        if (mode) {
          const variables = await service.getThemeVariables(name, mode);
          if (variables) {
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
          const lightVars = await service.getThemeVariables(name, "light");
          const darkVars = await service.getThemeVariables(name, "dark");

          if (lightVars && darkVars) {
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

      analytics.track({
        event: AnalyticsEvent.GET_THEMES,
        properties: {
          endpoint,
          theme: "all",
          mode: mode || "both",
          latestVersion,
          themesCount: themes.length,
          responseTime: Date.now() - startTime,
        },
      });

      return c.json({
        themes,
        count: themes.length,
        latestVersion,
      });
    }
  } catch (error) {
    analytics.trackError({
      error,
      errorEvent: AnalyticsErrorEvent.GET_THEMES_ERROR,
      fallbackMessage: "Failed to get colors",
      properties: {
        endpoint,
        themeName,
        mode,
        responseTime: Date.now() - startTime,
      },
    });

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
  const endpoint = "get-theme-versions";
  const startTime = Date.now();
  const analytics = c.get("analytics");

  try {
    const service = await getThemeService(c.env);
    const latestVersion = await service.getLatestVersion();

    analytics.track({
      event: AnalyticsEvent.GET_THEMES,
      properties: {
        endpoint,
        latestVersion,
        responseTime: Date.now() - startTime,
      },
    });

    // For now, we only return the latest version
    // In the future, this could list all available versions from R2
    return c.json({
      latest: latestVersion,
      versions: [latestVersion],
    });
  } catch (error) {
    analytics.trackError({
      error,
      errorEvent: AnalyticsErrorEvent.GET_THEMES_ERROR,
      fallbackMessage: "Failed to get theme versions",
      properties: {
        endpoint,
        responseTime: Date.now() - startTime,
      },
    });

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
  const endpoint = "get-theme-animations";
  const startTime = Date.now();
  const analytics = c.get("analytics");

  try {
    const service = await getThemeService(c.env);
    const latestVersion = await service.getLatestVersion();
    const animations = await service.getAnimations();

    if (!animations) {
      analytics.trackError({
        error: "Animations not found",
        errorEvent: AnalyticsErrorEvent.GET_THEMES_ERROR,
        properties: {
          endpoint,
          latestVersion,
          responseTime: Date.now() - startTime,
        },
      });

      return c.json({error: "Animations not available"}, 404);
    }

    analytics.track({
      event: AnalyticsEvent.GET_THEMES,
      properties: {
        endpoint,
        latestVersion,
        responseTime: Date.now() - startTime,
      },
    });

    return c.json({
      ...animations,
      latestVersion,
    });
  } catch (error) {
    analytics.trackError({
      error,
      errorEvent: AnalyticsErrorEvent.GET_THEMES_ERROR,
      fallbackMessage: "Failed to get animations",
      properties: {
        endpoint,
        responseTime: Date.now() - startTime,
      },
    });

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
