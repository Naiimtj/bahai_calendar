# Accessibility

Every React feature must be perceivable, operable, understandable, and robust.

## Semantics and Interaction

- Use native `button`, `a`, `input`, `label`, `nav`, `main`, `section`, `ul`, and `table` elements for their intended purpose.
- Every interactive control must be keyboard reachable and operable with Enter or Space.
- Icon-only controls need a translated accessible name.
- Do not use `role="button"` on a `div` when a real button is available.
- Keep a visible focus indicator and do not remove outlines without an equivalent high-contrast state.

## Dialogs and Dynamic Content

- Dialogs need `role="dialog"`, `aria-modal="true"`, a labelled title, focus placement on open, focus return on close, and focus containment.
- Use `aria-expanded` and `aria-controls` for expandable content.
- Use `aria-live` for status and validation messages without stealing focus.
- Mark loading containers with `aria-busy` when appropriate.

## Visual and Motion

- Maintain WCAG AA contrast for text and controls.
- Do not convey state through color alone; pair color with text, icon, shape, or pattern.
- Support light, dark, and RTL (`ar` and `fa`) modes.
- Respect `prefers-reduced-motion` and provide focus/touch equivalents for hover behavior.
- Do not disable zoom or pinch gestures.

## Structure

- Keep one page-level `h1` and a sequential heading hierarchy.
- Provide a skip link to the main content area where the shell supports it.
- Test keyboard navigation, focus order, dialog behavior, RTL layout, and narrow mobile layouts for changed UI.
