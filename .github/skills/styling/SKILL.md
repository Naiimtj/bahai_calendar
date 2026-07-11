# Styling React Components

> **Stack-specific skill** (TailwindCSS v4 + React 19). Tokens live in the `@theme` block of `src/index.css`. Never use inline `style={{}}` — see `.github/instructions/base-components.instructions.md`.

## Core Principles

1. **TailwindCSS over raw CSS** — always use Tailwind utility classes directly in templates instead of writing custom CSS rules
2. **Built-in utilities over arbitrary values** — prefer `px-4` over `px-[16px]`, `text-lg` over `text-[18px]`, `rounded-sm` over `rounded-[4px]`
3. **Closest built-in utility first** — when Figma values do not match exactly, choose the closest built-in Tailwind value before considering arbitrary values
4. **Arbitrary values are exception-only** — allow them only when no built-in utility can reasonably preserve layout/UX (for example very specific ratios, non-standard sizing constraints, or one-off rendering fixes)
5. **Theme colors over hardcoded values** — use the project's named colors (`text-primary`, `bg-grey-light`) instead of raw values (`text-[#004A96]`, `bg-[#ddd]`)
6. **Extend the theme when a pattern emerges** — if a color or class is reused across multiple components, add it to the `@theme` block in `src/index.css` rather than repeating it

## Theme Tokens

Project colors and design tokens are defined in the `@theme` block of `src/index.css` and used as standard Tailwind modifiers (`text-*`, `bg-*`, `border-*`). Dark mode is class-based, driven by `SettingsContext`. Before adding a raw color, check whether a token already exists in `src/index.css`.

## Guidelines

### Do

```jsx
{
  /* Use theme tokens + built-in utilities */
}
<div className="text-primary bg-white dark:bg-gray-900 px-4 py-2 rounded-sm text-sm font-semibold">
  …
</div>;

{
  /* Opacity modifiers on theme colors */
}
<div className="bg-primary/10 text-error">…</div>;

{
  /* Safe-area insets when a built-in utility can't express it */
}
<header className="pt-[max(0.75rem,env(safe-area-inset-top))]">…</header>;
```

### Don't

```jsx
{/* Don't hardcode color values or use inline styles (forbidden) */}
<div className="text-[#004A96]">…</div>
<div style={{ color: 'rgb(0,74,150)' }}>…</div>

{/* Don't use arbitrary values when a built-in utility exists */}
<div className="px-[16px] py-[8px] rounded-[4px] text-[14px]">…</div>
```

### Closest-match policy

1. Try the nearest built-in utility first (`w-7/12` over `w-[58%]`, `text-xl` over `text-[20px]`).
2. If the visual result is acceptable, keep the built-in utility.
3. Use arbitrary values only when built-ins cannot preserve intended layout/behavior (e.g. `env(safe-area-inset-*)`).

### When to extend the theme

If the same arbitrary color/pattern appears in **3+ components**, add a token to the `@theme` block in `src/index.css` instead of repeating it, then update this skill if the token is significant.

### RTL

Locales `ar` and `fa` render right-to-left. Prefer logical utilities (`ps-*`/`pe-*`, `ms-*`/`me-*`, `text-start`/`text-end`) over left/right-specific ones so layouts mirror correctly.
