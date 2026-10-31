---
agent: agent
tools: [read, search, edit, execute, agent, vscode/askQuestions]
description: 'Initialize or refresh .github Copilot customization files for a new project based on the detected tech stack'
name: 'init-github'
---

# /init-github - Initialize GitHub Copilot Customization

## Command Usage

Use `/init-github` when you have copied the `.github/` folder (agents, skills, prompts) into a new project and want to adapt all files to the current project's tech stack, folder structure, and conventions.

**Syntax:**

- `/init-github` — Full scan, regeneration, and pruning of all `.github/` files
- `/init-github --help` or `/init-github -h` — Display help information
- `/init-github --dry-run` or `/init-github -d` — Show what would change without writing files
- `/init-github --keep-all` or `/init-github -k` — Skip general capability pruning (Step 6.1); rejected-installer cleanup and empty-directory hygiene still apply

## Purpose

Automatically adapt the entire `.github/` customization suite (instructions, agents, skills, prompts) to match the project where the folder has been copied. Detects frameworks, languages, state management, styling, testing, i18n, folder conventions, migration intent, and the requested mobile roadmap, then rewrites all files so they are accurate for the new codebase instead of retaining references to the original project. Finally, **prunes** skills, agents, prompts, and templates that have no use in the detected stack or selected mobile targets while preserving the complete migration runtime when migration-safe mode is active.

## When to Use /init-github

- After copying `.github/` from a template or another repo into a new project
- When the project's tech stack has significantly changed (e.g., migrated from Vue to React)
- When you notice agents/skills still reference old project names, old frameworks, or non-existent folders

## Workflow

When the user types `/init-github`, execute the following steps in order.

### Interaction Policy (MANDATORY)

- Use `#tool:vscode/askQuestions` for every closed-choice or mixed-choice decision
  in this workflow. Never print a numbered choice or `(yes/no)` question and wait
  for a typed chat reply.
- Put independent questions that are known at the same time into one tool call.
  Keep dependent questions separate and ask them only when the previous selection
  makes them relevant.
- Set `allowFreeformInput: false` for closed choices. Set it to `true` only when an
  option explicitly allows a custom value or edit.
- Mark the safest normal path as `recommended: true`. Keep labels short and put
  context in option descriptions.
- If `vscode/askQuestions` is unavailable, stop and report that this workflow
  requires a VS Code version with the selectable question tool. Do not fall back
  to requiring a typed answer.

### Command Isolation (MANDATORY)

- `/init-github` is a file-inventory and configuration workflow. Do not run any
  Git command, including `git status`, `git diff`, `git log`, `git branch`, or
  `git rev-parse`, to take a baseline, inspect changes, identify repositories, or
  protect unrelated files. Use direct file reads, search results, edit-tool
  results, and the processing checklist instead.
- Do not ask for Git initialization, commits, branches, remotes, or Git status.
  A migration answer of `NOW` or `LATER` does not authorize Git operations.
- Do not run `xcodebuild`, `xcrun`, `sudo xcodebuild -license`, or any command
  whose purpose is to display or accept an Apple/Xcode SDK license. If any command
  unexpectedly opens a license or another interactive system prompt, stop it
  without sending Enter or accepting anything and report the exact command.

---

### Step 0: Protect Existing `.github` Content (MANDATORY)

This template has only two safe installation states:

1. The target project never had a `.github/` directory.
2. The target's original `.github/` was renamed to `.github-old/` **before** the
   template was copied into a fresh `.github/` directory.

Before reading or adapting any template file:

1. List the workspace root and check for `.github-old/`.
2. If `.github-old/` exists, record `Import safety: legacy source prepared` and
   continue to Step 1.
3. If `.github-old/` does not exist, call `#tool:vscode/askQuestions` with exactly
   one question:
   - Header: `Import safety`
   - Question: `Before this template was copied, did this project already have a .github directory?`
   - Options: `No`, `Yes`, `Unsure`
   - `allowFreeformInput: false`
   - **no**: record `Import safety: no previous .github` and continue to Step 1.
   - **yes** or **unsure**: STOP without editing anything. A direct folder merge
     cannot prove which same-named files were overwritten. Ask the user to restore
     the original configuration, rename it to `.github-old/` with explicit
     confirmation, copy the template into a fresh `.github/`, then rerun
     `/init-github`.

Never rename, move, delete, or overwrite `.github/` or `.github-old/` during
this step without explicit user confirmation. `--dry-run` performs this safety
gate but never writes files.

---

### Step 1: Detect Tech Stack

Explore the workspace to understand what technologies and conventions the project uses.

**Read these files if they exist using available read tools:**

- `package.json` — detect framework, UI library, state management, test framework, i18n, CSS tooling, Node version
- `tsconfig.json` — confirm TypeScript usage and aliases
- `nuxt.config.ts` / `next.config.ts` / `vite.config.ts` / `vue.config.js` / `angular.json` — detect meta-framework
- `tailwind.config.ts` / `postcss.config.js` / `uno.config.ts` — detect CSS approach
- `vitest.config.ts` / `jest.config.js` / `playwright.config.ts` — detect testing
- Any README.md in the repo root — extract project name and description

**List these directories if they exist using available read/search tools:**

- Root level: note top-level folders (src/, app/, pages/, components/, stores/, composables/, hooks/, public/, locales/, tests/, etc.)
- `src/` or `app/` subfolders: understand module/component organization

**Probe migration evidence:** If
`.github/skills/source-analysis/scripts/detect-legacy-source.sh` exists, run it
once for every open workspace root and record its `status`, `source_stack`,
`candidate_root`, `component_root`, and `evidence` lines. First require
`detector_contract=generic-ast-v1`. If the detector runs without that field, record
`Migration runtime: STALE OR INCOMPLETE`; do not interpret `status=not-found`, do
not recommend `Run migration now`, and require restoration of the latest complete
migration runtime. Any valid application candidate is positive migration evidence. A
`not-found` result only means no source is currently visible; it never authorizes
pruning before the Step 1.7 roadmap decision.

**From this exploration, build a detection summary with these fields:**

| Field                | Detected Value                                                          | Notes                                                            |
| -------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Project Name         | e.g., "[TODO: project name]"                                            | From package.json name or README                                 |
| Framework            | e.g., Nuxt 4, Next.js 14, Vite + Vue 3, Angular 17                      | Primary meta-framework                                           |
| Language             | TypeScript / JavaScript / Python / etc.                                 |                                                                  |
| Component Model      | Vue SFC / React JSX / Angular Component / etc.                          |                                                                  |
| Script Setup         | `<script setup>` / hooks / classes                                      |                                                                  |
| UI Library           | PrimeVue / Shadcn / Material-UI / etc.                                  |                                                                  |
| State Management     | createGlobalState (VueUse) / Pinia / Redux / Zustand / Context API      |                                                                  |
| Styling              | TailwindCSS v4 / v3 / CSS Modules / Styled Components / SCSS            |                                                                  |
| i18n                 | vue-i18n / react-intl / next-intl / None                                |                                                                  |
| Testing              | Vitest + @vue/test-utils / Jest + React Testing Library / Playwright    |                                                                  |
| HTTP Client          | Custom composables / Axios / fetch / $fetch / RTK Query                 |                                                                  |
| Component Hierarchy  | base/shared/feature, primitives/compositions/pages, or none             |                                                                  |
| Company Styling      | Verified guidance/tokens/assets/components or unknown                   | Record authoritative paths; never infer branding                 |
| Key Folders          | components/, stores/, composables/, hooks/, utils/, interfaces/, types/ |                                                                  |
| API Docs             | Any OpenAPI / Swagger URLs?                                             | Usually none in new project                                      |
| Core Domain Entities | e.g., Product, Order, Customer, Invoice — main business nouns           | From `interfaces/`, `types/`, `models/`, component names, README |
| Existing Capacitor   | Installed / not installed / unknown                                     | Check `@capacitor/*`, `capacitor.config.*`, `ios/`, `android/`   |

