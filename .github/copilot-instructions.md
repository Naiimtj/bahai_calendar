# AI Agent Development Guidelines

> **STOP BEFORE WORK**
>
> Read `.github/GUARDRAILS.md`, then classify the request exclusively through
> `.github/ROUTER.md`. Resolve model assignments only from `.github/MODELS.md`.
> Never bypass a repository rule without explicit user permission.

## Project Profile

| Field               | Value                                                    |
| ------------------- | -------------------------------------------------------- |
| Project             | `bahai-calendar`                                         |
| Initialization mode | `STANDARD`                                               |
| Migration timing    | `NONE`                                                   |
| Framework           | `React 19 SPA + Vite 6`                                  |
| Language            | `JavaScript / JSX`                                       |
| UI library          | `None; custom base components in src/components/base/`   |
| Styling             | `TailwindCSS v4 via @tailwindcss/vite and src/index.css` |
| State management    | `React Context API`                                      |
| i18n                | `i18next + react-i18next; en/es/ar/de/fa/fr`             |
| Testing             | `Vitest 4; src/**/*.test.js; node environment`           |
| Git platform        | `GitHub (gh)`                                            |

Run `/init-github` after safely importing this template. Preserve an existing
`.github/` as `.github-old/` before copying; initialization must stop if that
preservation did not occur. Until initialization completes, reference-stack
examples are examples only and must not be treated as verified project facts.

## Operating Contract

Use the lightweight engineering baseline in `.github/ENGINEERING-STANDARDS.md` as the compact reference for the 100-item quality, performance, scalability, and maintainability policy. Apply only the sections relevant to the current task; do not paste the full catalog into the model context.

Canonical responsibilities are deliberately separated:

| Concern                                              | Authority                         |
| ---------------------------------------------------- | --------------------------------- |
| Safety, protected paths, approvals, completion gates | `.github/GUARDRAILS.md`           |
| Intent, agent, orchestrator, and skill selection     | `.github/ROUTER.md`               |
| Runtime model profiles and assignments               | `.github/MODELS.md`               |
| Agent scopes and tool permissions                    | `.github/TOOLS.md`                |
| Multi-agent execution protocol                       | `.github/ORCHESTRATORS.md`        |
| Skill catalog only                                   | `.github/skills/SKILLS-DIGEST.md` |
| Persistent project knowledge and write policy        | `.github/MEMORY.md`               |

Precedence is `GUARDRAILS.md` → this file → selected agent → selected skills →
invoked prompt. When two sources disagree, follow the higher authority and report
the conflict rather than silently choosing.

## Concision and Minimalism (Always On)

- Keep chat responses short and technically complete. Remove filler, repetition,
  pleasantries, and unrequested examples; preserve negations, constraints, exact
  errors, and safety context.
- Before writing code, stop at the first viable rung: YAGNI → standard library →
  platform feature → installed dependency → one-liner → minimum implementation.
- Do not add abstractions, dependencies, files, or orchestration without a concrete
  need. Prefer established project patterns.
- Never trade away security, accessibility, data-loss prevention, validation, or
  executable verification for brevity.
- The concise defaults remain active on every response. Load `caveman` or
  `ponytail` only when the user explicitly invokes its stronger persistent mode.

## Request Workflow

1. Apply guardrails and stop conditions.
2. Use `ROUTER.md` once to select the route, skills, and cost profile.
3. Load only the selected agent and skills; do not preload the full catalog.
4. Read the nearest implementation, test, convention, and relevant project memory.
5. Make the smallest scoped change that addresses the root cause.
6. Run the cheapest focused executable check, then broader validation when risk
   or repository tooling requires it.
7. Report changed paths, validation evidence, and unresolved blockers concisely.

For non-trivial work, select at least one skill through `ROUTER.md` and include
`Skill used: <name(s)>` in the substantive response. Ask one clarification only
when routing or requirements remain genuinely ambiguous.

## Non-Negotiable Project Rules

These rules are always active. Loading a skill adds implementation detail; not
loading it never relaxes this contract. `/init-github` may replace stack-specific
names and paths with detected equivalents, but must preserve each obligation.

### Evidence and Scope

- The initialized Project Profile and existing code are authoritative. Never infer
  libraries, endpoints, schemas, tokens, locale names, commands, component APIs,
  assets, or company styling.
- Search before creating. Reuse existing components, helpers, stores, schemas,
  tokens, assets, and naming conventions; do not perform unrelated refactors.
- Follow the verified API contract and project HTTP helpers. Never invent an
  endpoint, hardcode a base URL/environment prefix, or leave responses untyped.

