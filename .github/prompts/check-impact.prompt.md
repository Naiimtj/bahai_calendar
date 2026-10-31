---
description: 'Analyze recent code changes and identify which .github/ files are affected indirectly'
name: 'check-impact'
argument-hint: "Optional: commit hash, branch name, or timeframe (e.g. '7 days', 'HEAD~5', 'development'). If omitted, you will be asked."
tools: [read, search, execute]
# Generated from .github/MODELS.md by .github/scripts/sync-agent-models.sh. Do not edit.
model: ["GPT-5.3-Codex", "GPT-5.6 Luna"]
---

# /check-impact — .github Indirect Impact Checker

## Purpose

Scan recent codebase changes (outside `.github/`) and detect which `.github/` files
are indirectly affected — because agents, skills, and configurations reference things
like file structure, component names, store patterns, API contracts, and conventions.

Run this after:

- `git merge` or `git pull` from another branch
- A sprint with significant structural changes (new stores, components, pages)
- Before creating a merge request that touches architecture

**This prompt is read-only.** It generates a report and recommends actions.
It does NOT modify any file.

---

## Step 0 — Ask for scope

**Before doing anything else**, check if the user already provided an argument (commit hash, branch name, or timeframe).

- **If yes** — skip this step and proceed directly to Step 1 using that argument.
- **If no** — ask exactly this question and **wait for the answer** before continuing:

> How many days back do you want to analyze?
> (You can also provide a commit hash, branch name, or number of commits — e.g. `14`, `development`, `HEAD~10`, `abc1234`)

Once the user replies, proceed to Step 1 with their input.

---

## Step 1 — Determine scope

Use the argument from Step 0 (or the one passed directly).
If the user gave a plain number, treat it as days (e.g. `14` → `--since="14 days ago"`).
If no input was given, default to 7 days.

Run the appropriate git command:

```bash
# Default (last 7 days)
git log --oneline --since="7 days ago" --all

# Specific merge commit
git show <commit> --stat

# Diff between branches
git diff <branch>..HEAD --name-only

# Last N commits
git log --oneline -N --name-only
```

Collect the **full list of changed files**, excluding `.github/` itself.

---

## Step 2 — Categorize changed files

Derive a path map before classifying. Read the Project Profile and project-overview
skill, inspect root manifests/configuration, and use the changed paths themselves.
Record actual paths for every detected role; never assume `src/`, `app/`, `pages/`,
or a framework-specific extension.

| Category                      | Detection signal                                               | Severity if new/renamed/deleted |
| ----------------------------- | -------------------------------------------------------------- | ------------------------------- |
| State/store                   | State library imports, store naming, or documented state roots | HIGH                            |
| Composable/hook               | Reusable reactive or hook naming and documented logic roots    | HIGH                            |
| Utility                       | Pure/helper roots and imports                                  | HIGH                            |
| Base/design-system component  | Component roots identified as primitives or base wrappers      | HIGH                            |
| Shared/feature component      | Component roots and import usage                               | MEDIUM                          |
| Page/route/layout             | Router configuration or framework route conventions            | HIGH                            |
| Interface/type/schema         | Type roots and exported contracts                              | MEDIUM                          |
| Middleware/plugin             | Framework registration and middleware roots                    | MEDIUM                          |
| HTTP/API helper               | Shared HTTP client, auth wrapper, or request helper imports    | CRITICAL                        |
| Dependency manifest           | Detected package/dependency manifests and lockfiles            | HIGH                            |
| Framework/styling/test config | Files loaded by detected framework and scripts                 | MEDIUM                          |
| Non-structural                | No durable routing, contract, convention, or path impact       | LOW                             |

For each changed file, record: **Added / Modified / Deleted / Renamed**.

---

## Step 3 — Cross-reference with .github/ files

For each category with HIGH or CRITICAL severity changes, check the corresponding `.github/` file:

### 3a. Structural changes → `project-overview/SKILL.md`

Read `.github/skills/project-overview/SKILL.md`.

Check for each changed file:

- **Added** → Is it listed in the overview? If not → needs `/refresh-overview`
- **Deleted** → Is it still listed? If yes → needs removal via `/refresh-overview`
- **Renamed** → Is the old name still in the overview? → needs update