> If a field cannot be detected, mark it as "Unknown — ask user".

Retain the detector output as evidence for the migration-roadmap decision after
model selection. Do not infer the user's migration intent from detection alone,
and do not treat an absent target Nuxt repository as evidence against migration.

**Domain vocabulary matters as much as tech stack.** Old skill/agent files contain code examples using the PREVIOUS project's business nouns (e.g., `activeRequests`, `fetchRequestById()`, `ISample`, `CreateRequestOptions`). These are NOT framework references, so tech-stack replacement rules (Step 4) never catch them. Step 4.5 below exists specifically to find and replace this domain vocabulary — do not skip it.

---

### Step 1.5: Confirm the Optional Mobile App Roadmap (MANDATORY)

`.github/frontend-apps/` is a temporary Capacitor customization package. Its
presence does not mean the project uses Capacitor. After Step 1, even when no
Capacitor package or native folder is detected, call
`#tool:vscode/askQuestions` with:

- Header: `Mobile roadmap`
- Question: `Do you plan to distribute this web project as an iOS or Android app with Capacitor in the future?`
- Options: `No` (recommended) and `Yes`
- `allowFreeformInput: false`

- **no**: record `Mobile package: rejected`. Do not ask for a platform. The answer
  is explicit approval to recursively delete `.github/frontend-apps/` and all of
  its contents, plus `.github/prompts/init-apps.prompt.md`, immediately after the
  core initialization validates. This cleanup is mandatory and is not part of the
  optional pruning confirmation. It never approves deleting application files or
  previously established native customizations.
- **yes**: confirm `.github/frontend-apps/INTEGRATION.md` and
  `.github/prompts/init-apps.prompt.md` exist, then call the same tool with:
  - Header: `Mobile targets`
  - Question: `Which mobile targets should the Copilot configuration support?`
  - Options: `iOS`, `Android`, `Both`
  - `allowFreeformInput: false`

  Accept case-insensitive `iOS`, `Android`, or `both`; clarify any other answer.
  Record `Mobile package: accepted` and `App targets: ios|android|both`.

If application evidence already contains a platform excluded by the answer, show
that evidence and ask whether its existing Copilot support should also be retained.
Never infer a platform choice from package detection.

After the core template passes Step 5, branch on the recorded state. If accepted,
execute the `/init-apps` workflow from its Step 0 onward. Reuse the recorded
platform answer instead of asking it again, but still perform conflict detection,
the atomic plan confirmation, semantic merge, validation, and post-success cleanup.
If rejected, execute the mandatory cleanup in Step 6.0. `--keep-all` does not
preserve a rejected one-time installer.

This handoff stays in the current `/init-github` execution: read
`.github/prompts/init-apps.prompt.md`, carry forward the recorded target as explicit
state, and continue at its Step 0. Do not start a separate chat or rely on hidden
parameters. Include the carried value in the atomic plan so the user can correct it.

Never install Capacitor dependencies, create native projects, or modify
`capacitor.config.*`, `ios/`, `android/`, or application source as a side effect.

---

### Step 1.6: Confirm Recommended Models (MANDATORY)

`/init-github` intentionally runs with the model currently selected in chat. Treat
that selection as the user's preferred default: never silently replace it with a
different `medium` model while configuring the project.

1. Read `.github/MODELS.md` and its three starter profile rows.
2. Use runtime metadata to obtain the exact active picker name and the available
   model catalog when either is exposed. The exact active model is confirmed
   available. Never infer other available models from product knowledge.
3. Build and show the three recommended profile rows **before requesting any model
   input**:
   - `cheap`: lowest-cost available model capable of mechanical/read-only work
   - `medium`: the exact model currently active in this chat; this is also the
     recommended default
   - `expensive`: strongest available reasoning/agentic model for exceptional
     complexity
   - fallback: normally the next cheaper proposed model; repeat the primary when
     no cheaper suitable model is proposed
4. When no authoritative catalog is exposed, keep suitable `cheap` and `expensive`
   starter candidates from `MODELS.md` in the initial proposal and label them
   `confirm in picker`. Do not ask the user to transcribe the whole picker first.
   When the runtime also hides the active model's exact name, show the starter
   `medium` candidate, explicitly state that it could not be matched to the active
   selection, and let the user replace only that value in the same interaction.
5. Apply these deterministic cases once the shown names are confirmed:

   | Confirmed suitable models | Mapping behavior                                                                                                                                                                        |
   | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
   | 1                         | Use the same model as primary and fallback for all profiles; disclose that cost tiers collapse.                                                                                         |
   | 2                         | Use the lower-cost model for `cheap`, the active model for `medium`, and the stronger model for `expensive`; show any duplicated tiers and use the cheaper suitable fallback.           |
   | 3+                        | Use the lowest-cost model for `cheap`, the active model for `medium`, and the strongest model for `expensive`; if the active model is also an edge tier, keep and disclose duplication. |

6. Show this exact editable proposal shape; never hide duplicated tiers or
   availability that still needs confirmation:

   | Profile     | Primary exact picker name | Fallback exact picker name | Selection reason / availability             |
   | ----------- | ------------------------- | -------------------------- | ------------------------------------------- |
   | `cheap`     | [name]                    | [name]                     | [cost evidence; confirmed/to confirm]       |
   | `medium`    | [active name]             | [name]                     | [active chat model; confirmed]              |
   | `expensive` | [name]                    | [name]                     | [capability evidence; confirmed/to confirm] |

   Then state:
   - `Active chat model: [exact picker name, or name not exposed]`
   - `Recommended default profile: medium`
   - `Recommended default model: [active exact picker name, or starter medium pending edit]`
     These are project defaults only; they do not change the user's global VS Code
     picker.

7. Resolve availability, edits, and approval in **one selectable interaction**.
   After showing the three profile rows, call `#tool:vscode/askQuestions` with:
   - Header: `Model setup`
   - Question: `How should these model recommendations be applied?`
   - Options:
     - `Use recommendations` — confirm all three shown options; mark as
       `recommended: true`
     - `Use active model only` — use the active chat model for every profile
     - `Edit mapping` — replace one or more shown names
   - `allowFreeformInput: true` so the user can directly enter
     `cheap=...; medium=...; expensive=...` instead of selecting an option

   The three profile rows must appear before the tool call. Do not first ask for a
   picker list, print a text-only menu, or follow `Use recommendations` with a
   separate confirmation. A complete freeform edit both corrects and approves the
   mapping. If the user selects `Edit mapping` without entering values, call the
   tool once more with freeform questions only for the fields being changed; do
   not repeat the stack summary or confirmed fields.

