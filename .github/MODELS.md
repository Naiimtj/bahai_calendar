# Models - User-Selected Runtime Configuration

This file is the **only editable source of truth** for model selection in this
template. The aliases `cheap`, `medium`, and `expensive` describe task cost and
reasoning needs. VS Code does not resolve those aliases: when `model:` metadata is
present, agent and prompt frontmatter must contain exact names from the user's
model picker.

Model availability belongs to the user's VS Code account and can change. A
Markdown prompt has no portable API that can enumerate that private picker list,
so `/init-github` uses an authoritative runtime catalog when exposed. Otherwise it
shows three editable starter recommendations and treats the user's single approval
as confirmation that the shown exact names are visible. It never invents
availability or asks the user to transcribe the whole picker before showing options.

> **Mapping status:** CONFIRMED BY USER - 2026-09-23. `/init-github` replaces
> this line with `CONFIRMED BY USER - YYYY-MM-DD` only after the user approves the
> exact picker-name mapping.

## Workflow

1. Let `/init-github` show the proposed `cheap`, `medium`, and `expensive` rows. If
   runtime metadata exposes its exact name, the active chat model is proposed for
   `medium` and as the default.
2. Select `Use recommendations`, select `Use active model only`, or type an inline
   edit in the selector's optional custom field. That one selection confirms
   availability and approves the mapping.
3. Edit the canonical manifest below when a picker name, fallback, or assignment changes.
4. Run `bash .github/scripts/sync-agent-models.sh` from the workspace root.
5. Run `bash .github/scripts/sync-agent-models.sh --check` before committing or publishing.

`--check` fails when any generated frontmatter does not match this manifest.

While the mapping status is `UNCONFIRMED`, the synchronizer removes managed
`model:` metadata so every customization safely uses the active picker model.
After confirmation, it generates a prioritized `[primary, fallback]` list for both
`.agent.md` and `.prompt.md` files. VS Code uses the first available candidate. If
the user has only one suitable model, repeat it as both candidates.

`init-github.prompt.md` and `init-apps.prompt.md` intentionally have no `model:`
field. `/init-github` starts with the model selected in chat and configures this
file. `/init-apps` may be copied into an established configuration with a different
model convention, so it resolves that convention during its preflight. Every other
prompt and agent is assigned below.

## Profile Intent

| Profile     | Use when                                                                 | Selection guidance                          |
| ----------- | ------------------------------------------------------------------------ | ------------------------------------------- |
| `cheap`     | Mechanical, repetitive, or read-only work                                | Lowest-cost capable coding model            |
| `medium`    | Implementation, multi-file reasoning, and routine architecture           | Active chat model; recommended default      |
| `expensive` | Complex orchestration, ambiguous architecture, or failed medium attempts | Strongest available reasoning/agentic model |

The starter candidates below are recommendations, not claims about availability.
During initialization, the user can confirm all three, collapse every profile to
the active model, or replace unavailable recommendations in the selector's custom
field. The fallback should normally be the next cheaper confirmed model.

## Canonical Model-Sync Manifest

Do not add model candidates or profile assignments outside this block. The format
is `profile|id|primary model|fallback model` and
`assignment|relative path|profile`.

```text
<!-- MODEL-SYNC:START -->
# profile|id|primary model|fallback model
profile|cheap|GPT-5.6 Luna|GPT-5.3-Codex
profile|medium|GPT-5.3-Codex|GPT-5.6 Luna
profile|expensive|GPT-5.6 Sol|GPT-5.3-Codex
# assignment|relative path|profile
assignment|agents/api.agent.md|medium
assignment|agents/component.agent.md|medium
assignment|agents/feature.agent.md|expensive
assignment|agents/i18n.agent.md|cheap
assignment|agents/legacy-merger.agent.md|medium
assignment|agents/merge-request.agent.md|cheap
assignment|agents/native.agent.md|medium
assignment|agents/overview.agent.md|cheap
assignment|agents/planner.agent.md|medium
assignment|agents/refactor.agent.md|medium
assignment|agents/reviewer.agent.md|medium
assignment|agents/store.agent.md|medium
assignment|agents/test.agent.md|medium
assignment|prompts/check-impact.prompt.md|medium
assignment|prompts/history.prompt.md|medium
assignment|prompts/learnings.prompt.md|medium
assignment|prompts/memory.prompt.md|medium
assignment|prompts/modelUsage.prompt.md|medium
assignment|prompts/plan.prompt.md|medium
assignment|prompts/refresh-overview.prompt.md|medium
assignment|prompts/skills.prompt.md|cheap
assignment|prompts/thought.prompt.md|cheap
assignment|prompts/update-chat-github.prompt.md|medium
assignment|prompts/update-github.prompt.md|medium
assignment|prompts/verify-legacy-merge.prompt.md|medium
<!-- MODEL-SYNC:END -->
```
