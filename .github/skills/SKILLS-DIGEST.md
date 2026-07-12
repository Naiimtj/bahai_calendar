# Skills Digest

Index of all available skill guides for this project. Each skill provides detailed, topic-specific rules that complement the main `copilot-instructions.md`.

> Agent/model routing is owned by `.github/ROUTER.md` — this file owns **skill** selection. Stack-specific skills (styling, state-management, components, api, i18n, project-overview) reflect this project's stack: React 19 + Vite + TailwindCSS v4 + Context API + react-i18next.

| Skill                          | Path                           | Summary                                                                                               |
| ------------------------------ | ------------------------------ | ----------------------------------------------------------------------------------------------------- |
| **Styling React Components**   | `styling/SKILL.md`             | TailwindCSS v4 utilities, `@theme` tokens in `src/index.css`, no inline styles, RTL                   |
| **Component Creation**         | `components/SKILL.md`          | Base-component hierarchy, `BaseIcon`, cross-calendar parity, React function-component conventions     |
| **Code Quality & Clean Code**  | `quality/SKILL.md`             | Naming, functions, constants, error handling, JavaScript/React best practices                         |
| **Accessibility (a11y)**       | `accessibility/SKILL.md`       | Semantic HTML, ARIA attributes, keyboard navigation, color contrast, headings                         |
| **State Management**           | `state-management/SKILL.md`    | Context boundaries, provider actions, immutable updates, effect/memo dependencies                     |
| **Architecture Documentation** | `arc42/SKILL.md`               | Creating arc42 architecture documentation, analyzing workspace structure, documenting design          |
| **API Integration**            | `api/SKILL.md`                 | native `fetch` service modules in `src/services/`, error handling, offline, no fetch in components    |
| **i18n**                       | `i18n/SKILL.md`                | react-i18next, six locales, dot-camelCase keys, `bahai.*` prefix, RTL for ar/fa                       |
| **Project Overview**           | `project-overview/SKILL.md`    | Project map, folder purposes, file index, data flow, quick lookup reference                           |
| **Caveman Mode**               | `caveman/SKILL.md`             | Ultra-compressed communication — drops filler ~75%, keeps full technical accuracy (always on)         |
| **Ponytail (Lazy Senior Dev)** | `ponytail/SKILL.md`            | Anti-overengineering — YAGNI, stdlib-first, minimal code, decision ladder before writing (always on)  |
| **Legacy Audit**               | `legacy-audit/SKILL.md`        | Exhaustive `.github_old/` merge protocol for `/init-github` — ZERO tolerance for content loss         |
| **Diagnose**                   | `diagnose/SKILL.md`            | Disciplined debug loop: reproduce → minimise → hypothesise → instrument → fix → regression-test       |
| **Grill With Docs**            | `grill-with-docs/SKILL.md`     | Stress-test a plan against the codebase/domain glossary before coding                                 |
| **Capacitor Native**           | `capacitor-native/SKILL.md`    | iOS + Android shells: `npx cap` sync/add/run, plugin permissions, Xcode/Android Studio builds, parity |
| **App Store Compliance**       | `appstore-compliance/SKILL.md` | Apple App Store & HIG checker for UI, privacy, performance, content (Capacitor/iOS/WebView)           |
| **Write A Skill**              | `write-a-skill/SKILL.md`       | Author/refactor SKILL.md files — frontmatter, structure, triggers, progressive disclosure             |

## How to Use

- The **copilot-instructions.md** provides the high-level rules and project conventions
- **Skill files** go deeper into a specific topic — consult the relevant skill when working in that area
- When a task spans multiple concerns (e.g., a new calendar feature), combine guidance from multiple skills (styling + components + i18n)

## Automatic Skill Routing

Use the following trigger matrix to make skill usage deterministic:

| Trigger words / intent                                                                                     | Required skill(s)                    |
| ---------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| UI, component styling, Tailwind, theme tokens, layout, dark mode, RTL                                      | `styling/SKILL.md`                   |
| component, base component, BaseIcon, calendar view, cross-calendar parity                                  | `components/SKILL.md`                |
| refactor, readability, naming, clean code, error handling, review                                          | `quality/SKILL.md`                   |
| new feature touching UI + logic                                                                            | `styling` + `components` + `quality` |
| a11y, accessibility, ARIA, keyboard nav, screen reader, contrast, headings                                 | `accessibility/SKILL.md`             |
| state, context, provider, hook, localStorage, settings, dark mode                                          | `state-management/SKILL.md`          |
| arc42, architecture documentation, architecture analysis, design decisions                                 | `arc42/SKILL.md`                     |
| API, service, axios, fetch data, sun times, geocoding, calendar sync                                       | `api/SKILL.md`                       |
| translation, i18n, locale, label, add key, RTL, `t()`                                                      | `i18n/SKILL.md`                      |
| project structure, file location, folder purpose, where does X live, orientation                           | `project-overview/SKILL.md`          |
| caveman, terse, brief, less tokens, compressed output, caveman mode                                        | `caveman/SKILL.md` (always on)       |
| ponytail, lazy, YAGNI, minimal, stdlib, skip, one-liner, over-engineering, simplify                        | `ponytail/SKILL.md` (always on)      |
| `/init-github` Step 3, `.github_old/` merge, legacy absorption (internal use only)                         | `legacy-audit/SKILL.md`              |
| hard bug, "diagnose this", debug this, performance regression, intermittent/flaky failure                  | `diagnose/SKILL.md`                  |
| stress-test a plan, sharpen requirements/domain terms before coding, ADR                                   | `grill-with-docs/SKILL.md`           |
| Capacitor, native build, iOS, Android, Xcode, Android Studio, npx cap, Info.plist, AndroidManifest, device | `capacitor-native/SKILL.md`          |
| App Store, Apple, iOS compliance, HIG, review guidelines, release prep, Capacitor, WebView                 | `appstore-compliance/SKILL.md`       |
| write/scaffold/author a new skill, SKILL.md format, skill frontmatter                                      | `write-a-skill/SKILL.md`             |

### Enforcement

- For non-trivial tasks, at least one skill must be selected before implementation.
- If no trigger matches clearly, ask one concise clarification question.
- Every substantive response should include `Skill used: ...` for visibility.

## Default Model per Agent

Canonical model assignments live in `.github/MODELS.md` — edit that file to change a model. Each agent also declares its model in YAML frontmatter (`model:`), which must match `MODELS.md`.

### Model decision heuristic

> Full heuristic table: `.github/MODELS.md`.
