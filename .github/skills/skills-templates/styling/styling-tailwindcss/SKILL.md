# Styling React Components — TailwindCSS Template

> **Skill template** — Copy this into a project's `.github/skills/styling/SKILL.md` and fill in the project-specific values marked with `[TODO]`.

Best practices for styling React components using **TailwindCSS v4** (or v3).

---

## Tech Context

- React 19 + Vite
- **TailwindCSS `[TODO: v3 / v4]`**
  - v4: CSS-first config in `[TODO: path, e.g. assets/app.css]` via `@theme` / `@layer`
  - v3: `tailwind.config.ts` for theme extension
- `[TODO: verified company/project token bridge, if any]`

---

## Core Principles

1. **Tailwind utility classes over raw CSS** — always apply classes directly in templates
2. **Built-in utilities over arbitrary values** — prefer `px-4` over `px-[16px]`, `text-lg` over `text-[18px]`
3. **Closest built-in value first** — when design values don't match exactly, use the nearest built-in before resorting to arbitrary
4. **Arbitrary values are exception-only** — only when built-ins cannot preserve intended layout/UX
5. **Theme colors over hardcoded values** — use `text-primary`, `bg-error` instead of `text-[#004A96]`
6. **Extend the theme when a pattern repeats** — if a color or class appears in 3+ components, add it to `@theme` / `extend`

---

## Available Theme Colors

`[TODO: list the project's theme color tokens]`

```
primary, secondary, error, success, warning, info, background, ...
```

All defined in `[TODO: path to Tailwind config / app.css @theme block]`.

---

## Reusable Component Classes

`[TODO: list @layer components classes defined in the project]`

| Class    | Purpose                 |
| -------- | ----------------------- |
| `.card`  | Standard card container |
| `.btn`   | Base button styles      |
| `[TODO]` | `[TODO]`                |

---

## Reusable Utility Classes

`[TODO: list @layer utilities classes defined in the project]`

| Class     | Purpose                  |
| --------- | ------------------------ |
| `.h-main` | Main content area height |
| `[TODO]`  | `[TODO]`                 |

---

## Do / Don't

### Do

```html
<!-- Theme colors -->
<div class="text-primary bg-grey-050 border-grey-light">...</div>

<!-- Built-in utilities -->
<div class="px-4 py-2 rounded-sm text-sm font-semibold">...</div>

<!-- Reusable component class -->
<div class="card">...</div>

<!-- Opacity modifier on theme color -->
<div class="bg-info/20 text-error">...</div>
```

### Don't

```html
<!-- Don't hardcode colors -->
<div class="text-[#004A96]">...</div>
<div style="color: rgb(0, 74, 150)">...</div>

<!-- Don't use arbitrary values when built-ins exist -->
<div class="px-[16px] py-[8px] rounded-[4px]">...</div>

<!-- Don't use inline styles for layout/spacing -->
<div style="display: flex; gap: 8px; padding: 16px;">...</div>
```

---

## When to Extend the Theme

If the same arbitrary value appears in **3+ components**:

- v4: add a token to `@theme` in `[TODO: config file]`
- v3: add to `extend.colors` / `extend.spacing` in `tailwind.config.ts`

For composed reusable patterns:

- v4: add a class to `@layer components` or `@layer utilities`
- v3: add to `plugins` array with `addComponents()` / `addUtilities()`

---

## JIT / Dynamic Classes

When using dynamic Tailwind classes that may not be detected by JIT:

- v4: register with `@source inline('class-name')` in the config file
- v3: add to `safelist` in `tailwind.config.ts`

---

## Checklist

- [ ] All colors use theme token utilities — no hardcoded hex
- [ ] Built-in Tailwind utilities used — arbitrary values only as exception
- [ ] Reusable classes defined in `@layer` / `plugins` — not duplicated in templates
- [ ] No inline styles or scoped CSS for layout/spacing/colors
- [ ] Dynamic classes handled with `@source inline` / safelist
- [ ] Theme extended when pattern appears in 3+ components