### 3b. New/changed base components → detected design-system/component skill

Locate the installed skill that owns components or the design system from
`SKILLS-DIGEST.md`. If none exists, report the missing coverage instead of
inventing a path.

Check:

- Any new base/atomic component → should appear in the component list
- Any deleted base component → should be removed from the list
- Look for usage examples that reference renamed components

### 3c. API pattern changes → `api/SKILL.md` + `agents/api.agent.md`

If the detected shared HTTP client or auth helper changed significantly:

- Read `.github/skills/api/SKILL.md`
- Compare documented helper signatures with the actual exported functions
- Check if the environment URL detection pattern in the skill matches the code

If new store/service files were added that call APIs:

- Verify the pattern shown in `api/SKILL.md` (store integration section) still matches

### 3d. State/store pattern changes → `state-management/SKILL.md`

If any `stores/*.ts` changed significantly (not just new computed/actions but structural pattern change):

- Read `.github/skills/state-management/SKILL.md`
- Check if the documented store pattern is still the project standard
- Check if the documented state exposure pattern is still used

### 3e. Test setup changes → `testing/SKILL.md`

If a detected test configuration, setup file, fixture root, or mock root changed:

- Read `.github/skills/testing/SKILL.md`
- Check if documented mock setup and state initialization patterns are still accurate

### 3f. Styling/config changes → `styling/SKILL.md`

If a detected styling, theme, or design-token configuration changed:

- Read `.github/skills/styling/SKILL.md`
- Check if the color token table and reusable class table are still accurate

### 3g. Dependencies → `copilot-instructions.md` Project Profile

If `package.json` (or `pyproject.toml`, `Cargo.toml`, etc.) changed:

- Read the changed manifest with a structured parser or file-reading tool and
  identify framework, UI, state, i18n, HTTP, and test dependencies
- Compare against the Project Profile table in `.github/copilot-instructions.md`
- Flag any version mismatches

### 3h. Layout changes → `copilot-instructions.md` Layouts section

If a page or view component changed (added/deleted):

- Check the "Layouts & Pages" section in `copilot-instructions.md`
- Verify listed layouts still exist

### 3i. Feature folder renames → agent file scopes → `TOOLS.md`

If the diff reports a major feature-folder rename:

- Read `.github/TOOLS.md`
- Check if any agent's file scope declaration references the old path

## Step 4 — Generate impact report

Output the following structured report:

```
# .github Impact Report — [current date]
Scope: [commits/timeframe analyzed]
Files changed (outside .github/): [count]

---

## ✅ No impact ([count] files)
Files that changed but have no .github/ reference.
[list file names only, one per line]

---

## ⚠️ Needs review ([count] files)

For each affected file:

### [filename] ([Added|Modified|Deleted|Renamed])
- Category: [Store / Composable / Base Component / etc.]
- .github/ file affected: [path]
- Reason: [specific explanation — e.g., "new store not listed in project-overview"]
- Recommended action: [run /refresh-overview | update skill X | update agent Y]

---

## 🔴 Breaking / critical ([count] files)
Changes where .github/ guidance is now WRONG or MISLEADING.

### [filename] ([Modified])
- Category: [e.g., HTTP composable]
- .github/ file affected: [path]
- Reason: [e.g., "useGet() signature changed — api/SKILL.md shows old API"]
- Recommended action: [specific edit needed]

---

## 📋 Summary of recommended actions

Priority order (do these first):

1. [action] — [why]
2. [action] — [why]
...

Prompts to run:
- /refresh-overview  (if any store/composable/util/page/component was added or removed)
- /learnings         (if a non-obvious pattern or gotcha was discovered)
```

---

## Rules

1. **Read-only** — do NOT modify any file, only report
2. **Focus on indirect impact** — skip files that only changed internal logic with no structural/naming effect
3. **Severity = scope of the change** — a renamed store is more impactful than a modified one
4. **When unsure** — mark as ⚠️ Needs review, not ✅ No impact
5. **Skip test files** as changed targets — they don't affect `.github/` (they are affected BY `.github/skills/testing/SKILL.md`, not the reverse)
6. **If no changes found** — report "No indirect impact detected" and suggest running `/refresh-overview` as a sanity check