8. Treat `Use recommendations` as explicit confirmation that every shown
   candidate is visible in the picker. Treat `Use active model only` as explicit
   approval to collapse all tiers, but require the active exact picker name if
   runtime metadata hid it. Use only authoritative runtime names,
   shown-and-confirmed recommendations, or exact names supplied by the user.
9. After approval, update only the profile rows in the `MODEL-SYNC` manifest and
   change the `Mapping status` line to `CONFIRMED BY USER - [current date]`.
   Record `Model synchronization: pending finalization`. Do not run the
   synchronizer in this step: later adaptation and pruning still modify managed
   files and manifest assignments. Step 7 is the only generation point.

The generated candidate arrays provide automatic first-available fallback. If no
suitable confirmed candidate exists for a tier, reuse a confirmed lower tier and
disclose the collapse instead of inventing a model or adding another question.

---

### Step 1.7: Confirm Migration Roadmap (MANDATORY)

Only after the detection summary and model mapping have been resolved, and before
building any pruning plan, call `#tool:vscode/askQuestions` with:

- Header: `Migration roadmap`
- Question: `Do you expect to use the included legacy migration workflow now or in the short or long term?`
- Options:
  - `No migration planned`
  - `Yes, migration planned`
- `allowFreeformInput: false`

Mark `Yes, migration planned` as recommended when Step 1 found a legacy
application source candidate; otherwise mark `No migration planned` as
recommended. Evidence changes only the recommendation. The user always decides.

If the answer is `No migration planned`, record:

- `Initialization mode: STANDARD`
- `Migration mode: INACTIVE`
- `Migration timing: NONE`

If the answer is `Yes, migration planned`, make a second, separate
`#tool:vscode/askQuestions` call because this question depends on the first:

- Header: `Migration timing`
- Question: `When should the migration workflow run?`
- Options:
  - `Run migration now`
  - `Keep migration for later`
- `allowFreeformInput: false`

Mark `Run migration now` as recommended only when exactly one source
candidate is available; otherwise recommend `Keep migration for later`.

- `Run migration now` records `Initialization mode: MIGRATION`,
  `Migration mode: USER CONFIRMED`, and `Migration timing: NOW`.
- `Keep migration for later` records `Initialization mode: MIGRATION`,
  `Migration mode: USER CONFIRMED`, and `Migration timing: LATER`.

Both migration timings activate the same retention manifest. `NOW` schedules the
operational prompt only after initialization, pruning, and model synchronization
all pass. `LATER` creates no migration target during initialization. In either
case, keep the confirmed legacy source read-only; the target is mandatory Nuxt 3
with verified company styling and optional FastAPI only after the backend decision.
Never rewrite target-stack migration guidance to match the legacy source stack.

---

### Step 2: Enumerate and Read EVERY .github File as Templates

Read the current `.github/` files that need adaptation. These are the BASE files from the original project.

**Never rely on a fixed/hardcoded file list — the folder contents change over time.** Instead:

1. Enumerate `.github/skills/` and read every `SKILL.md` found, including `skills-templates/` variants.
2. Enumerate `.github/agents/` and read every `*.agent.md` found.
3. Enumerate `.github/prompts/` and read every `*.prompt.md` found.
4. If `.github/scripts/` exists, read every support script. Treat `.github/scripts/sync-agent-models.sh` as a generic runtime helper: preserve it verbatim unless the template itself is being upgraded.
5. Always read the core pipeline files: `.github/copilot-instructions.md`, `.github/GUARDRAILS.md`, `.github/ROUTER.md`, `.github/MEMORY.md`, `.github/MODELS.md`, `.github/TOOLS.md`, `.github/ORCHESTRATORS.md`, `.github/skills/SKILLS-DIGEST.md`.

**Build a processing inventory** from this enumeration — a flat list of every skill file and every agent file discovered, plus a protected support list for `MODELS.md` and `.github/scripts/`. This inventory is the checklist used in Step 4.5 (Per-File Individual Adaptation Pass): every single item on it must be individually opened, adapted, and marked done before Step 5 can run. Do not summarize or batch-process multiple files from memory — each file is read and edited on its own.

#### Migration retention manifest

When `Initialization mode: MIGRATION`, build a concrete retention manifest before
editing any inventoried file. The manifest is a set of existing paths, not a prose
label, and must contain at least:

- `.github/agents/migration.agent.md` and
  `.github/prompts/migrate-frontend.prompt.md`.
- Every agent named by the migration agent's `agents:` frontmatter allowlist.
- Every skill named by the migration agent, migration prompt, its allowlisted
  agents, and their router entries that participates in normal or evidence-gated
  migration, following dependencies transitively. Exclude explicit-request-only
  capabilities such as `git-independence` unless the user's current request itself
  asks for Git work.
- The migration roots `migration-overview/`, `source-analysis/`,
  `component-mapping/`, `nuxt3-scaffold/`, `fastapi-scaffold/`,
  `company-styling/`, `local-run/`, and `vuetify-migration/`, including all
  scripts and references below them.
- Under `source-analysis/scripts/`, require the generic detector, AST builder,
  ECMAScript-family adapter, R adapter, and every future registered parser adapter.
- The active `components/`, `styling/`, `state-management/`, `api/`, `i18n/`,
  `testing/`, `accessibility/`, `quality/`, and `project-overview/` skills needed
  by delegated target implementation.
- PrimeVue and Vuetify component templates plus TailwindCSS and UnoCSS styling
  templates until `/migrate-frontend` records both independent library decisions.
- Every `ROUTER.md`, `TOOLS.md`, `ORCHESTRATORS.md`, `MODELS.md`,
  `SKILLS-DIGEST.md`, and `copilot-instructions.md` entry that registers or routes
  those files.

Expand the manifest when a protected file references another migration-time agent,
skill, script, template, or prompt. Before Step 3, verify every required path
exists. A missing dependency is a damaged or incomplete template: STOP and report
the exact path instead of pruning or inventing a replacement. Keep this manifest
as the exclusion list and completion checklist through Steps 4-8.

---

### Step 3: Detect and Absorb `.github-old` (Legacy Merge)

Before generating updated files, check whether a `.github-old/` folder exists in the workspace root. This folder represents the previous `.github/` renamed before copying in the new template.

**Check for legacy folder:**

List the workspace root with an available read/search tool.

- If `.github-old/` is **not found** and Step 0 recorded `no previous .github` → skip this step. Note: "No legacy source exists — legacy merge skipped."
- If `.github-old/` is **not found** and Step 0 did not establish a safe import → STOP. Do not infer that a direct copy preserved the old configuration.
- If `.github-old/` is **found** → **MANDATORY DELEGATION** to `legacy-merger` agent (see below).

---

#### When `.github-old/` IS found → DELEGATE TO LEGACY-MERGER AGENT

