# Router — Central Request Routing Layer

Single source of truth for deciding **which agent and which skills** handle a request. Model assignments are owned exclusively by `.github/MODELS.md`.

> Pipeline: **Guardrails check → Router (this file) → Planner (if multi-domain) → Agent(s) → Memory write-back**

---

## 1. Routing Decision Tree

```
User request
│
├── Is it a question (no code change)?
│     ├── About project structure / "where does X live?" → overview.agent.md (read-only)
│     └── General technical question → answer directly + relevant skill
│
├── Is it destructive / out of guardrails? → STOP, apply GUARDRAILS.md
│
├── Single domain? (only UI / only store / only API / only tests / only i18n)
│     → Route directly to the domain agent (Section 2)
│
├── Multi-domain NEW feature? → planner.agent.md → feature.agent.md
├── Multi-domain CHANGE to existing code? → planner.agent.md → refactor.agent.md
├── Git / MR workflow? → merge-request.agent.md
└── Ambiguous? → Ask ONE clarification question, then re-route
```

## 2. Intent → Agent Matrix

When a request matches a keyword or context below, select that specialized agent
and apply the routing and model workflow in `GUARDRAILS.md` section 0 before work.
Delegate without forcing a model so the agent's confirmed fallback array remains
effective. The parent may handle the task directly only when delegation is
unavailable or the user explicitly requests that override.

> After selecting an agent, resolve its profile and runtime candidates only from `.github/MODELS.md`. This router deliberately does not repeat model assignments.

| Intent signals (keywords / context)                                  | Agent                    | Mandatory skills                                                           |
| -------------------------------------------------------------------- | ------------------------ | -------------------------------------------------------------------------- |
| animation, motion, transition, microinteraction, gesture, drag/swipe | `component.agent.md`     | `components`, `styling`, `company-styling`, `quality`, `motion`, `animate` |
| component, UI, page, layout, widget, modal, styling, responsive      | `component.agent.md`     | `components`, `styling`, `company-styling`, `quality`, `accessibility`     |
| store, state, global state, getter, action, reactive data            | `store.agent.md`         | `state-management`                                                         |
| API, endpoint, fetch, HTTP, request/response, backend types, schema  | `api.agent.md`           | `api`                                                                      |
| Capacitor, native, iOS, Android, Xcode, Android Studio, `npx cap`    | `native.agent.md`        | `capacitor-native`                                                         |
| test, spec, mock, coverage, regression, failing test                 | `test.agent.md`          | `testing`                                                                  |
| translation, i18n, locale, label, language, $t(), add key            | `i18n.agent.md`          | `i18n`                                                                     |
| where is, what does, project structure, orientation                  | `overview.agent.md`      | `project-overview`                                                         |
| merge request, create MR, create PR, push branch                     | `merge-request.agent.md` | none                                                                       |
| review, code review, full review, multi-concern review               | `reviewer.agent.md`      | dispatches all relevant skills                                             |
| plan, estimate, break down, "how would you approach"                 | `planner.agent.md`       | none (planner loads what it needs)                                         |
| new feature + 2+ domains                                             | `feature.agent.md`       | per dispatched agent                                                       |
| refactor/rename/extract/move + 2+ domains                            | `refactor.agent.md`      | per dispatched agent                                                       |
| `/init-github` Step 3: `.github-old/` merge (internal delegation)    | `legacy-merger.agent.md` | `legacy-audit`                                                             |

> **Note**: `legacy-merger` is NOT user-facing. It's invoked exclusively by `/init-github` Step 3 when `.github-old/` is detected. Never route user requests here.

### Model Selection

`GUARDRAILS.md` §0 is the **only** routing and model gate. This router selects an agent and
skills; it then resolves the selected agent's profile in `.github/MODELS.md`.
After the mapping is confirmed, a subagent's generated candidate array selects the
first available model. Do not force the primary in the delegation call because
that bypasses fallback. While the mapping is unconfirmed, runtime customizations
have no `model:` metadata and use the active picker; Section 10 of `GUARDRAILS.md`
requires `/init-github` before normal routed work.

### Cross-Cutting Skill Selection

Add these skills to the selected route only when the request or affected code
matches. This table is the sole trigger authority; `SKILLS-DIGEST.md` is only an
inventory.

| Intent signals                                                 | Add skill                                                                    |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| accessibility, a11y, ARIA, keyboard, screen reader, contrast   | `accessibility`                                                              |
| readability, naming, maintainability, error handling           | `quality`                                                                    |
| architecture documentation, arc42, design decisions            | `arc42`                                                                      |
| branding, logo, typography, design tokens, approved UI sources | `company-styling`                                                            |
| structural file create/delete/rename or project-map update     | `project-overview`                                                           |
| explicit caveman or ultra-compressed persistent responses      | `caveman`                                                                    |
| explicit ponytail or full anti-overengineering workflow        | `ponytail`                                                                   |
| animation audit, animation review, motion opportunities        | `review-animations`, `improve-animations`, or `find-animation-opportunities` |
| mobile web UX, touch, safe area, viewport, PWA                 | `mobile-native`                                                              |

## 3. Model Resolution

`.github/MODELS.md` is the sole model-assignment authority. Its manifest maps
each agent/prompt path to a profile and maps each profile to primary and fallback
VS Code model candidates. After any manifest change, run:

```bash
bash .github/scripts/sync-agent-models.sh
bash .github/scripts/sync-agent-models.sh --check
```

**Escalation rule**: after two failed attempts, `cheap` may retry with `medium`.
Ask the user before escalating from `medium` to `expensive`.

## 4. Tie-Breaking Rules

1. **Specific beats general**: "test the store" → test agent (not store agent).
2. **Verb wins over noun**: "refactor the API layer" → refactor orchestrator (not api agent) if 2+ domains affected.
3. **2+ domains → orchestrator, always.** Never let a domain agent freelance across boundaries.
4. **Read-only beats write**: pure questions never route to writing agents.
5. **When two domain agents tie**, route to planner for decomposition.

## 5. Fallback & Escalation

- No matching route + non-trivial task → ask ONE clarification question.
- Agent discovers mid-task it needs another domain → return to router, dispatch the correct agent (orchestrators handle this natively).
- Repeated failures (2x) → stop, report blocker per `GUARDRAILS.md` stop conditions.

## 6. Routing Visibility

Every routed response starts with a one-line trace:

```
Route: [agent] | Skills: [skill list] | Profile: [from MODELS.md] | Model: [primary candidate]
```

For orchestrated flows, the orchestrator's step format (see `ORCHESTRATORS.md`) replaces this per step.

---

## Adapting for Your Project

1. Rename/add domain agents to match your stack (e.g., split `component` into `design-system` + `views`).
2. Verify the `MODELS.md` manifest candidates against the models available to your team, then run `.github/scripts/sync-agent-models.sh`.
3. Keep the matrix in sync when adding agents — a route that points to a missing file breaks the chain.
