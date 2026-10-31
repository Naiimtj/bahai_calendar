# Project Learnings

Knowledge base of verified, project-specific learnings. Managed via `/learnings`. Entry format: `- **Title** — one-line description. (YYYY-MM-DD)`. See `../MEMORY.md` for read/write policy.

## Gotchas

<!-- Non-obvious behaviors that cost debugging time -->

## Patterns

<!-- Reusable patterns confirmed to work in this codebase, not yet promoted to a skill -->

- **Keyword routing pre-filter (2026-06-26)** — Domain keywords select the matching agent before work: locale/translation/i18n routes to i18n; test/spec routes to test; store/state routes to store; component creation routes to component; API/HTTP routes to API; review routes to reviewer; cross-file refactors route to refactor. Resolve the confirmed profile and delegate through its fallback array without an unnecessary model-choice interruption.

## Mistakes

<!-- Mistakes the AI made that the user corrected — prevent repeats -->

- **⛔ Incorrectly discarded PostToolUse hooks (2026-06-15)** — Assumed VS Code PostToolUse hooks don't work in GitHub Copilot Chat without verifying. Discarded `.github-old/hooks/` during legacy merge. User caught the error. Rule: NEVER discard code based on assumptions — copy first, let user decide. If uncertain whether something applies, ASK. Now codified as GUARDRAILS.md §11. (2026-06-15)

- **⛔ Template files not adapted during init-github (2026-06-15)** — `/init-github` created `store.agent.md` and `test.agent.md` from generic templates with [TODO] placeholders and wrong stack references (createGlobalState instead of Pinia, Vitest instead of Jest). The correct RDCP-specific versions were in `.github-old/` but were not used. Root cause: legacy-merger agent merged only SOME files, but left others as generic templates. This was not detected until user requested full audit. Rule: ALWAYS verify template files were actually adapted after init-github, not just created with placeholders. Added verification checklist to legacy-audit skill. (2026-06-15)

- **⛔ Assumed api.agent.md was correctly merged (2026-06-15)** — `api.agent.md` differs by 150 lines between OLD (RDCP-specific with real URLs) and NEW (generic template with [TODO]). The generic template was used instead of merging RDCP content. This pattern repeated across multiple files. Root cause: No systematic diff verification in Phase 5 of legacy-audit protocol. Rule: EVERY merged file must have explicit diff verification showing what OLD content was integrated vs. what was kept from template. Marked api.agent.md for manual fusion. (2026-06-15)

- **Routing delegation violation (2026-06-12)** — An i18n task was processed directly instead of routing to the i18n specialist. Rule: check `ROUTER.md` before work, resolve the route's confirmed profile, and delegate without forcing a model so fallback remains available. (2026-06-12)

- **⛔ Used PC /memories/ for project rules (2026-06-12)** — Stored project-specific routing gate detail in VS Code persistent memory instead of `.github/memory/`. Rule: ALL project knowledge goes in `.github/memory/` of the repo. PC `/memories/` is ONLY for cross-project user preferences. (2026-06-12)

- **Orchestrators must preserve profile fallback (2026-06-12)** — When `ROUTER.md` selects an agent, delegate without forcing a model in the tool call. The generated candidate array owns first-available selection; direct parent execution is only a documented fallback or explicit user override. (2026-06-12)

## API & Backend Notes

<!-- Endpoint quirks, response shape surprises, auth behaviors -->

## Testing Notes

<!-- Mock setups, flaky-test causes, environment quirks -->
