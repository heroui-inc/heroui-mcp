/**
 * Implement migration prompt
 *
 * Guides agents to implement component migrations incrementally with checkpoints
 */

import type {Prompt} from "@modelcontextprotocol/sdk/types.js";

export const implementMigrationPrompt: Prompt = {
  name: "implement-migration",
  description:
    "Implement HeroUI v2 to v3 component migrations incrementally. Use this to migrate components phase by phase with checkpoints for user approval.",
  arguments: [],
};

export async function getImplementMigrationPrompt(): Promise<{
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
          text: `# Implement HeroUI v2 to v3 Migration

This prompt guides you to implement component migrations incrementally, stopping at checkpoints for user approval.

## Critical: Checkpoint Workflow

🛑 **STOP AND WAIT FOR USER APPROVAL** after completing each phase before proceeding to the next.

**Do NOT proceed automatically** - always wait for explicit user approval between phases.

## Migration Workflow

### Phase 0: Preparation (Before Code Changes)

These can be done before switching HeroUI dependencies:

1. **Update React to v19** (if not already)
   - This won't break the project
   - Run typecheck/lint if available (do NOT build)

2. **Update Tailwind CSS to v4** (if not already)
   - This won't break the project
   - Run typecheck/lint if available (do NOT build)

3. **Create migration branch**
   - Create feature branch: \`git checkout -b migrate/heroui-v3\`
   - Warn user: project will be broken during migration

### Phase 1-N: Component Migration (v2 Dependencies Still Active)

⚠️ **CRITICAL**: During this phase, code will reference v3 APIs but v2 dependencies are still installed. The project will be **broken**. This is expected and normal.

**For each phase in your migration plan:**

1. **Fetch component migration guides**
   - Use MCP tool \`get_component_guides\` with component names
   - Review API changes, prop migrations, structure changes
   - Understand breaking changes

2. **Migrate component code**
   - Update imports: \`import {Component} from "@heroui/react"\`
   - Migrate component APIs to v3 patterns
   - Update props (e.g., \`onClick\` → \`onPress\`)
   - Update compound component structures where applicable
   - Update TypeScript types if needed

3. **Common changes:**
   - **onClick → onPress**: All interactive components
   - **Compound components**: Card, Modal, Checkbox, etc. now use compound patterns
   - **Component hooks**: Replace hooks like \`useSwitch\`, \`useInput\`, etc. with compound components
   - **Provider removal**: No HeroUIProvider needed in v3
   - **Import changes**: All components from single \`@heroui/react\` package

4. **Handle dependencies**
   - If components depend on others, migrate dependencies first
   - Check if dependencies are already migrated
   - Migrate shared code as needed

5. **Document changes**
   - Commit with message: "migrate: update [Component] to v3 API (broken until deps updated)"
   - Track which components have been migrated
   - Note any issues or concerns

6. **🛑 CHECKPOINT: Stop and wait for user approval**
   - **DO NOT proceed to next phase automatically**
   - Summarize what was migrated in this phase
   - Show progress: "Phase X complete: migrated [components]. Ready for Phase Y?"
   - **Wait for user to approve** before continuing

### Phase Final: Dependency Switch

⚠️ **CRITICAL**: Only proceed when ALL components have been migrated to v3 API patterns.

1. **Update dependencies**
   - Remove \`@heroui/react\` and \`@heroui/theme\` (v2)
   - Install \`@heroui/react@beta\` and \`@heroui/styles@beta\` (v3)
   - Remove \`framer-motion\` if present
   - Update CSS imports (add \`@import "@heroui/styles";\`)
   - Remove HeroUIProvider from app root
   - Update Tailwind config (remove \`heroui()\` plugin)
   - Commit: "chore: switch to HeroUI v3 dependencies"

2. **Fix remaining issues**
   - Run typecheck/lint if available (do NOT build)
   - Fix any TypeScript errors reported by typecheck
   - Fix any linting errors
   - Note: Do not attempt to build or run the project during migration

3. **🛑 CHECKPOINT: Stop and wait for user approval**
   - **DO NOT proceed to styling automatically**
   - Verify components work correctly
   - **Wait for user approval** before styling migration

### Final Phase: Hooks Migration

After dependency switch and component verification:

**Note:** Component hooks (like \`useSwitch\`, \`useInput\`, etc.) should have been replaced with compound components during component migration. This phase focuses on migrating \`useDisclosure\` to \`useOverlayState\`.

**Prerequisites:**
- All component code has been migrated to v3 APIs
- Component hooks have been replaced with compound components (done during component migration)
- Dependencies have been switched to v3 (\`@heroui/react@beta\`, \`@heroui/styles@beta\`)
- HeroUIProvider has been removed
- CSS imports have been updated
- Typecheck/lint passes (do NOT build to verify)

1. **Fetch hooks migration guide**
   - **Use the MCP tool \`get_hooks_migration_guide\`** to fetch the hooks migration guide
   - This guide covers:
     - Component hooks removal (useSwitch, useInput, etc.) - typically done during component migration
     - useDisclosure → useOverlayState migration
     - Migration examples and strategies

2. **Migrate useDisclosure:**
   - Search codebase for \`useDisclosure\` usage
   - Replace with \`useOverlayState\` according to the guide
   - Update all \`useDisclosure\` usages (modals, popovers, etc.)

3. **🛑 CHECKPOINT: Stop and wait for user approval**
   - **DO NOT proceed to styling automatically**
   - Verify hooks have been migrated correctly
   - **Wait for user approval** before styling migration

### Final Phase: Styling Migration

After hooks migration:

**Prerequisites:**
- All component code has been migrated to v3 APIs
- All hooks have been migrated (component hooks → compound components, useDisclosure → useOverlayState)
- Dependencies have been switched to v3 (\`@heroui/react@beta\`, \`@heroui/styles@beta\`)
- HeroUIProvider has been removed
- CSS imports have been updated
- Typecheck/lint passes (do NOT build to verify)

1. **Fetch styling migration guide**
   - **Use the MCP tool \`get_styling_migration_guide\`** to fetch the comprehensive styling migration guide
   - This guide contains:
     - Complete utility class mappings (v2 → v3)
     - Color token changes
     - CSS variable updates
     - Component styling differences
     - Visual changes and alignment updates
     - Migration steps and examples

2. **Follow the guide's instructions** to:
   - Update utility classes systematically
   - Update color tokens
   - Update CSS variables
   - Update component-specific styling
   - Test visual appearance

3. **Update systematically**:
   - Start with utility classes
   - Then color tokens
   - Then CSS variables
   - Finally component-specific styling

4. **Test visual appearance**:
   - Check each component visually
   - Verify spacing and sizing
   - Check color consistency
   - Test responsive behavior

5. **Final verification**
   - Run typecheck/lint one final time (do NOT build)
   - Verify all styling updated correctly
   - Note: Full testing (visual, functionality, accessibility) should be done after migration is complete, not during migration

6. **Migration complete! 🎉**
   - Remove v2 dependencies (if not already done)
   - Switch from Migration MCP to \`heroui-react\` MCP for v3 development
   - Update documentation references

## Key Principles

1. **Incremental**: Migrate in phases, not all at once
2. **Checkpoints**: Always stop between phases for user approval
3. **Broken state expected**: Project will be broken until dependencies switch
4. **All code first**: Migrate all component code before switching dependencies
5. **User control**: Never proceed automatically - always wait for approval

## Component-Specific Resources

Use \`get_component_guides\` MCP tool to get detailed migration instructions for each component. Each guide includes:
- API changes
- Prop migrations
- Code examples (v2 → v3)
- Breaking changes
- Migration steps

## Remember

- **Stop after each phase** - wait for user approval
- **Don't rush** - migration is incremental by design
- **Document progress** - keep user informed of what's been migrated
- **Handle errors gracefully** - some issues may resolve after dependency switch`,
        },
      },
    ],
  };
}
