# AI Agent Development Guidelines

> **⛔ STOP — READ BEFORE DOING ANYTHING ⛔**
>
> Before writing ANY code or making ANY edit, you MUST check `ROUTER.md` §2 to see if this task belongs to a specialized agent. If it does, compare the declared model vs. current model **by family only, ignoring version numbers** (`GUARDRAILS.md` §0 rule 1a — e.g. `claude-sonnet` and "Claude Sonnet 4.5" are the SAME family). **If the family matches → proceed directly, no gate.** Only if the family genuinely differs (e.g. Sonnet vs Opus, Claude vs GPT) must you show the **Routing Gate block** (defined in `GUARDRAILS.md` §0) and WAIT for user choice. Skipping the gate when families genuinely differ is a guardrail violation — but showing the gate when families already match is ALSO a violation (unnecessary interruption). This applies to ALL models, ALL agents, ALL conversations.
>
> **⛔ ABSOLUTE RULE**: You can NEVER skip, ignore, or override ANY rule in `.github/` on your own. Rules can ONLY be bypassed when the USER explicitly grants permission. If unsure whether a rule applies — ASK. Assuming implicit permission is forbidden.

## Project Profile

| Field            | Value                                                                             |
| ---------------- | --------------------------------------------------------------------------------- |
| Project          | Bahá'í Calendar (`bahai-calendar`)                                                |
| Framework        | Vite 6 + React 19 (SPA, no SSR) — Capacitor 8 for iOS native shell                |
| Language         | JavaScript / JSX (TypeScript available but source is `.jsx`/`.js`)                |
| UI library       | None — custom base components in `src/components/base/`                           |
| Styling          | TailwindCSS v4 (`@tailwindcss/vite`), `@theme` in `src/index.css`                 |
| State management | React Context API (`SettingsContext`, `BadiYearContext`, `PersonalEventsContext`) |
| i18n             | i18next + react-i18next — locales `src/i18n/locales/` (en, es, ar, de, fa, fr)    |
| Testing          | None configured (no vitest/jest/playwright)                                       |
| Package manager  | pnpm (workspace-aware); dev server on port 4100                                   |
| Git platform     | GitHub (`gh`)                                                                     |

> Stack detected and adapted by `/init-github`. Code examples in this file and in skills use the project stack (React 19 + Vite + TailwindCSS v4 + Context API + react-i18next). Project-specific rules live in `.github/instructions/` (base components, icons, cross-calendar parity, lint discipline).

## Operating Pipeline (read these first)

Every request flows through these layers, in order:

1. **Guardrails** — `.github/GUARDRAILS.md` — hard safety rules; override everything else.
2. **Router** — `.github/ROUTER.md` — decides which agent, skills, and model handle the request.
3. **Planner** — `.github/agents/planner.agent.md` — decomposes multi-domain tasks before execution (`/plan`).
4. **Agents & Skills** — `.github/agents/`, `.github/skills/SKILLS-DIGEST.md` — do the work, with declared tools per `.github/TOOLS.md`.
5. **Memory** — `.github/MEMORY.md` + `.github/memory/` — consulted before work, updated after (`/memory`, `/learnings`).

> **Skills reference**: For in-depth guidance on specific topics, see `.github/skills/SKILLS-DIGEST.md`.

## Caveman Mode (Always On)

Load and follow `.github/skills/caveman/SKILL.md` for every response. This skill is always active by default — no need to trigger it manually.

## Ponytail — Lazy Senior Dev Mode (Always On)

Load and follow `.github/skills/ponytail/SKILL.md` for every response. Before writing any code, walk the decision ladder: YAGNI → stdlib → platform → installed dep → one-liner → minimum that works. Stop at the first rung that holds. Never lazy about security, accessibility, data-loss prevention, or trust-boundary validation.

## Mandatory Skill Selection (Strict)

- Before proposing or writing code, always select at least one relevant skill from `.github/skills/SKILLS-DIGEST.md`.
- Skill selection is required for every non-trivial task (implementation, refactor, bug fix, tests, styling updates).
- If multiple concerns are present, combine all relevant skills (for example: `styling` + `components`).
- If no skill clearly applies, ask one clarification question before proceeding.
- In every substantive response, include a short line: `Skill used: <skill-name(s)>`.
- If the task is truly trivial and no skill is needed, explicitly state: `Skill used: none (trivial task)`.

