/* eslint-disable @typescript-eslint/no-explicit-any */
import type {HonoContext} from "../types/context";

import {Hono} from "hono";

import {getThemeService} from "../services/theme";
import {AnalyticsErrorEvent, AnalyticsEvent} from "../types/analytics";

const themes = new Hono<HonoContext>();

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

export {themes};
