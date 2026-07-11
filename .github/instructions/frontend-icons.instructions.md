---
description: Frontend icon usage rule for Bahá'í Calendar. Use when adding any clickable/icon button or any inline icon in React components under `src/`.
applyTo: 'src/**'
---

<!-- absorbed from .github_old — verify still applies -->

# Frontend — Icon Usage Rule (mandatory, ALWAYS apply)

> ⚠️ **Hard rule — no exceptions.** Every icon rendered in the React app
> **MUST** go through the canonical `BaseIcon` component.
> This applies to plain decorative icons, clickable controls, toggle states,
> and icons inside reusable wrappers. If you find a `<svg>`, an inline SVG
> path, or a `react-icons/*` import being used as the rendered icon in a
> component, it is a bug and must be migrated to `BaseIcon`.

- Path: `src/components/base/BaseIcon.jsx`
- Re-exported from: `src/components/base/index.js`
- Icon registry: `src/components/base/icons/index.js`

## Required pattern

```jsx
import { BaseIcon } from '../components/base';

// Plain icon (no action)
<BaseIcon icon="close" size="sm" className="fill-gray-500" />

// Clickable icon — pass onClick directly to BaseIcon. NEVER wrap in <button>.
<BaseIcon
  icon="close"
  size="sm"
  onClick={handleClear}
  className="fill-slate-400 transition duration-200 hover:fill-gray-700"
  wrapperClassName="absolute inset-y-0 right-0 flex items-center pr-2"
/>
```

## Forbidden

- Do **not** wrap `BaseIcon` in a `<button>` (or any other interactive
  element). `BaseIcon` already handles `onClick` and adds `cursor-pointer`
  automatically.
- Do **not** import icons directly from `react-icons/*` and place them inside
  JSX as the rendered icon for a control.
  - Exception: `react-icons` may only be used inside `BaseIcon`'s own icon
    files in `src/components/base/icons/` to build a registry entry.
- Do **not** inline raw `<svg>` markup in components for buttons/controls.
  Add the SVG to `iconRegistry` and use `BaseIcon` instead.

## If the icon does not exist in `iconRegistry`

1. Create a new `XxxIcon.jsx` under `src/components/base/icons/` following the structure of `CloseIcon.jsx` (inline the SVG paths directly).
2. Register it in `src/components/base/icons/index.js` under `iconRegistry` with a lowercase camelCase key.
3. Use it via `<BaseIcon icon="newKey" ... />`.

## Styling reminders

- `className` → applied to the inner `<svg>` (use `fill-*`, `stroke-*`, `hover:*`, transitions).
- `wrapperClassName` → applied to the outer wrapper (use for layout/positioning).
- For clickable icons, pass `onClick` directly to `BaseIcon`. Do not wrap in `<button>`.

## Pre-commit checklist for any new/edited icon usage

- [ ] Rendered through `<BaseIcon>` (no raw `<svg>`, no `react-icons/*` in feature code).
- [ ] Icon key exists in `iconRegistry`; if new, the file lives under `src/components/base/icons/` and is registered with a lowercase camelCase key.
- [ ] Clickable icons receive `onClick` directly (no `<button>` wrapper).