### Skill Routing Rules

> Full intent → agent → skill → model routing lives in `.github/ROUTER.md`. The quick matrix below covers skill selection only.

- **UI/Tailwind/theme/layout/base components** → use `.github/skills/styling/SKILL.md` + `.github/skills/components/SKILL.md`
- **Refactor/readability/naming/error handling/maintainability** → use `.github/skills/quality/SKILL.md`
- **Accessibility/a11y/ARIA/keyboard navigation/contrast/headings** → use `.github/skills/accessibility/SKILL.md`
- **State/Context/hooks/reactive data** → use `.github/skills/state-management/SKILL.md`
- **Architecture documentation/arc42/design decisions** → use `.github/skills/arc42/SKILL.md`
- **API calls/services/HTTP requests (axios)** → use `.github/skills/api/SKILL.md`
- **Translations/i18n/locale keys** → use `.github/skills/i18n/SKILL.md`
- **Project structure/file locations/folder purposes/orientation** → use `.github/skills/project-overview/SKILL.md`
- **Hard bug/debug/perf regression/"why is this failing?"** → use `.github/skills/diagnose/SKILL.md`
- **UI change/release prep/App Store/iOS/HIG/privacy** → use `.github/skills/appstore-compliance/SKILL.md`
- **Capacitor/native shell/iOS or Android build/`npx cap`/native permissions** → use `.github/skills/capacitor-native/SKILL.md`
- **Multi-concern work** → apply all matching skills in parallel

## Orchestrator Routing (Meta-Agents)

When a task spans **multiple domains**, do not try to handle everything in a single step. Use an orchestrator agent to decompose the work, enforce dependency ordering, and delegate to specialized agents.

| Situation                                                                   | What to invoke                                                        |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Task needs scoping/estimation first, or complexity is unclear               | Load `.github/agents/planner.agent.md` (Planner, read-only)           |
| New feature that needs **UI + state + API + tests + i18n**                  | Load `.github/agents/feature.agent.md` (Feature Orchestrator)         |
| Refactor, cleanup, or rename that affects **multiple files across domains** | Load `.github/agents/refactor.agent.md` (Refactor Orchestrator)       |
| Full code review across quality, styling, accessibility, state              | Load `.github/agents/reviewer.agent.md` (Review Orchestrator)         |
| Single-domain task (only UI, only state, only API, only i18n, only native)  | Use the relevant agent directly (component, store, api, i18n, native) |
| Question about project structure or file locations                          | Use `.github/agents/overview.agent.md` (read-only)                    |

### Dependency Order (strict)

When an orchestrator dispatches subtasks, they follow this sequence:

1. **Context/State** → **Component** (component reads from context)
2. **API/Service** → **Context/State** (state consumes service calls)
3. **Component** → **i18n** (i18n needs new labels)
4. **Overview** (scan) can run anytime; usually first

### Orchestrator visibility

When an orchestrator delegates to a sub-agent, output this format so the user can follow the chain:

```
▶︎ Step N: [Domain Agent] — [Goal]
  Scope: [exact files]
Loading agent: .github/agents/[domain].agent.md
Executing...
```

See `.github/ORCHESTRATORS.md` for the full registry and conventions.

## Types & Type Safety

- Source is **JavaScript / JSX**. Keep code clear with JSDoc where a type contract helps; do not introduce TypeScript files unless the user asks.
- Related constants and fixed value sets → keep as named exports/constants near their usage (no `core/enums.ts` in this project).
- Prefer explicit prop destructuring in components and validate inputs at boundaries.

## Component Architecture

### Component Hierarchy

Follow this hierarchy when creating components (see `.github/instructions/base-components.instructions.md`):

1. **Base components** (`src/components/base/`) - reusable UI primitives (buttons, inputs, selects, modals, icons)
2. **Feature components** (`src/components/`) - calendar views and feature-specific UI (e.g. `BadiCalendar.jsx`, `Settings.jsx`)

### Base Components (`src/components/base/`)

