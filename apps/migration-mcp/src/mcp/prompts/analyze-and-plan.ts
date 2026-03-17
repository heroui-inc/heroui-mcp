/**
 * Analyze and plan prompt
 *
 * Guides agents to analyze the project and create a migration plan using the agent guide
 */

import type {Prompt} from "@modelcontextprotocol/sdk/types.js";

export const analyzeAndPlanPrompt: Prompt = {
  name: "analyze-and-plan",
  description:
    "Analyze the project to identify all HeroUI v2 components and create a migration plan. Supports both full and incremental migration approaches. This is the first step in migration.",
  arguments: [
    {
      name: "migrationType",
      description:
        "Migration approach: 'full' (default) or 'incremental'. Full migration breaks the project during migration. Incremental migration allows v2 and v3 to coexist.",
      required: false,
    },
  ],
};

export async function getAnalyzeAndPlanPrompt(args?: {
  migrationType?: "full" | "incremental";
}): Promise<{
  messages: Array<{
    role: "user" | "assistant";
    content: {
      type: "text";
      text: string;
    };
  }>;
}> {
  const migrationType = args?.migrationType || "full";
  const isIncremental = migrationType === "incremental";

  const fullMigrationText = `# Analyze Project and Create Migration Plan

This prompt guides you to analyze the codebase and create a full migration plan for migrating HeroUI v2 to v3.

## First: Get Migration Guide

**Use the MCP tool \`get_migration_workflow({ migrationType: "full" })\`** to fetch the comprehensive agent migration guide. This guide contains:
- Detailed instructions for analyzing the project
- How to identify all HeroUI v2 components
- How to map component dependencies
- How to create a full migration plan
- Migration strategies and best practices

## Workflow

1. **Fetch the agent guide** using \`get_migration_workflow({ migrationType: "full" })\` tool
2. **Follow the guide's instructions** to:
   - Scan for HeroUI v2 imports
   - Identify all components and their usage
   - Map component dependencies
   - Create a full migration plan (recommended: 3-5 components per phase, by-dependency strategy)

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

After creating your migration plan, use the **\`implement-migration({ migrationType: "full" })\`** prompt to begin migrating components phase by phase.`;

  const incrementalMigrationText = `# Analyze Project and Create Migration Plan

This prompt guides you to analyze the codebase and create an incremental migration plan for migrating HeroUI v2 to v3 with coexistence.

## First: Get Migration Guide

**Use the MCP tool \`get_migration_workflow({ migrationType: "incremental" })\`** to fetch the comprehensive incremental migration guide. This guide contains:
- Detailed instructions for analyzing the project
- How to identify coexistence strategy (A: pnpm aliases or B: component packages)
- How to verify coexistence setup
- How to create a component-by-component migration plan
- CSS conflict management strategies

## Workflow

1. **Fetch the agent guide** using \`get_migration_workflow({ migrationType: "incremental" })\` tool
2. **Identify coexistence strategy**:
   - **Strategy A (pnpm aliases)**: Check for aliases like \`"@heroui-v3/react": "npm:@heroui/react@beta"\` in package.json
   - **Strategy B (component packages)**: Check for component-specific packages like \`@heroui/button\`, \`@heroui/card\` alongside \`@heroui/react@beta\`

3. **Verify coexistence setup**:
   - Strategy A: Both \`@heroui/react\` (v2) and \`@heroui-v3/react\` (v3 alias) are installed
   - Strategy B: \`@heroui/react@beta\` (v3) and component packages like \`@heroui/button\` (v2) are installed
   - CSS is configured for both versions (both CSS imports present)

4. **Follow the guide's instructions** to:
   - Scan for HeroUI v2 imports
   - Identify all components and their usage
   - Map component dependencies
   - Create a component-by-component migration plan

5. **Create migration plan**:
   - List components to migrate one-by-one
   - Prioritize foundational components first (Button, Input, Card, etc.)
   - Plan for testing after each component migration
   - Note which strategy is being used (A or B)

## Critical Reminders

✅ **Key Advantages**:
- HeroUI v2 and v3 **can coexist** temporarily
- The project **remains functional** during migration
- Can migrate **component-by-component** with testing
- Can migrate over **extended period** if needed

⚠️ **Important Considerations**:
- Both CSS systems will be loaded (larger bundle size)
- Monitor for CSS conflicts between v2 and v3
- Test each migrated component before proceeding
- Track migration progress carefully

## Next Steps

After creating your migration plan, use the **\`implement-migration({ migrationType: "incremental" })\`** prompt to begin migrating components one by one.`;

  return {
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: isIncremental ? incrementalMigrationText : fullMigrationText,
        },
      },
    ],
  };
}
