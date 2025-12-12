/**
 * Analyze and plan prompt
 *
 * Guides agents to analyze the project and create a migration plan using the agent guide
 */

import type {Prompt} from "@modelcontextprotocol/sdk/types.js";

export const analyzeAndPlanPrompt: Prompt = {
  name: "analyze-and-plan",
  description:
    "Analyze the project to identify all HeroUI v2 components and create an incremental migration plan. This is the first step in migration.",
  arguments: [],
};

export async function getAnalyzeAndPlanPrompt(): Promise<{
  messages: Array<{
    role: "user" | "assistant";
    content: {
      type: "text";
      text: string;
    };
  }>;
}> {
  return {
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `# Analyze Project and Create Migration Plan

This prompt guides you to analyze the codebase and create an incremental migration plan for migrating HeroUI v2 to v3.

## First: Get Migration Guide

**Use the MCP tool \`get_migration_guide\`** to fetch the comprehensive agent migration guide. This guide contains:
- Detailed instructions for analyzing the project
- How to identify all HeroUI v2 components
- How to map component dependencies
- How to create a phased migration plan
- Migration strategies and best practices

## Workflow

1. **Fetch the agent guide** using \`get_migration_guide\` tool
2. **Follow the guide's instructions** to:
   - Scan for HeroUI v2 imports
   - Identify all components and their usage
   - Map component dependencies
   - Create a phased migration plan (recommended: 3-5 components per phase, by-dependency strategy)

3. **Create migration plan** with phases:
   - Phase 1: Foundational components (Button, Input, Card, etc.)
   - Phase 2: Components that depend on Phase 1
   - Continue until all components are assigned

## Critical Reminders

⚠️ **Important Constraints**:
- HeroUI v2 and v3 **cannot coexist** in the same project
- The project will be **broken** during migration
- Migrate **all component code** before switching dependencies
- Work in a **feature branch** to maintain a working main branch

## Next Steps

After creating your migration plan, use the **\`implement-migration\`** prompt to begin migrating components phase by phase.`,
        },
      },
    ],
  };
}