- **Reusable UI primitives** — `BaseButton`, `BaseTextInput`, `BaseNumberInput`, `BaseSelect`, `BaseSelectInput`, `BaseMultiSelectInput`, `BaseCheckbox`, `BaseToggle`, `BaseToggleSwitch`, `BaseModal`, `BaseIcon`, `BaseSearchBar`, `BaseTag`, `BaseSpinner`, `BaseTooltip`, `BaseExpandableSection`, etc.
- **Always use a base component instead of a raw HTML element** when one exists (mandatory — see `.github/instructions/base-components.instructions.md`). Never use raw `<button>`, `<input>`, `<select>`, `<svg>`, etc. in `src/` outside `src/components/base/`.
- Import from the barrel: `import { BaseButton, BaseSelect } from '../base'` — not deep paths.
- If a base component is **missing**: create `Base<Name>.jsx` in `src/components/base/`, export it from `src/components/base/index.js`, then use it.

### Feature Components (`src/components/`)

- Calendar views (`GregorianCalendar`, `CompactCalendar`, `MixedCalendar`, `BadiCalendar`), headers, switchers, modals, and page components.
- **Cross-calendar parity is mandatory**: any feature/option/interaction added to one calendar view MUST be added to all four — see `.github/instructions/cross-calendar.instructions.md`.

### Component Simplicity

- Keep components **simple and focused**
- Move shared or complex logic to:
  - **Context providers** in `src/context/` (global state)
  - **Custom hooks** in `src/hooks/` (reusable reactive logic)
  - **Services** in `src/services/` (API/data access)
  - **Utility functions** in `src/utils/` (pure helpers) and date logic in `src/lib/badiDate.jsx`
- Components should primarily handle rendering, user interactions, and calling hooks/context actions.

## Styling Guidelines

### TailwindCSS & Tokens

- Use **TailwindCSS v4 utility classes** for all styling (via `@tailwindcss/vite`). **Never use inline `style={{}}` props** — strictly forbidden (see `.github/instructions/base-components.instructions.md`).
- Prioritize **built-in utility classes** over arbitrary values (prefer `px-4` over `px-[16px]` when an equivalent exists).
- Use arbitrary values only when no built-in utility fits (e.g. safe-area insets: `pt-[max(0.75rem,env(safe-area-inset-top))]`).
- Theme tokens/colors are defined in the `@theme` block of `src/index.css`. Extend the theme there for custom tokens rather than hardcoding values.
- Dark mode is class-based, driven by `SettingsContext`.

### Icons

- **Every icon MUST go through the `BaseIcon` component** — mandatory, no exceptions (see `.github/instructions/frontend-icons.instructions.md`).
- Path: `src/components/base/BaseIcon.jsx`; registry: `src/components/base/icons/index.js`.
- Clickable icon → pass `onClick` directly to `BaseIcon` (never wrap in `<button>`). Decorative icon → `<BaseIcon icon="..." />`.
- Do NOT inline raw `<svg>` or import `react-icons/*` directly in components; add new icons to the registry.

### Images

- Store images under `public/static/` (icons, flags) or import assets via Vite. Reference by path from `public/`.

## Internationalization (i18n)

- **Every user-facing label** must be translated — never hardcode display text.
- The project uses **`react-i18next`** with locale files in `src/i18n/locales/`: `en.json`, `es.json`, `ar.json`, `de.json`, `fa.json`, `fr.json`.
- When adding or modifying labels, **add the key to ALL six locale files**.

### Usage in components

```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <span>{t('bahai.myLabel')}</span>;
}
```

### Translation key conventions

- Keys are **dot-nested camelCase**, grouped by feature/domain (e.g. `settings.language`, `bahai.months.jalal`).
- Bahá'í-specific terms use the `bahai.*` prefix.
- Keep keys **descriptive and consistent** with existing patterns in the locale files.
- RTL locales (`ar`, `fa`) must render correctly — verify layout direction.

### Adding translations

1. Choose or create the appropriate key under the relevant section.
2. Add the key + value to all six locale files (`en, es, ar, de, fa, fr`).
3. Use `t('key')` via `useTranslation()` in the component.

## State Management

### Context Providers

