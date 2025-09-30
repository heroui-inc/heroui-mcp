import {Mastra} from "@mastra/core/mastra";
import {PinoLogger} from "@mastra/loggers";

import {agent} from "./agent";

export const mastra = new Mastra({
  agents: {
    herouiMcpTestAgent: agent,
  },
  logger: new PinoLogger({
    level: "info",
    name: "Mastra",
  }),
});
