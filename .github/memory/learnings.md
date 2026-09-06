# Project Learnings

Knowledge base of verified, project-specific learnings. Managed via `/learnings`. Entry format: `- **Title** — one-line description. (YYYY-MM-DD)`. See `../MEMORY.md` for read/write policy.

## Gotchas

<!-- Non-obvious behaviors that cost debugging time -->

- **`cap add android` "Unable to locate a Java Runtime" is non-fatal** — Without `JAVA_HOME` in the shell, `npx cap add android` warns and skips Gradle/SDK auto-detection, but the platform still scaffolds and `npx cap sync android` runs clean afterward. Android Studio's bundled JDK resolves it; don't mistake the warning for a failure. (2026-07-10)
- **Keep all `@capacitor/*` packages on the same version** — `@capacitor/android` published ahead (8.4.1) while `core`/`cli`/`ios` were at 8.3.4, causing a peer-dep mismatch. Fix: bump `core`+`cli`+`ios` to match `android`. Verify parity when adding a platform. (2026-07-10)
- **`@capacitor/assets` needs its own nested `sharp` built** — `pnpm-workspace.yaml` lists `sharp` in `ignoredBuiltDependencies`, which silently blocks the nested `sharp@0.32.6` bundled by `@capacitor/assets`, so `generate` fails with `Cannot find module '.../sharp-darwin-arm64v8.node'`. Fix: run `pnpm approve-builds sharp` to persistently approve its build script, then re-run `npx @capacitor/assets generate`. (Alternative: temporarily move `sharp` to `onlyBuiltDependencies`, `pnpm rebuild sharp`, then revert.) (2026-07-10)
- **`@capacitor/assets` prioritizes `assets/logo.png` over `assets/icon.png`** — if both exist, the stale/wrong one silently wins as the icon source (no warning). Keep only one master source file, or keep both in sync, when swapping the app icon. (2026-07-11)
- **`@capacitor/assets` Android adaptive icon XML has a bug: it insets BOTH background and foreground by 16.7%** in `mipmap-anydpi-v26/ic_launcher.xml` + `ic_launcher_round.xml`. The background should always be full-bleed (no inset) — insetting it too leaves a transparent ring that some launchers render as black (visible on right/bottom edges). Fix manually after every `generate`: remove the `<inset>` wrapper around `<background>`, keep it only on `<foreground>`. No CLI flag to disable this — must be re-applied every time icons are regenerated. (2026-07-11)
- **`@capacitor/haptics` iOS `selectionChanged()` is a silent no-op without a prior `selectionStart()`** — `HapticsPlugin`'s Swift source only creates the `UISelectionFeedbackGenerator` inside `selectionStart()`; calling `selectionChanged()` alone resolves successfully (no JS error, bridge log looks fine) but produces zero vibration because the generator is `nil`. Always pair: `selectionStart()` once when a gesture begins, `selectionChanged()` per tick, `selectionEnd()` once it settles. (2026-07-23)
- **True Apple Clock-style alarms are not achievable for this app** — bypassing the silent switch / looping until dismissed requires the `Critical Alerts` entitlement, which Apple only grants to health/safety/public-safety apps after manual review. Not realistic for a calendar app. Implemented the closest achievable alternative instead: a dedicated Android `NotificationChannel` (`fasting-alarms-v1` in `src/services/fastingAlarms.js`, importance 5, custom sound + vibration) + iOS `interruptionLevel: 'timeSensitive'` (breaks through Focus/DND, no Apple review needed — unlike Critical Alerts). (2026-07-23)
- **Android `NotificationChannel`s are immutable once created on a device** — sound/importance/vibration can't be changed for an existing channel id after install; bump the id suffix (e.g. `fasting-alarms-v1` → `-v2`) whenever the sound or importance needs to change, or existing users keep the old channel settings. (2026-07-23)
- **Custom notification sound files bypass `npx cap sync`** — `cap sync` only copies `dist/` into each platform's `public/` folder; native-only resources like a custom alarm sound must be placed directly in `android/app/src/main/res/raw/` (Android, filename without extension referenced) and as a bundled resource in the iOS Xcode project (`ios/App/App/<file>.wav`, must be registered in the target's "Copy Bundle Resources" build phase or iOS won't find it at runtime).
- **Scripting Xcode project (`.pbxproj`) resource additions with the `xcodeproj` Ruby gem** — `gem list xcodeproj` confirms it's installed on this machine; a short script (`project.main_group.find_subpath('App', false).new_file('name.wav')` + `target.add_resources([file_ref])` + `project.save`) safely adds a bundled resource without opening Xcode, and is reversible (plain text pbxproj diff).
- **`Header.jsx` (shared header) accepts a `title` prop but never renders it** — dead prop, pre-existing, not introduced by recent work. Don't "fix" incidentally unless asked.
- **`Fasting.jsx` already has raw `<input>`/`<button>` elements (city search)** predating the base-components rule — don't "fix" incidentally unless asked; treat as pre-existing debt, not a new violation.
- **`BaseForm`, `BaseFormDateField`, `BaseSpinner` are NOT exported from `src/components/base/index.js`** — they were absorbed from another project and depend on `react-hook-form` + `useTranslate`/`useDateRangeLogic` hooks that don't exist here (importing them breaks). For an in-app calendar date picker use `BaseCalendarPicker` (month-grid, `Date` value/onChange, localizes month/weekday names via `Intl` like `BaseWheelPicker`); it preserves the time portion of `value` on change so it composes with `BaseWheelPicker mode="time"`. (2026-08-29)