- Global state uses the **React Context API** with providers in `src/context/`:
  - `SettingsContext` — settings, language, dark mode (persisted to `localStorage`)
  - `BadiYearContext` — Badíʿ year data
  - `PersonalEventsContext` — user personal events
- Pattern: a `createContext` + provider component + a `useXxx()` hook that reads it.
- For in-depth guidance on context boundaries, mutation rules, and effect dependencies, see `.github/skills/state-management/SKILL.md`.
- Key rules:
  - **Single domain per context** — if you can describe it with “and”, split it.
  - **No duplicated state** — every piece of data has one authoritative context.
  - **Mutate through provider actions only** — consumers call action functions, never mutate context values directly.
  - **Keep effect dependencies focused** — `useEffect`/`useMemo` should target specific values, not whole context objects.
  - **Persist settings via `localStorage`** through `SettingsContext`.

## Code Organization

### Hooks (`src/hooks/`)

- Custom hooks for **reusable reactive logic**. Prefix with `use`: `useSwipe.js`, `useOnlineStatus.js`.

### Services (`src/services/`)

- Data access / API calls (axios). Examples: `badiApi.js`, `sunTimesApi.js`, `geocodingApi.js`, `calendarSync.js`, `personalCalendar.js`.

### Utils (`src/utils/`) & lib (`src/lib/`)

- **Pure, stateless helpers** in `src/utils/` (e.g. `weekNumber.js`, `sizeIcon.js`, `timeFormat.js`, `searchEvents.js`).
- **Badíʿ date conversion logic** lives in `src/lib/badiDate.jsx`.

### When to use what

- **Hook**: needs React state/effects/refs.
- **Util / lib**: pure function, data transformation, no React dependency.
- **Context**: global state shared across many components.

## File Structure

- **Components**: `src/components/` (feature) and `src/components/base/` (primitives + `icons/`)
- **Contexts**: `src/context/`
- **Hooks**: `src/hooks/`
- **Services**: `src/services/`
- **Utils**: `src/utils/`, date logic in `src/lib/`
- **i18n**: `src/i18n/` (`index.js` + `locales/`)
- **Styles**: `src/index.css` (Tailwind entry + `@theme`)
- **Project instructions**: `.github/instructions/` (base components, icons, cross-calendar, lint discipline)

## App Structure & Routing

- Single-page app: `src/main.jsx` is the React 19 entry; `src/App.jsx` holds the app shell, view routing (`page` state), and the calendar view switcher.
- **No router library / no Nuxt** — navigation is state-driven within `App.jsx`.
- `CalendarHeader` is the shared header for calendar views; `Header` is only for non-calendar pages (settings, help, about).

## Naming Conventions

- **Components**: PascalCase `.jsx` files in `src/components/` (`MixedCalendar.jsx`, `BaseButton.jsx`).
- **Hooks**: camelCase, `use` prefix (`useSwipe.js`).
- **Services / utils / other JS**: kebab-case or camelCase matching existing files.
- **Variables, functions, object keys**: camelCase.

## Testing

- **No test framework is configured** in this project (no vitest/jest/playwright). Do not fabricate test commands or spec files.
- If test coverage becomes desired, propose adding a runner (e.g. Vitest) before writing specs, and confirm with the user.

## Best Practices

1. **Keep components focused**: small function components, clear props.
2. **Hooks for logic**: extract reusable stateful logic into `src/hooks/`.
3. **Base components + BaseIcon**: never raw HTML primitives or raw SVG.
4. **Cross-calendar parity**: mirror any calendar feature across all four views.
5. **DRY**: extract shared logic to hooks, services, or utils.

## Code Quality & Clean Code

- Write **readable, self-documenting code** — meaningful names, small functions, single responsibility
- Follow **clean code principles** adapted for JavaScript/React — for detailed rules, see `.github/skills/quality/SKILL.md`
- Key rules:
  - **Functions should do one thing** and be short (≤ 30 lines as a guideline)
  - **Use descriptive names** — prefer `getUpcomingEvents()` over `getData()`, `isVisible` over `flag`
  - **Avoid magic numbers and strings** — extract to named constants near their usage
  - **Prefer early returns** over deep nesting
  - **No dead code** — remove unused variables, imports, functions, and commented-out code
  - **Handle errors explicitly** — never silently swallow exceptions
  - **Keep files focused** — one component, one hook, or one utility concern per file
  - **No lint suppression comments** — fix the root cause (see `.github/instructions/lint-discipline.instructions.md`)

