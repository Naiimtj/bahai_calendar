---
description: 'Analyze recent code changes and identify which .github/ files are affected indirectly'
name: 'check-impact'
argument-hint: "Optional: commit hash, branch name, or timeframe (e.g. '7 days', 'HEAD~5', 'development'). If omitted, you will be asked."
tools: [read, search, run]
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

Classify each changed file by type using these path patterns (all relative to `src/`).

| Category          | Path pattern                                                | Severity if new/renamed/deleted |
| ----------------- | ----------------------------------------------------------- | ------------------------------- |
| Context / state   | `src/context/*.jsx`                                         | HIGH                            |
| Hook              | `src/hooks/use*.js`                                         | HIGH                            |
| Utility           | `src/utils/*.js`                                            | HIGH                            |
| lib (date logic)  | `src/lib/*.jsx`                                             | HIGH                            |
| Service           | `src/services/*.js`                                         | CRITICAL                        |
| Base component    | `src/components/base/Base*.jsx`                             | HIGH                            |
| Feature component | `src/components/*.jsx`                                      | MEDIUM                          |
| Calendar view     | `src/components/{Badi,Compact,Gregorian,Mixed}Calendar.jsx` | HIGH (cross-calendar parity)    |
| i18n locale       | `src/i18n/locales/*.json`                                   | MEDIUM                          |
| App shell / entry | `src/App.jsx`, `src/main.jsx`                               | HIGH                            |
| Dependencies      | `package.json`                                              | HIGH                            |
| Build config      | `vite.config.js`                                            | MEDIUM                          |
| Styling / theme   | `src/index.css`                                             | MEDIUM                          |
| Capacitor / iOS   | `capacitor.config.ts`, `ios/**`                             | MEDIUM                          |
| Non-structural    | anything else                                               | LOW                             |

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

### 3b. New/changed base components → `components/SKILL.md`

Read `.github/skills/components/SKILL.md`.

Check:

- Any new base/atomic component → should appear in the component list
- Any deleted base component → should be removed from the list
- Look for usage examples that reference renamed components

### 3c. Data-access pattern changes → `api/SKILL.md` + `agents/api.agent.md`

If any file in `src/services/` changed significantly:

- Read `.github/skills/api/SKILL.md`
- Check if the service module list (`badiApi.js`, `sunTimesApi.js`, `geocodingApi.js`, `calendarSync.js`, `personalCalendar.js`) is still accurate
- Check if any new service was added and reflected in the skill

If new components/hooks call services directly (bypassing `src/services/`):

- Flag it — network calls belong in service modules per `api/SKILL.md`

### 3d. State/context pattern changes → `state-management/SKILL.md`

If any `src/context/*.jsx` changed significantly (new provider, changed action surface):

- Read `.github/skills/state-management/SKILL.md`
- Check if the provider pattern (createContext + provider + `useXxx()` hook) is still the standard
- Check if state is still exposed as read values + action functions with a memoized `value`

### 3f. Styling/theme changes → `styling/SKILL.md`

If `src/index.css` changed (new `@theme` tokens, new utilities):

- Read `.github/skills/styling/SKILL.md`
- Check if the theme-token guidance is still accurate

### 3g. Dependencies → `copilot-instructions.md` Project Profile

If `package.json` changed:

- Run: `cat package.json | grep -E 'react|vite|tailwind|i18next|axios|capacitor'`
- Compare against the Project Profile table in `.github/copilot-instructions.md`
- Flag any version or dependency mismatches

### 3h. App shell / view changes → `copilot-instructions.md` App Structure section

If `src/App.jsx` view routing changed (added/removed a page):

- Check the "App Structure & Routing" section in `copilot-instructions.md`
- Verify the described views/headers still match

### 3i. Feature folder renames → agent file scopes → `TOOLS.md`

If a major folder under `src/` was renamed:

- Read `.github/TOOLS.md`
- Check if any agent's file scope declaration references the old path

---

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
3. **Severity = scope of the change** — a renamed context/service is more impactful than a modified one
4. **When unsure** — mark as ⚠️ Needs review, not ✅ No impact
5. **If no changes found** — report "No indirect impact detected" and suggest running `/refresh-overview` as a sanity check
