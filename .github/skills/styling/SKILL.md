# Styling React Components

Project styling uses TailwindCSS v4 through `@tailwindcss/vite`. Theme tokens and shared layers live in `src/index.css`.

## Rules

- Prefer Tailwind utilities over new CSS rules.
- Prefer built-in utilities over arbitrary values.
- Use named tokens from `src/index.css`; never hardcode colors in JSX.
- Use existing wrappers in `src/components/base/` before creating a new primitive.
- Keep layout, spacing, responsive behavior, RTL support, and focus states in the component's class names or shared CSS layers.
- Avoid inline `style={{}}` props for layout, colors, or typography.
- Keep touch targets usable, form text at least 16px on mobile, and fixed UI clear of safe-area insets.
- Respect `prefers-reduced-motion` for transitions and gestures.

## Responsive and RTL

- Use logical spacing and alignment utilities where the existing Tailwind setup supports them.
- Prefer `100dvh` for app shells and safe-area padding for fixed headers, bottom bars, sheets, and toasts.
- Gate hover-only behavior with hover capability and provide equivalent focus and touch states.

## Extending Tokens

If a color or class pattern is reused across three or more components, add it to the appropriate `@theme` or `@layer` in `src/index.css`. Do not invent brand tokens without evidence from the existing stylesheet.

## Validation

- Check light, dark, RTL, narrow, and wide layouts when a shared component changes.
- Check keyboard focus and reduced-motion behavior for interactive UI.
- Run `pnpm lint` and the focused Vitest test before reporting completion.
