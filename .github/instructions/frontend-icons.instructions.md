---
description: Canonical icon usage rule for React components under src/
applyTo: src/**
---

<!-- absorbed from .github-old — verify still applies -->

# Frontend Icon Usage

Every rendered icon must use `BaseIcon` from `src/components/base/BaseIcon.jsx`, re-exported by `src/components/base/index.js`. Do not inline raw SVG or import `react-icons/*` directly in feature components.

For a clickable icon, pass `onClick` directly to `BaseIcon`; do not wrap it in a button. If a key is missing, add the SVG to `src/components/base/icons/`, register it in `icons/index.js`, then use the registry key. Icon-only controls require an accessible label.