**DO NOT attempt to merge `.github-old/` inline.** The complexity and requirement for exhaustive reading makes delegation mandatory.

**Delegation command:**

```
Invoke runSubagent tool:
- agentName: "legacy-merger"
- description: "Absorb .github-old/ into current .github/"
- prompt: "
  Execute legacy-audit skill protocol (Phases 1-5) on .github-old/.

  Context from /init-github:
  - Tech stack detected (Step 1): [insert detection summary from Step 1]
  - Current .github/ baseline: [list files read in Step 2]

  Your mission:
  1. Map ALL files in .github-old/ (Phase 1)
  2. Read EVERY file COMPLETELY — no truncation, no skipping (Phase 2)
  3. Diff section-by-section against current .github/ (Phase 3)
  4. Merge ALL unique knowledge relevant to detected stack (Phase 4)
  5. Verify completion and produce Legacy Audit Report (Phase 5)

  Constraints:
  - ZERO tolerance for partial reads or skipped files
  - Every file must show final status: READ + MERGED/NO MERGE/DISCARDED
  - All merged content annotated with <!-- absorbed from .github-old -->
  - Memory files: append only, never overwrite

  Deliverable: Legacy Audit Report + all merged .github/ files ready for Step 4
  "
```

**Why delegation is mandatory:**

- `.github-old/` may contain 40-60 files totaling 10,000-20,000 lines
- Exhaustive reading requires multiple `read_file` calls per large file
- Section-by-section comparison demands consistent context across all files
- Token cost is justified — this is ONE-TIME initialization, correctness > cost
- Attempting inline merge risks skipping content, partial reads, and lost knowledge

**Agent output → Step 3 completion:**

When `legacy-merger` agent returns:

1. Receive **Legacy Audit Report** (see `legacy-audit` skill output format)
2. Verify report shows:
   - All files marked `[✓] READ COMPLETE`
   - All files have final status (MERGED / NO MERGE / DISCARDED + reason)
   - No "SKIPPED", "PARTIAL", or "PENDING" statuses
3. Note files with merged content for Step 4 (they now contain absorbed knowledge)
4. Proceed to Step 4

**If agent reports incomplete audit:**

- Agent will stop and report which files/sections are incomplete
- Review agent's progress notes
- Either:
  - Resume agent with remaining files, OR
  - Ask user for guidance on ambiguous merge decisions

---

#### Legacy Merge Protocol Summary (enforced by agent)

The `legacy-merger` agent follows the `legacy-audit` skill protocol:

**Phase 1:** Complete file discovery — map every file in `.github-old/`
**Phase 2:** Exhaustive reading — read ALL lines of ALL files (chunked if >500 lines)
**Phase 3:** Deep comparison — section-by-section diff vs. current `.github/`
**Phase 4:** Intelligent merge — integrate unique knowledge, annotate absorbed content
**Phase 5:** Verification — cross-reference, inventory completion check, produce report

**Checkpoints (agent MUST pass all 5):**

1. No files missing from inventory
2. All files marked READ COMPLETE before Phase 3
3. Every section of every file compared
4. All extracted content merged (no orphan notes)
5. No files with incomplete status

**Output from agent:**

```
LEGACY MERGE COMPLETE

Summary:
- Files scanned: 47
- Lines read: 15,234
- Files merged: 28
- Files discarded: 5

[Detailed merge log listing every file and action taken]

Ready for Step 4 (Generate Updated Files).
```

---

#### What the Agent Merges (Extraction Rules)

Agent applies these rules during Phase 4 (detailed in `legacy-audit` skill):

**TO merge:**

- Project-specific patterns (naming, component patterns, code-style rules)
- Domain knowledge in skills (extra API patterns, state management conventions, testing utilities, design system rules)
- Custom agent rules/constraints (forbidden patterns, architectural decisions, delegation rules, checklist items)
- Memory files (`.github-old/memory/`) → append non-duplicate entries to current `memory/` files
- Hooks/workflow scripts present in old but absent in new
- Extra agents/skills (if relevant to current stack)

**NOT to merge:**

- Old project name, old API URLs, removed framework references
- Stack-specific code examples for tech pruned in Step 5
- Content semantically equivalent to what already exists in new file
- `skills-templates/` from old (bootstrap material)
- Outdated architectural decisions superseded by new template

**Merge strategy:**

- Skills: absorb unique knowledge into corresponding sections
- Agents: add missing constraints/patterns/checklist items to tables
- Core files: fill [TODO] placeholders, append custom sections
- Memory files: APPEND only (never overwrite)

**Annotation:**
All merged content marked with `<!-- absorbed from .github-old — verify still applies -->`

**`--dry-run` behavior:**
Agent performs full read and audit but does NOT write. Outputs preview report.

---

### Step 4: Generate Updated Files

For each file read in Step 2, rewrite it so all project-specific references are replaced with the detected (or inferred) values from Step 1.

Write the Step 1.7 selections to the Project Profile: `Initialization mode` must
be exactly `STANDARD` or `MIGRATION`, and `Migration timing` must be exactly
`NONE`, `NOW`, or `LATER`. These persisted values are the preflight contract used
by `/migrate-frontend`; do not leave them as `[TODO]`.

**Replacement rules (apply to ALL files):**