## Accessibility (a11y)

- **Every user-facing component** must follow accessibility best practices — for detailed rules, see `.github/skills/accessibility/SKILL.md`
- Key rules:
  - **Use semantic HTML** — `<button>` for actions, `<a>` for links, landmark elements (`<nav>`, `<main>`, `<aside>`) for structure
  - **Provide ARIA attributes** where native semantics are insufficient — `aria-label` on icon-only buttons, `aria-expanded` on toggles, `aria-live` for dynamic content
  - **Ensure keyboard accessibility** — all interactive elements reachable via `Tab`, activatable via `Enter`/`Space`, focus trapped in modals
  - **Meet color contrast minimums** — 4.5:1 for normal text, 3:1 for large text and UI components (WCAG 2.1 AA)
  - **Never rely on color alone** to convey information — pair with icons, text, or patterns
  - **Maintain heading hierarchy** — one `<h1>` per page, sequential levels (`h1 → h2 → h3`), no skipped levels
  - **Visible focus indicators** — never remove focus outlines without providing an equivalent custom style

## Keeping the Project Overview Up-to-Date

The file `.github/skills/project-overview/SKILL.md` is a living map of the project. **When you create, delete, or rename** any of the following, update the corresponding section in the overview:

- A **context** provider (`src/context/*.jsx`) → update the state/context section
- A **hook** (`src/hooks/use*.js`) → update the hooks table
- A **service** (`src/services/*.js`) → update the services table
- A **utility** (`src/utils/*.js`) → update the utilities table
- A **feature component** (`src/components/*.jsx`) → update the folder map / component list
- A **base component** (`src/components/base/Base*.jsx`) → update the base components list
- A **locale** or i18n change (`src/i18n/`) → update the i18n section

**Rules:**

- Add a one-line description matching the style of existing entries
- Remove entries for deleted files
- For a full refresh, use the `/refresh-overview` prompt command

## Code Review Checklist

Before considering code complete, verify (see also `.github/GUARDRAILS.md` §7 quality gates):

- [ ] Base components are used where applicable (no raw HTML primitives)
- [ ] Every icon goes through `BaseIcon`
- [ ] Complex logic is moved to context/hooks/services/utils
- [ ] TailwindCSS classes are used for styling (no inline `style={{}}`)
- [ ] Cross-calendar parity respected (feature mirrored across all four views)
- [ ] All user-facing labels are translated across the six locale files
- [ ] No duplicate code - logic is reusable
- [ ] Component is simple and focused
- [ ] No lint suppression comments
- [ ] Code is clean: no dead code, no magic values, descriptive names
- [ ] Semantic HTML, ARIA attributes, and keyboard navigation are correct
- [ ] Color contrast meets WCAG 2.1 AA and heading hierarchy is sequential
- [ ] Context state is not mutated directly from components — provider actions are used
- [ ] No duplicated or overlapping state across contexts

## Recording Learnings

The file `.github/memory/learnings.md` is a persistent, git-committed knowledge base for this project (full memory architecture: `.github/MEMORY.md`). **Proactively update it** when any of the following happens:

- You make a **mistake** and then correct it — record what went wrong and the fix
- You discover a **non-obvious pattern** or quirk in the codebase, APIs, or tooling
- You find a **gotcha** that could trip up future work (e.g., an API that behaves unexpectedly)
- You learn something about **test setup, mocking, or environment** that isn't documented elsewhere

**Rules:**

- Keep entries as **one-line bullet points** — short title in bold + concise explanation
- Add entries to the **appropriate section** (Gotchas, Patterns That Work, Common Mistakes, API & Backend Notes, Testing Notes)
- **Update or remove** entries that turn out to be wrong or outdated
- Do NOT duplicate information that already lives in a skill file — reference the skill instead
- For a full review and cleanup, use the `/learnings` prompt command
- For decisions, conventions, and glossary terms, use the `/memory` prompt command (see `.github/MEMORY.md`)
