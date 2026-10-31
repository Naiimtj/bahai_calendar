---
description: 'Before committing, inspect every staged and unstaged code change against HEAD and keep .github skills, agents, configuration, and memory aligned with the real project.'
name: 'update-github'
argument-hint: 'Optional file path or glob. When omitted, analyze every staged and unstaged change reported by git status against HEAD.'
tools: [read, search, edit, execute]
# Generated from .github/MODELS.md by .github/scripts/sync-agent-models.sh. Do not edit.
model: ["GPT-5.3-Codex", "GPT-5.6 Luna"]
---

# /update-github - Synchronize .github Before a Commit

## Purpose

Before `git commit`, application code may have changed while `.github/` still
describes the previous structure or behavior. This prompt reads every uncommitted
change through `git diff HEAD`, identifies durable structural impact, and proposes
the smallest required updates to Copilot customization.

Unlike chat-derived updates, this workflow treats the actual working tree diff as
the source of truth.

---

## Step 0 - Collect Current Changes

Run:

```bash
git status --short
git diff HEAD --name-only
git diff HEAD --stat
```

If the user supplied paths or a glob, limit analysis to matching changed files.
If there are no changes, report `nothing to synchronize` and stop.

Classify:

- **Modified files** (`M`) - compare with HEAD
- **New files** (`??` or `A`) - read in full because no HEAD version exists
- **Deleted files** (`D`) - search `.github/` for stale references

Always exclude files inside `.github/`; they are update targets, not source changes.

---

## Step 1 - Read and Classify Every Changed File

For every changed source file, run `git diff HEAD -- <file>` and answer:

| Question                                                             | Why it matters                                              |
| -------------------------------------------------------------------- | ----------------------------------------------------------- |
| Was a function, endpoint, component, type, or class removed?         | Skills or agents may hold stale references                  |
| Was one added or renamed?                                            | Project maps, scopes, or reusable guidance may need updates |
| Did an API contract change (URL, method, request, response)?         | API agent and skill accuracy                                |
| Did a reusable pattern, abstraction, helper, or anti-pattern change? | Skills may need durable guidance                            |
| Was a structural decision made (keep, reject, or default)?           | Candidate for `decisions.md`                                |
| Did a non-obvious environment-specific issue emerge?                 | Candidate for `learnings.md`                                |

Skip files whose changes are purely internal implementation details with no durable
effect on `.github/` guidance.

---

## Step 2 - Cross-Reference `.github/`

For every structural change from Step 1, inspect the relevant customization files.

**Skills** (`skills/*/SKILL.md`, `skills/SKILLS-DIGEST.md`):

- Mark references to removed functions, endpoints, components, or types as stale.
- Mark descriptions of changed patterns for focused updates.
- Propose newly proven reusable patterns only when the diff provides evidence.

**Agents** (`agents/*.agent.md`):

- Update workflows that reference removed steps, paths, or contracts.
- Add an agent rule only when the changed code establishes durable behavior.

**Memory** (`memory/learnings.md`, `decisions.md`, `conventions.md`, `glossary.md`):

- Non-obvious gotcha -> `learnings.md`
- Architectural decision -> `decisions.md`
- Confirmed convention -> `conventions.md`
- New domain term -> `glossary.md`

**Config** (`copilot-instructions.md`, `ROUTER.md`, `TOOLS.md`):

- New dependency, path, command, or stack fact -> Project Profile
- Changed agent scope or tool permission -> `TOOLS.md`
- New or removed specialization -> `ROUTER.md`, `MODELS.md`, and related registries

---

## Step 3 - Build and Confirm the Proposal (No Writes Yet)

```
# /update-github - Proposed Update (YYYY-MM-DD)
Git files analyzed: [N] | Structural changes: [N] | No .github impact: [N]
Required updates: [N]

| # | Changed file | Evidence | .github target | Exact action | Stale/New |
|---|---|---|---|---|---|
| 1 | src/api/products.ts | removed `getAllProducts` | skills/api/SKILL.md | remove its endpoint reference | Stale |
| 2 | src/composables/useProducts.ts | added shared retry policy | skills/api/SKILL.md | add verified retry rule under Error Handling | New |
```

For every row, show the exact text to insert, replace, or remove and the precise
target path plus section heading.

If no update is required, report that result and stop. Otherwise ask:

> Apply exactly this `.github/` synchronization plan? (yes/no)

On `no`, stop without writes. If new evidence changes the plan, show the revised
plan and ask again before editing.

---

## Step 4 - Apply

1. Apply approved skill, agent, and configuration changes with focused edits. Do
   not rewrite complete files.
2. Memory writes require their own guardrail confirmation even after the plan is
   approved. Show each exact entry, wait for explicit approval, then write it.
   Format: `- **Title** - one-line description. (YYYY-MM-DD)`
3. Preserve existing section structure and unrelated content.
4. Never delete a customization file in this workflow. Report file-level removals
   as a separate proposal requiring the appropriate guarded workflow.
5. Run the narrowest relevant validation, including model synchronization when
   `MODELS.md` or managed agents/prompts changed.

---

## Step 5 - Final Report

```
# Synchronized
- [file]: [what changed] (skill | agent | memory | config)

# No Update Needed
- [file] - [reason: internal only, already documented, and so on]

# Validation
- [command/check]: [result]
```

---

## Rules

1. **Code is the source of truth** - remove documentation for behavior that no longer exists.
2. **Use focused edits** - update only the stale or newly required line or section.
3. **Skills and agents before memory** - reusable operational rules belong in skills; memory stores verified decisions and gotchas.
4. **One home per fact** - do not duplicate the same guidance across files.
5. **Confirm memory writes separately** - show exact entries and wait for approval.
6. **Skip internal-only changes** - no durable `.github/` impact means no update.
7. **Never delete files here** - add or edit only.
8. **Always inspect the real diff** - never infer working tree changes from chat context.
