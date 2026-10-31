# Project Styling Evidence

Use this skill when reviewing branding, typography, icons, colors, tokens, or visual consistency. This repository has no verified external company design system; use only evidence in the project.

## Sources of Truth

- `src/index.css`: TailwindCSS v4 theme tokens and shared layers.
- `src/components/base/`: reusable controls and icon wrappers.
- `src/components/base/icons/`: the existing SVG icon registry.
- `public/` and `icons/`: project assets already present in the repository.
- Existing components: the strongest evidence for spacing, color, typography, radius, and interaction patterns.

Do not invent brand colors, logos, fonts, library APIs, or assets. If a requested visual treatment is not evidenced, state the assumption and use the nearest existing project token.

## UI Rules

- Prefer existing base components and `BaseIcon`.
- Use Tailwind classes and tokens from `src/index.css`; avoid inline styles and hardcoded colors.
- Keep user-facing text in `react-i18next` locale keys.
- Preserve light, dark, RTL (`ar`/`fa`), keyboard, contrast, and reduced-motion behavior.
- Keep calendar feature styling consistent across Gregorian, Compact, Mixed, and Badíʿ views.
- Use the design and animation skills for motion decisions; do not add dependencies unless explicitly requested.

## Audit Checklist

- Token and asset source verified.
- Existing component reused where possible.
- No invented visual identity or unverified package API.
- Responsive, RTL, focus, contrast, and reduced-motion states checked.
- `pnpm lint` and focused tests run after implementation.