1. **Project name**: Replace `[TODO: project name]` with the detected project name.
2. **Framework references**: Replace "Nuxt 4 / Vue 3" with the detected framework stack.
3. **Component syntax**: Replace `<script setup lang="ts">` with the detected component model.
4. **State management**: Replace "createGlobalState from `@vueuse/core`" / "Pinia" with the detected state approach.
5. **Styling**: Replace "TailwindCSS v4" / "PrimeVue" with the detected styling stack.
6. **i18n**: Replace "vue-i18n" / "locales/en.json fr.json de.json" with the detected i18n setup.
7. **Testing**: Replace "Vitest + `@vue/test-utils` + happy-dom" with the detected testing stack.
8. **HTTP helpers**: Replace references to `useHttpGet`, `useHttpPost`, `composables/useHttpRequest.ts` with the detected HTTP approach.
9. **Folder paths**: Replace hardcoded paths (`components/base/`, `store/`, `composables/`, etc.) with the detected actual paths.
10. **API URLs**: Remove or generify specific OpenAPI / Swagger URLs unless they exist in the new project.
11. **Agents constraints**: Update each agent's "Allowed files" and "Delegates to" tables to match the new folder structure.
12. **`[TODO]` placeholders**: Fill every `[TODO: ...]` placeholder across **all `.github/` files** — including `copilot-instructions.md`, `GUARDRAILS.md`, `ROUTER.md`, `TOOLS.md`, agent files, skill files, and **prompt files** (`prompts/*.prompt.md`) — with detected values from Step 1. Leave as `[TODO]` + explanatory note only if the value is genuinely undetectable from the codebase.
13. **Memory folder**: NEVER overwrite `.github/memory/*` contents — they hold accumulated project knowledge. Only create the seed files if missing.
14. **Domain-specific example names** (applies even to stack-agnostic skills like `quality`, `caveman`, `arc42`, `project-overview`): code snippets and prose often reference the PREVIOUS project's business entities (e.g., `activeRequests`, `fetchRequestById()`, `ISample`, `CreateRequestOptions`, `IAccount`). Replace every such example with either the detected new project's own domain vocabulary (from Step 1's "Core Domain Entities") or, if no domain is detectable, a neutral generic (`items`, `fetchItemById()`, `IItem`, `CreateItemOptions`). Tech-stack replacement rules 1-11 do NOT catch these — they must be handled explicitly per file in Step 4.5.
15. **Frontend apps package**: Do not adapt staged files inline with the core
    inventory. After core verification, use the `/init-apps` workflow and its
    integration contract. It owns selected-platform adaptation, semantic runtime
    registration, validation, and cleanup.
16. **Migration-mode exception**: when `Initialization mode: MIGRATION`, preserve
    the source/target distinction in
    `migration.agent.md`, `migrate-frontend.prompt.md`, `migration-overview`,
    `source-analysis`, `nuxt3-scaffold`, `fastapi-scaffold`,
    `component-mapping`, `local-run`, `vuetify-migration`, and
    company styling. Preserve the PrimeVue/Vuetify component templates and the
    TailwindCSS/UnoCSS styling templates until `/migrate-frontend` records both
    target-library decisions; source-stack detection must not choose them.
    Adapt source detection to evidenced legacy paths, but keep Nuxt/atoms/FastAPI
    references as target requirements. Preserve Vue/Nuxt semantics in allowlisted
    implementation agents and scope every dispatched write to a confirmed sibling
    target.
17. **Detected-stack skill retention (MANDATORY)**: A technology detected in Step
    1 must retain one active, dedicated skill. Before any template pruning, either
    adapt the existing matching skill or promote the selected
    `skills-templates/` variant to a real path under `.github/skills/` (for
    example, detected TailwindCSS -> `skills/tailwindcss/SKILL.md`). Add
    the resulting skill to `SKILLS-DIGEST.md` and the matching routing rules. Do
    not treat a generic `styling/SKILL.md` as a substitute for a detected CSS
    framework's dedicated skill unless the user explicitly approves that
    consolidation.

**If a technology is NOT detected (e.g., no i18n library found):**

- The related skills/agents/prompts become **pruning candidates** — handled in Step 5.
- Only when the detection is ambiguous (might exist but unconfirmed): keep the file and mark it "Not detected — configure manually" / "Optional — configure if needed".

**If `--dry-run` was used:**

- Do NOT write any files.
- Output a summary of what each file would change (project name, framework, key replacements).
- Ask the user for confirmation before proceeding.

---

### Step 4.5: Per-File Individual Adaptation Pass (MANDATORY — one file at a time)

**This step exists because past `/init-github` runs left files like `skills/quality/SKILL.md` completely untouched** — tech-stack replacement alone doesn't fix stack-agnostic skills/agents that only need their code-example _names_ adapted. Every skill and every agent from the Step 2 inventory MUST be processed individually here, even ones with no framework references at all (`quality`, `caveman`, `arc42`, `project-overview`, `planner`, `feature`, `refactor`, `reviewer`).

**Do not batch-generate content for multiple files from a single mental pass.** Open one file, adapt it, write it, tick it off, then move to the next.

**For EACH file in the inventory, in order:**

1. Open the file and read it in full.
2. Apply the tech-stack replacement rules (Step 4, rules 1-13) if applicable.
3. **Scan specifically for domain-example vocabulary** (rule 14): variable names, function names, interface/type names, and prose examples referencing the old project's business domain. Look past code fences too — narrative text ("when a request is submitted...") carries the same drift.
4. Rewrite every such example using the detected project's own domain vocabulary, or a neutral generic if no domain is detected.
5. Verify the rewritten examples are still syntactically valid for the file's own subject (e.g., a `quality` skill example must remain valid TypeScript demonstrating the same clean-code principle, just with renamed entities).
6. Mark the file as done in a running checklist, e.g.:

   ```
   [x] skills/quality/SKILL.md — domain examples adapted (Request→Item), no tech-stack refs to change
   [x] skills/testing/SKILL.md — Vitest→Jest, domain examples adapted
   [x] agents/component.agent.md — folder paths updated, no domain examples present
   [ ] agents/reviewer.agent.md — pending
   ```

7. Never mark a file done without having actually opened and edited (or explicitly confirmed no change needed) that specific file.

**Completion gate:** Step 5 cannot start until every file in the Step 2 inventory shows `[x]` in the checklist. If a file genuinely needs no changes, still mark it `[x]` with the reason ("no domain examples, stack-agnostic, verified clean").

---

### Step 5: Coherence Verification (MANDATORY — prevents template drift)

After generating all files (Step 4), perform an automated coherence audit. This step catches cases where files were created from generic templates but NOT fully adapted to the detected stack.

**Why this exists:** Past init-github runs left skills referencing TailwindCSS (project uses UnoCSS), Vitest (project uses Jest), and createGlobalState (project uses Pinia). This step prevents that class of error permanently.

#### 5.1 — Skill Content Verification

For EACH skill file in `.github/skills/*/SKILL.md`:

1. Read the first 5 lines (header + stack note)
2. Check that **technology names in the skill match the detected stack from Step 1**:
   - Styling skill → must reference the detected CSS solution (e.g., UnoCSS, not TailwindCSS)
   - Testing skill → must reference the detected test runner (e.g., Jest, not Vitest)
   - State management skill → must reference the detected state lib (e.g., Pinia, not createGlobalState/Zustand)
   - Accessibility skill → must reference the detected UI library (e.g., Vuetify, not PrimeVue)
   - API skill → must reference the detected HTTP helpers
3. Scan code examples for **wrong imports or API calls** (`import { describe } from 'vitest'` when Jest is used, `vi.mock` when `jest.mock` is correct, `createGlobalState` when `defineStore` is correct)
4. If ANY mismatch found → **rewrite the skill** with correct stack references and code examples
5. For every detected framework, styling solution, UI library, state library,
   i18n library, test runner, or API client that has a skill/template candidate,
   verify that exactly one matching active skill exists outside
   `skills-templates/` and is registered in `SKILLS-DIGEST.md`. A missing active
   skill is a coherence failure: promote/adapt it before Step 6.

When `Initialization mode: MIGRATION`, verify each file against the correct profile:
`source-analysis` matches the legacy source; migration scaffold, component, state,
API-consumer, testing, accessibility, and company-styling resources match the Nuxt
target. Nuxt/atoms references in target resources are not drift merely because the
source uses a different language or framework. Verify that the generic detector,
AST builder, and every registered parser adapter remain present and internally
referenced by `source-analysis`.

**Quick-check matrix:**

| Skill file                                                                     | Must NOT contain (if stack differs)                                             | Must contain                                                       |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `styling/SKILL.md`                                                             | TailwindCSS, `@theme`, `assets/app.css`, PrimeVue                               | Detected CSS tool + actual config file paths                       |
| `testing/SKILL.md`                                                             | Vitest, `vi.mock`, `vi.fn`, happy-dom                                           | Detected test runner + its API (`jest.mock`)                       |
| `state-management/`                                                            | createGlobalState, VueUse store, `store/*.store.ts`                             | Detected state lib + actual store folder path                      |
| `accessibility/`                                                               | PrimeVue, PrimeIcons, `pi pi-*`                                                 | Detected UI lib + its accessibility patterns                       |
| `api/SKILL.md`                                                                 | `[TODO]` placeholders in endpoint URLs, wrong client                            | Detected HTTP helpers + actual composable path                     |
| `company-styling/`                                                             | Unverified brand colors, fonts, logos, assets, component names, or package APIs | Verified company sources or explicit `Unknown — ask user` blockers |
| `quality/SKILL.md`, `caveman/`, `arc42/`, `project-overview/` (stack-agnostic) | Old project's business-domain example names (e.g., `activeRequests`, `ISample`) | Detected project's own domain vocabulary, or a neutral generic     |

#### 5.2 — Agent Frontmatter Verification

For EACH agent file in `.github/agents/*.agent.md`:

1. Verify YAML frontmatter contains ALL required fields:
   - `description:` — non-empty
   - `tools:` — array matching TOOLS.md matrix
   - `user-invocable: true` (for user-facing agents)

- A profile assignment exists in `.github/MODELS.md`; generated `model:`
  metadata remains pending until Step 7

2. Verify agent body references correct stack:
   - No mentions of UI libraries not in the project (PrimeVue when using Vuetify, etc.)
   - No i18n rules if project has no i18n
   - File scope paths match actual project folder structure
3. Cross-check `tools:` array against TOOLS.md matrix row — must match exactly

**Common errors to catch:**

| Error                                                            | Fix                                                        |
| ---------------------------------------------------------------- | ---------------------------------------------------------- |
| Agent says `tools: [read, search]` but TOOLS.md gives `edit: ✅` | Align one to the other (agent behavior is authoritative)   |
| Agent references `assets/css/` but project has `assets/scss/`    | Update path in agent constraints                           |
| Agent enforces `$t('key')` but project has no i18n               | Remove i18n constraint                                     |
| Missing or wrong model-profile assignment                        | Update the MODELS.md manifest; generation waits for Step 7 |
| `user-invocable:` missing                                        | Add `user-invocable: true`                                 |

#### 5.3 — Cross-File Reference Integrity

Verify these cross-references are consistent:

1. **ROUTER.md §2 matrix** ↔ **MODELS.md manifest** ↔ **agent files** — every routed agent must exist and have a manifest assignment; defer generated-frontmatter validation until Step 7
2. **TOOLS.md matrix** ↔ **agent frontmatter `tools:`** — must match exactly
3. **SKILLS-DIGEST.md table** ↔ **actual skill folders** — every entry in the digest must have a corresponding `SKILL.md`; skill descriptions must match actual content
4. **ORCHESTRATORS.md dependency rules** — no references to capabilities the project doesn't have (e.g., i18n step if no i18n)
5. **Prompt files** — every retained managed prompt has a manifest assignment; Step 7 generates its qualified VS Code picker names
6. **Frontend apps package integrity**:
   - Before the Step 1.5 decision, all assets declared by
     `.github/frontend-apps/INTEGRATION.md` exist and runtime files do not route
     to staged paths.
   - `rejected`: core verification passes, then the package and `/init-apps`
     prompt are removed; no new native runtime registration is created.
   - `accepted`: `/init-apps` completes for the recorded target, selected assets
     and registrations resolve, unselected-platform guidance is absent, and the
     one-time package and prompt are removed only after their validation passes.
7. **Migration retention integrity** when `Initialization mode: MIGRATION`:
   every path in the Migration retention manifest still exists, each allowlisted
   agent and required skill remains registered, and target-stack references were
   not rewritten to match the legacy source.

#### 5.4 — Domain Vocabulary Scan

Re-open the Step 4.5 checklist. For every file marked `[x]`:

1. Grep the file for the OLD project's business nouns identified in Step 1 (e.g., `Request`, `Sample`, `Account` or whatever the original domain was) in variable names, function names, type/interface names, and prose.
2. If any old-domain term remains in an example that isn't the detected new project's own vocabulary → fix it now. This is the check that specifically catches drift like `skills/quality/SKILL.md` keeping `activeRequests`/`ISample` untouched.
3. Stack-agnostic files (`quality`, `caveman`, `arc42`, `project-overview`) are NOT exempt — check them too.

#### 5.5 — Verification Report

Output a brief verification result:

```
Coherence check:
  Skills: [N] verified, [M] rewritten
  Agents: [N] verified, [M] fixed
  Domain vocabulary: [N] files scanned, [M] had leftover old-domain examples fixed
   Frontend apps package: [accepted/rejected] — [targets and validation result]
  Cross-refs: [issues found or "all consistent"]

  [List any remaining issues that need user input]
```

If ALL checks pass, proceed to Step 6 (Prune). If issues are found that cannot be auto-fixed (ambiguous stack, multiple possible interpretations), list them and ask the user.

---

### Step 6: Prune Unused Files

#### Step 6.0: Remove a Rejected Mobile Installer (MANDATORY)

This step is separate from general stack-based pruning. If Step 1.5 recorded
`Mobile package: rejected`, run the following from the workspace root with the
`execute` tool, even when `--keep-all` is present. If `--dry-run` is active, do
not execute it; report both paths as planned deletions instead:

```bash
rm -rf -- .github/frontend-apps
rm -f -- .github/prompts/init-apps.prompt.md
[[ ! -e .github/frontend-apps && ! -e .github/prompts/init-apps.prompt.md ]]
```

The fixed paths above are the complete deletion allowlist for this decision. Do
not substitute variables, globs, parent directories, application paths, or native
project paths. The recursive deletion applies to every file and subdirectory under
`.github/frontend-apps/` only.

After the command succeeds, use read/search tools to independently verify both
paths are absent and record:

```text
Rejected mobile cleanup: passed
- .github/frontend-apps/: absent
- .github/prompts/init-apps.prompt.md: absent
```

If either path remains, STOP and report the cleanup failure. Do not continue to
model synchronization or claim `/init-github` completed. Do not request another
confirmation: the Step 1.5 `No` selection already authorized these two deletions.

#### Step 6.1: General Stack-Based Pruning

Remove customization files that have **no use** in the detected project. Skip only
this Step 6.1 when `--keep-all` is passed; Step 6.0 still runs for a rejected mobile
installer.

When `Initialization mode: MIGRATION`, subtract every path in the Migration
retention manifest, including descendants and transitive dependencies, before
building the candidate list. Source-stack absence is not evidence that a
target-runtime capability is unused. A protected migration path can never appear in the pruning preview
or deletion plan. To remove migration support, rerun a
standard initialization and approve its complete deletion plan; do not switch
modes implicitly during this run.

**Pruning matrix:**

| Condition (clearly absent from stack)                           | Delete                                                                                                                                         |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| No i18n library and no `locales/` folder                        | `agents/i18n.agent.md`, `skills/i18n/`                                                                                                         |
| No test framework (no vitest/jest/playwright config or dep)     | `agents/test.agent.md`, `skills/testing/`                                                                                                      |
| No backend API integration (no HTTP client/helpers, no OpenAPI) | `agents/api.agent.md`, `skills/api/`                                                                                                           |
| No global state solution (no store folder, no state lib)        | `agents/store.agent.md`, `skills/state-management/`                                                                                            |
| No GitLab and no GitHub CLI workflow wanted                     | `agents/merge-request.agent.md`                                                                                                                |
| No explicit request for Git setup on generated targets          | `skills/git-independence/`; cascade its optional references while preserving the no-Git rules                                                  |
| Stack template chosen (e.g., TailwindCSS or Pinia selected)     | Only non-matching `skills/skills-templates/*` variants, after the selected variant has been promoted and validated as an active skill          |
| Prompt depends on a deleted capability                          | The dependent prompt (e.g., delete nothing core: `/init-github`, `/plan`, `/memory`, `/learnings`, `/skills`, `/refresh-overview` always stay) |

**`create-migration-skill-pack.prompt.md` is never an automatic pruning candidate.** It is a
template-maintenance tool (authors a reusable migration skill pack) and is independent of the
detected stack — it stays useful even when the current project is not the migration prompt's
target framework. Never fold it into a framework-specific bucket (e.g., "delete i18n/state
management files") or into the migration-retention logic above. Always ask about it on its own,
explicitly, for example:

```
Q: This project also ships `/create-migration-skill-pack`, a template-maintenance prompt for
   authoring legacy-to-[framework] migration tooling (unrelated to your detected [stack]).
   Keep it available for future migration work, or remove it now?
A: [ ] Keep   [ ] Remove
```

Only delete it if the user explicitly chooses removal in that dedicated question.

**Pruning rules:**

1. **Confirm before deleting** — present the full general-pruning deletion list to
   the user and wait for explicit approval (this is a destructive operation per
   `GUARDRAILS.md` §2). With `--dry-run`, only list candidates. This confirmation
   does not apply to Step 6.0, which was already authorized by the Step 1.5 `No`
   selection.
2. **Clearly absent only** — delete when the technology is verifiably missing (not in `package.json`, no config file, no matching folder). If ambiguous → keep + mark "Optional". A detected technology is never a pruning candidate.
3. **Ask about migration tooling separately** — `create-migration-skill-pack.prompt.md` must be
   raised in its own question (see above), never silently bundled with unrelated framework-specific
   deletions or with the migration-retention manifest.
4. **Cascade the cleanup** — after deleting a file, remove ALL references to it:
   - Routing rows in `ROUTER.md` (intent matrix, model routing)
   - Tool matrix rows in `TOOLS.md`

- `MODEL-SYNC` manifest assignments in `MODELS.md`; defer regeneration until Step 7
- Tables in `ORCHESTRATORS.md`, `SKILLS-DIGEST.md`, `copilot-instructions.md`
- Dispatch/delegation references in orchestrator agents (`feature`, `refactor`, `planner`)
- Capability checks in prompts such as `check-impact.prompt.md`
- Capability-specific rows or rules in `GUARDRAILS.md`
- Structure trees and tables in `README.md` / guides if present

5. **Never prune**: core pipeline files (`copilot-instructions.md`, `GUARDRAILS.md`, `ROUTER.md`, `TOOLS.md`, `MEMORY.md`, `MODELS.md`, `ORCHESTRATORS.md`), `.github/scripts/sync-agent-models.sh`, `memory/` contents, orchestrators (`planner`, `feature`, `refactor`), `overview.agent.md`, and cross-cutting skills (`quality`, `accessibility`, `caveman`, `project-overview`).
   When a legacy source candidate exists or the user confirms migration intent,
   also retain `migration.agent.md`, `migrate-frontend.prompt.md`,
   `migration-overview`, `source-analysis`, `nuxt3-scaffold`,
   `fastapi-scaffold`, `component-mapping`, `local-run`,
   `vuetify-migration`, the PrimeVue/Vuetify component templates, the
   TailwindCSS/UnoCSS styling templates, all agents in the migration orchestrator
   allowlist, and their required component, state, API, i18n, testing, styling,
   accessibility, and quality skills. Do not apply source-stack absence pruning
   to target implementation resources before the migration specification and
   explicit UI/styling decisions determine which are unnecessary.
   If neither condition applies, these migration resources may be proposed for
   pruning with the same explicit confirmation required above.
6. **Frontend apps is decision-driven** — never infer rejection from missing
   dependencies. On acceptance, `/init-apps` owns platform selection and cleanup;
   on rejection, Step 6.0 must recursively remove its staged folder and remove its
   prompt after core validation.
7. **`skills-templates/` consumed only after promotion** — delete the whole
   `skills-templates/` folder only after every selected template has been
   promoted/adapted into a real active skill, registered in `SKILLS-DIGEST.md`,
   and verified in Step 5. Record each mapping in the pruning preview, for
   example: `styling-tailwindcss -> skills/tailwindcss/SKILL.md`. If a selected
   template is missing, invalid, or not yet promoted, retain the entire folder
   and stop for repair; never delete it as cleanup.
8. **Delete approved skill paths completely** — when the approved pruning plan
   names a skill directory, delete that complete directory and its contents. Do
   not delete only its `SKILL.md` and leave the directory behind. Never broaden
   the approved paths.

#### Step 6.2: Remove Empty Skill Directories (MANDATORY)

After all mobile and general pruning, remove empty descendant directories under
`.github/skills/`. Run this even with `--keep-all`, because it removes no files or
customization content. Preserve `.github/skills/` itself and every non-empty
directory:

```bash
if [[ -d .github/skills ]]; then
  find .github/skills -mindepth 1 -depth -type d -empty -print -delete
  remaining_empty_skill_dir=$(find .github/skills -mindepth 1 -type d -empty -print -quit)
  [[ -z "$remaining_empty_skill_dir" ]]
fi
```

For `--dry-run`, list the empty directories that would be removed but do not use
`-delete`. The `-mindepth 1` boundary is mandatory: never delete the
`.github/skills/` root. Do not follow or delete symbolic links.

Use read/search tools to verify that every remaining directory below
`.github/skills/` contains at least one file or non-empty descendant. Record
`Empty skill-directory cleanup: passed`. If an empty directory remains, STOP
before model synchronization and report its path.

#### Step 6.3: Verify Migration Retention (MANDATORY IN MIGRATION MODE)

When `Initialization mode: MIGRATION`, verify the retained runtime after all
cleanup and before model synchronization:

1. Check every path in the Migration retention manifest still exists; directory
   entries must retain all inventoried descendant files.
2. Re-read `migration.agent.md`. Check that every `agents:` entry resolves to an
   agent file and every Required Skills entry resolves to a retained `SKILL.md`.
3. Check that `migrate-frontend.prompt.md`, `ROUTER.md`, `MODELS.md`, and
   `SKILLS-DIGEST.md` still register the orchestrator, prompt, and required skills.
4. Check the pruning log and require zero protected paths in its candidate and
   deleted sets.
5. Run the retained detector against a temporary directory containing no source
   and require `detector_contract=generic-ast-v1` with `status=not-found`. Run the
   AST builder against a temporary valid Python source and require
   `ast_contract=normalized-ast-v1`, `status=complete`, and `files_blocked=0`.
   These contract probes distinguish a complete runtime from an older internally
   self-consistent package.

Record `Migration retention check: passed` with the number of protected files and
directories checked. If any check fails, STOP before Step 7 and report the missing
path or dangling reference. In standard mode, record
`Migration retention check: not applicable (STANDARD)`.

---

### Step 7: Write Files

Use available file-editing tools to write the updated content for each file.

**Order matters:**

1. `.github/copilot-instructions.md` — global instructions + Project Profile first
2. `.github/GUARDRAILS.md`, `.github/ROUTER.md`, `.github/TOOLS.md`, `.github/MEMORY.md` — pipeline modules
3. `.github/MODELS.md` — preserve the manifest format; update candidate names only after verifying the target's available model picker names, and remove assignments for pruned agents/prompts
4. `.github/skills/SKILLS-DIGEST.md` — digest index
5. `.github/skills/*/SKILL.md` — all skills
6. `.github/agents/*.agent.md` — all agents
7. `.github/prompts/*.prompt.md` — retained prompts only (including this
   `init-github.prompt.md` itself — keep it generic so it works again in the
   future). Never recreate `.github/prompts/init-apps.prompt.md` or any path under
   `.github/frontend-apps/` after Step 6.0 removed them.
8. **Final skill-directory check** — after every file operation above, rerun the
   Step 6.2 verification and require no empty descendant under `.github/skills/`.
   In migration mode, also rerun Step 6.3 and require
   `Migration retention check: passed`.
9. `.github/scripts/sync-agent-models.sh` — preserve the generic support script,
   then run these commands from the workspace root:

   ```bash
   bash .github/scripts/sync-agent-models.sh
   bash .github/scripts/sync-agent-models.sh --check
   ```

   This is the final executable gate. Run it directly with the `execute` tool;
   do not ask the user to run it. Do not continue to Step 8 unless `--check`
   exits successfully. After this point, do not edit `MODELS.md` or managed agent
   and prompt frontmatter. Retain the exit code and final output from both commands
   as completion evidence; intending to run them or merely printing the commands
   does not satisfy this gate.

**When writing:**

- Preserve YAML frontmatter (`---` blocks at the top of agents/prompts).
- Preserve Markdown structure and tables.
- Preserve the "Concision and Minimalism (Always On)" section and its
  `caveman`/`ponytail` explicit-mode references; they are framework-agnostic.
- Keep generic workflow structures (e.g., the `/history`, `/learnings`, `/thought` workflows are mostly project-agnostic — only update file paths if they differ).
- Never edit generated `model:` frontmatter by hand. Edit `.github/MODELS.md`, run its synchronizer, then run `bash .github/scripts/sync-agent-models.sh --check` before reporting completion.

---

### Step 8: Report

Output a concise summary:

```
/init-github completed.
Project detected: [Project Name] — [Framework] / [Language]
Import safety: [legacy source prepared / no previous .github]
Initialization mode: [STANDARD / MIGRATION]
Migration mode: [USER CONFIRMED / INACTIVE]
Migration timing: [NOW / LATER / NONE]
Migration runtime contracts: [generic-ast-v1 / normalized-ast-v1 / not applicable]
Migration retention check: [passed — N protected paths / not applicable (STANDARD)]
Frontend apps package: [accepted: iOS / Android / both, or rejected]
Rejected mobile cleanup: [passed with both paths absent / not applicable]
Empty skill-directory cleanup: passed
Skills updated: [count]
Agents updated: [count]
Prompts updated: [count]
Pruned (unused): [list of deleted files, or "none"]
Model synchronization: passed — [sync output; --check output]

Per-file adaptation checklist (Step 4.5):
[x] skills/quality/SKILL.md — domain examples adapted
[x] skills/testing/SKILL.md — tech-stack + domain examples adapted
[x] agents/component.agent.md — folder paths updated
... (one line per file in the Step 2 inventory — every file must show [x])

Key changes:
- Framework: [old] → [new]
- State: [old] → [new]
- Styling: [old] → [new]
- Testing: [old] → [new]
- i18n: [old] → [new]
- Frontend apps: [installed targets and merged surfaces, or "staged package removed by user choice"]
- Domain vocabulary: [old domain nouns] → [new domain nouns, or "generic"]

Next: Run `/refresh-overview` (if available) to index the new project structure.
```

If any detections were "Unknown", list them and ask the user to review those specific skills/agents.

### Step 9: Migration Handoff

Run this step only after every initialization gate in Steps 0-8 has passed.

- `Migration timing: NOW`: read
  `.github/prompts/migrate-frontend.prompt.md` and execute that workflow in this
  same session from its Initialization Preflight onward. Do not merely tell the
  user to invoke it, and do not skip its source, UI-library, styling-library,
  backend, target-path, or approval gates.
- `Migration timing: LATER`: do not create a migration target. Report that the
  protected runtime is ready and that `/migrate-frontend` starts it later.
- `Migration timing: NONE`: finish after the initialization report.

## Important Rules

- **Never assume the old stack**: If you can't detect a technology, generify rather than carry over Nuxt/Vue assumptions.
- **Preserve file structure**: Keep the same `.github/` layout (copilot-instructions.md, agents/, prompts/, skills/) so it remains a drop-in template.
- **Keep init-github itself reusable**: When rewriting this file, keep the command name `/init-github` and the workflow intact so it can be run again later.
- **Prune only what is clearly absent**: Verified-missing tech → delete (Step 5, with user confirmation). Ambiguous → keep and mark "Optional — update manually". `--keep-all` disables pruning.
- **Confirmed migration intent outranks source-stack absence**: either migration
  timing makes the Migration retention manifest immutable for that run. Never
  prune a protected path because Nuxt, FastAPI, a UI library, or a styling library
  is not installed in the legacy source. Detection recommends an answer but never
  answers the roadmap question for the user.
- **Frontend apps is the exception to detection-based pruning**: the explicit
  Step 1.5 answer controls its staged package. Never infer rejection from missing
  dependencies or native folders, never bypass `/init-apps` for acceptance, and
  never skip Step 6.0 after rejection.
- **Deletions always cascade**: Never leave dangling references in ROUTER, TOOLS, ORCHESTRATORS, SKILLS-DIGEST, or orchestrator agents after pruning.
- **No empty skill directories**: Step 6.2 must remove and verify every empty
  descendant of `.github/skills/` before completion.
- **Every skill and agent is reviewed individually, one by one — no exceptions**: Discovering the file list dynamically (Step 2) is not enough; each file in that inventory must actually be opened, adapted, and checked off (Step 4.5) before the run is considered complete. "No tech-stack references found" is never a reason to skip a file — its domain-example vocabulary still needs review.
- **Stack-agnostic ≠ nothing-to-adapt**: `quality`, `caveman`, `arc42`, `project-overview` and similar cross-cutting skills rarely need tech-stack swaps, but their code examples almost always carry the old project's business-domain naming. Treat this as a first-class adaptation category, not an edge case.