## Patterns

<!-- Reusable patterns confirmed to work in this codebase, not yet promoted to a skill -->

- **Fasting alarms feature layout** — `src/services/fastingAlarms.js` is a thin wrapper over `@capacitor/local-notifications`, gated by `Capacitor.isNativePlatform()` (web unsupported, same pattern as `haptics.js`). `src/hooks/useFastingAlarms.js` persists per-day sunrise/sunset toggle state to `localStorage` key `bahai-fasting-alarms`; notification id = `Number(YYYYMMDD) * 10 + (sunset ? 1 : 0)`. `src/components/FastingAlarmsModal.jsx` is a `BaseModal` listing all fast days with a `BaseToggleSwitch` per sunrise/sunset plus activate/deactivate-all buttons. Android needs `android.permission.SCHEDULE_EXACT_ALARM` in `AndroidManifest.xml` for exact-time notifications (Android 12+); `POST_NOTIFICATIONS` is merged automatically by the plugin's own manifest. iOS needs no `Info.plist` usage-description key for local notifications (runtime prompt only).

<!-- Reusable patterns confirmed to work in this codebase, not yet promoted to a skill -->

- **⛔ Routing Gate Trigger List (2026-06-26)** — Keyword-based instant routing: locale/translation/i18n/traducción → i18n agent; state/context/useContext → store agent; component/jsx creation/calendar view → component agent; service/axios/fetch → api agent; review/audit → reviewer agent; refactor/rename across files → refactor agent. If ANY trigger matches → STOP, show gate, WAIT. No exceptions even for "trivial" tasks.

## Mistakes

<!-- Mistakes the AI made that the user corrected — prevent repeats -->

- **⛔ Never discard code based on assumptions during legacy merge (2026-06-15)** — During a `.github` legacy merge, files/folders were discarded based on an unverified assumption instead of being copied first. Rule: NEVER discard code based on assumptions — copy first, let the user decide. If uncertain whether something applies, ASK. Codified as GUARDRAILS.md §11.

- **⛔ Verify template files were actually adapted after /init-github (2026-06-15)** — `/init-github` can create agent/skill files from generic templates and leave `[TODO]` placeholders or wrong-stack references instead of adapting them to the detected stack. Rule: after init, verify every generated file references the real stack (no leftover `[TODO]`, no foreign-framework terms) and diff-check that absorbed legacy knowledge was actually integrated, not overwritten by a template.

- **⛔ Routing Gate violation (2026-06-12)** — i18n task ("translation") was processed directly with Claude Opus instead of showing the Routing Gate block and asking user which model/agent. Rule: ALWAYS check ROUTER.md §2 BEFORE any work. If task matches an agent, show GUARDRAILS.md §0 gate block and WAIT. Never process silently. (2026-06-12)

- **⛔ Used PC /memories/ for project rules (2026-06-12)** — Stored project-specific routing gate detail in VS Code persistent memory instead of `.github/memory/`. Rule: ALL project knowledge goes in `.github/memory/` of the repo. PC `/memories/` is ONLY for cross-project user preferences. (2026-06-12)

- **⛔ Repeated: used PC /memories/repo/ for project-specific facts (2026-07-23)** — Wrote fasting-alarm implementation notes (file paths, channel IDs, native build details) into the editor's `/memories/repo/` tool memory, which physically lives in VS Code's global `workspaceStorage` on the developer's machine — not in the git repo, not shared with the team. This is the exact same mistake as 2026-06-12, repeated. Rule (reaffirmed): `/memories/repo/` may only ever be a _mirror_ of what's already written to `.github/memory/` (per `MEMORY.md` §1) — never the sole location. Always write the canonical entry to `.github/memory/learnings.md` (or the relevant file) FIRST. (2026-07-23)

- **⛔ Orchestrator MUST enforce assigned models (2026-06-12)** — When ROUTER.md assigns a specific model to an agent (e.g. i18n → GPT-4.1), the orchestrator MUST delegate to that agent with that model. Never execute the task directly in the current model. The orchestrator's ONLY job is routing + delegation, not execution. If it processes work itself instead of delegating, it has failed its purpose. (2026-06-12)

## API & Backend Notes

<!-- Endpoint quirks, response shape surprises, auth behaviors -->

## Testing Notes

<!-- Mock setups, flaky-test causes, environment quirks -->