### Types and Organization

- Source is JavaScript/JSX; use JSDoc where a contract helps and do not introduce
  TypeScript source files unless explicitly requested.
- Use PascalCase `.jsx` component files, camelCase variables/functions, and one
  concern per context, hook, service, utility, or component.
- Keep rendering in `src/components/`, global state in `src/context/`, reactive
  logic in `src/hooks/`, data access in `src/services/`, and pure helpers in
  `src/utils/` or `src/lib/`.

### Components and Presentation

- Use function components with explicit prop destructuring. Check and extend
  existing `src/components/base/` wrappers before using raw HTML primitives.
- Put reusable primitives in `src/components/base/` and feature components in
  `src/components/`; import base components through the barrel.
- Use TailwindCSS v4 utilities and `@theme` tokens from `src/index.css`; never add
  inline `style={{}}` props.
- Render every icon through `BaseIcon` and never hardcode user-facing labels;
  use `useTranslation()` and existing locale keys.

### Localization, State, and Navigation

- Every user-facing label uses the configured i18n mechanism. Add each new key to
  every configured locale in one change; never delete keys without confirmation.
- State has one authoritative owner and is mutated only through actions. Never
  duplicate state, expose mutable refs, or introduce side effects in computed
  values. Keep reactive dependencies focused.
- React Context providers expose read values and action functions; consumers do not
  mutate context state directly. Settings persistence belongs in `SettingsContext`.
- `src/App.jsx` owns state-driven navigation; do not introduce a router library
  without an explicit architectural decision.

### Quality Gates

- Accessibility and security apply to every user-facing change, even when the
  request does not mention them: semantic HTML, keyboard operation, visible focus,
  valid ARIA, contrast, heading order, safe rendering, and boundary validation.
- New or changed business logic requires focused Vitest coverage under `src/**/*.test.js`.
- When structural files are created, deleted, or renamed, load `project-overview`
  and update its generated project map.
- Never claim completion without the focused executable check required by
  `GUARDRAILS.md`; unresolved failures must be reported.

## Domain Guidance

Load domain details only when selected by `ROUTER.md`:

| Domain                                       | Skill              |
| -------------------------------------------- | ------------------ |
| Components and UI-library hierarchy          | `components`       |
| Styling and responsive/mobile behavior       | `styling`          |
| Company identity and verified design sources | `company-styling`  |
| Animation, transitions, and gestures         | `motion`           |
| Accessibility                                | `accessibility`    |
| State and composable boundaries              | `state-management` |
| APIs and schemas                             | `api`              |
| Internationalization                         | `i18n`             |
| Tests and mocks                              | `testing`          |
| Naming, TypeScript, and maintainability      | `quality`          |
| Project structure                            | `project-overview` |

Migration skills are selected only by migration routes; UI/styling changes pass
through the existing styling and component guidance. Mobile application skills
under `.github/frontend-apps/` remain staged until `/init-apps` installs them.

## Delegation and Models

- Route a single-domain task directly to its domain agent.
- Use planner/orchestrator routes only for genuinely multi-domain work or explicit
  planning. Do not add a planning hop to a clear, bounded task.
- Respect each agent's declared scope. Return to the router when another domain is
  required instead of expanding scope silently.
- Delegate without forcing a model so the generated candidate array can fall back.
- Ask before escalating from `medium` to `expensive` as defined in `MODELS.md`.

## Completion and Memory

- Never claim completion without executable evidence when a check exists.
- Do not run Git commands unless the current user request explicitly asks for Git.
- Follow `.github/MEMORY.md`; propose project-memory entries and obtain the
  confirmation required by `GUARDRAILS.md` before writing them.
- Keep final responses concise and never paste code unless the user asks to see it.

## Adapting for a Project

1. Run `/init-github` and replace every Project Profile placeholder with evidence.
2. Install only the stack, migration, and mobile packs the project needs.
3. Keep routing in `ROUTER.md`; do not add routing copies to agents, skills, or this
   bootstrap.

<!-- absorbed from .github-old — verify still applies -->

### Domain and Mobile Rules

- The app displays Badíʿ and Gregorian calendars, holy days, feasts, fasting,
  personal events, settings, location, and sun times.
- Any feature affecting a calendar view must be mirrored across Gregorian,
  Compact, Mixed, and Badíʿ views.
- Capacitor 8 supports both `ios/` and `android/`; after web changes run
  `pnpm run build` then `npx cap sync`, and keep platform-specific fallbacks.
