import type {HonoContext} from "../types/context";
import type {Response} from "@cloudflare/workers-types";

export const callPlatformApi = async (
  env: HonoContext["Bindings"],
  path: string,
  options: RequestInit = {},
): Promise<{response: Response; json: any}> => {
  const isDevelopment = env.NODE_ENV === "development";
  const platformApi = env.PLATFORM_API;
  const serviceToken = env.SERVICE_AUTH_TOKEN;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (serviceToken) {
    headers["X-Service-Auth-Token"] = serviceToken;
  }

  let response: Response;
  if (isDevelopment) {
    // Local development: HTTP to localhost
    response = (await fetch(`http://localhost:8789${path}`, {
      ...options,
      headers,
    })) as unknown as Response;
  } else if (platformApi) {
    // Production: Service binding
    response = (await platformApi.fetch(`https://api${path}`, {
      ...options,
      headers,
    } as any)) as unknown as Response;
  } else {
    throw new Error("Platform API not available");
  }

  const json = await response.json();

  return {response, json};
};
