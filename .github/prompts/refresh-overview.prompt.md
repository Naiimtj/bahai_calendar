---
description: 'Refresh the project overview skill with current project structure'
name: 'refresh-overview'
# Generated from .github/MODELS.md by .github/scripts/sync-agent-models.sh. Do not edit.
model: ["GPT-5.3-Codex", "GPT-5.6 Luna"]
---

# /refresh-overview - Project Overview Refresh

## Command Usage

Use `/refresh-overview` to scan the current project structure and regenerate `.github/skills/project-overview/SKILL.md`.

**Syntax:**

- `/refresh-overview` — Full refresh of the project overview
- `/refresh-overview --help` or `/refresh-overview -h` — Display help information
- `/refresh-overview --diff` or `/refresh-overview -d` — Show what changed since the last version before updating

## Purpose

Keep the project overview skill accurate and up-to-date by scanning the actual file system and regenerating the full project map. This ensures agents and contributors always have a reliable reference.

## When to Use

- **Periodically** — e.g., at the end of a productive session or sprint
- **After major structural changes** — new features, renamed folders, removed stores, etc.
- **When you notice drift** — the overview mentions files that no longer exist, or misses new ones

## Workflow

When the user types `/refresh-overview`, execute the following steps:

### Step 1: Read the current overview

Read `.github/skills/project-overview/SKILL.md` to understand the existing structure and format.

### Step 2: Scan the project

Read the Project Profile, dependency manifest, and framework/router configuration,
then enumerate the actual workspace roots. Identify and scan only directories that
exist for these roles:

| Role                     | What to capture                                               |
| ------------------------ | ------------------------------------------------------------- |
| Pages/routes/layouts     | Route definitions, pages/views, layouts, and middleware       |
| Components/design system | Primitive, shared, and feature component roots                |
| State/reactive logic     | Stores, contexts, hooks, composables, and selectors           |
| API/data access          | HTTP clients, API modules, schemas, and generated clients     |
| Types/domain             | Interfaces, types, models, enums, and constants               |
| Styling/assets           | Theme, tokens, global styles, and static assets               |
| Plugins/config           | Framework plugins, runtime configuration, and app entry files |
| Tests                    | Unit, integration, end-to-end, fixtures, and setup files      |

Do not invent a conventional folder when the role is absent. Record the actual
path and framework-specific file extension for each detected role.

### Step 3: Identify changes

Compare the scanned files against the current overview. Identify:

- **Added** files/folders not yet documented
- **Removed** files/folders that no longer exist
- **Renamed** files/folders

If `--diff` was used, display the changes and ask for confirmation before proceeding.

### Step 4: Describe new files

For any **newly added** store, composable, utility, or key file:

- Read the first ~30 lines to understand its purpose
- Write a concise one-line description

### Step 5: Regenerate the overview

Rewrite `.github/skills/project-overview/SKILL.md` following the exact same structure and format:

1. **Tech Stack** — update only if dependencies changed
2. **Folder Map** — update the ASCII tree
3. **Pages & Routing** — add/remove pages
4. **Store Files** — add/remove rows, update descriptions if the file changed significantly
5. **Composables** — add/remove rows
6. **Utility Functions** — add/remove rows
7. **Core Files** — update if files were added
8. **Interfaces** — add/remove rows for both backend and frontend
9. **Component Hierarchy** — update base/shared component lists, update feature folder list
10. **Middleware / Plugins** — add/remove rows
11. **Data Flow** — update only if the architecture changed
12. **Quick Lookup** — keep unchanged unless a new category was added

### Step 6: Report

Output a brief summary:

```
Overview refreshed.
- Added: [list of new files documented]
- Removed: [list of stale entries cleaned up]
- Unchanged: [count] entries
```

## Important Rules

- **Preserve the existing format exactly** — same table columns, same section headings, same Markdown structure
- **Do not add commentary or opinions** — descriptions are factual one-liners
- **Do not read every file in the project** — only read new/unknown files to write their description
- **Keep descriptions concise** — one line per file, same style as existing entries
