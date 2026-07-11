# Accessibility (a11y)

Accessibility rules for frontend components and pages in this project. Every user-facing feature must be perceivable, operable, and understandable by all users, including those relying on assistive technologies.

## Semantic HTML

### Use the right element for the job

- Use `<nav>`, `<main>`, `<aside>`, `<header>`, `<footer>`, `<section>`, `<article>` to convey document structure
- Use `<ul>` / `<ol>` for lists of items, `<table>` for tabular data — not `<div>` grids
- Use `<label>` elements explicitly associated with form inputs via `for` / `id` binding or wrapping

```jsx
{
  /* Bad — div pretending to be a button */
}
<div className="btn" onClick={save}>
  Save
</div>;

{
  /* Good — semantic button via base component */
}
<BaseButton onClick={save}>{t('btn.save')}</BaseButton>;
```

### Avoid div/span soup

- If the element conveys meaning, use a semantic tag
- Only use `<div>` / `<span>` for purely presentational wrappers with no interactive or structural role

### Component library awareness

- Component libraries generally emit accessible markup — check the rendered HTML when in doubt
- When wrapping a library component, verify that ARIA attributes are correctly forwarded or supplemented
- If a wrapper removes or hides native accessibility features, fix it at the wrapper level so all consumers benefit

## ARIA Attributes

### When to add ARIA

ARIA is a supplement, not a replacement — **prefer native HTML semantics first**. Add ARIA only when:

- A native element cannot express the role or state (e.g., custom dropdown, live region)
- A component needs extra context for screen readers (e.g., `aria-label` on an icon-only button)

### Required ARIA patterns

| Pattern              | Attribute(s)                                                        | Example                                                                     |
| -------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Icon-only button     | `aria-label`                                                        | `<BaseIcon icon="trash" onClick={onDelete} aria-label={t('btn.delete')} />` |
| Toggle / switch      | `aria-checked`, `role="switch"`                                     | Ensure `BaseToggle` forwards these                                          |
| Expandable section   | `aria-expanded`, `aria-controls`                                    | `BaseExpandableSection` must manage these                                   |
| Modal / dialog       | `role="dialog"`, `aria-modal="true"`, `aria-labelledby`             | `BaseModal` handles this — verify on custom overlays                        |
| Loading state        | `aria-busy="true"` on the container                                 | Add while data is being fetched                                             |
| Live region          | `aria-live="polite"` or `aria-live="assertive"`                     | Toast notifications, inline validation messages                             |
| Form errors          | `aria-invalid="true"`, `aria-describedby` pointing to error message | Link input to its error text                                                |
| Tabs                 | `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected`  | `BaseTabs` must produce this structure                                      |
| Navigation landmarks | `aria-label` on `<nav>` when multiple navs exist                    | `<nav aria-label="Main navigation">`                                        |

### Common mistakes to avoid

- **Do not use** `aria-label` on non-interactive elements that already have visible text
- **Do not duplicate** the visible text in `aria-label` — use `aria-labelledby` to reference it instead
- **Never set** `role="button"` on a `<div>` — use a real `<button>` element
- **Do not hide** essential content with `aria-hidden="true"` — only decorative or redundant elements

## Keyboard Navigation

### Every interactive element must be keyboard-accessible

- All buttons, links, inputs, dropdowns, modals, tabs, and custom widgets must be **reachable via `Tab`** and **activatable via `Enter` or `Space`**
- Custom interactive elements must have `tabindex="0"` (to enter tab order) and keydown handlers for `Enter` / `Space`

### Focus management rules

| Scenario             | Expected behavior                                                           |
| -------------------- | --------------------------------------------------------------------------- |
| Modal opens          | Focus moves to the first focusable element inside the dialog                |
| Modal closes         | Focus returns to the trigger element                                        |
| Dropdown opens       | Focus moves to the first option                                             |
| Tab panel changes    | Focus moves to the active panel content                                     |
| Route change         | Focus moves to the `<main>` content area or page heading                    |
| Toast notification   | Do **not** steal focus — use `aria-live` instead                            |
| Inline error appears | Announce via `aria-live` or move focus to the first invalid field on submit |

### Focus trapping

- Modals and dialogs **must trap focus** — `Tab` and `Shift+Tab` cycle within the dialog only
- `BaseModal` should handle this — verify on any custom overlay

### Visual focus indicators

- **Never remove** the default focus outline (`outline: none`) without providing an equally visible custom indicator
- Use TailwindCSS `focus-visible:ring-2 focus-visible:ring-primary` or an equivalent style
- Focus indicators must have a **minimum 3:1 contrast ratio** against adjacent colors

```jsx
{
  /* Good — visible focus ring using Tailwind */
}
<button className="focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none">
  {t('btn.submit')}
</button>;
```

### Skip-to-content link

- The default layout should include a visually hidden "Skip to main content" link as the first focusable element, targeting `<main id="main-content">`

## Color Contrast

### Minimum ratios (WCAG 2.1 AA)

| Element                             | Minimum contrast ratio          |
| ----------------------------------- | ------------------------------- |
| Normal text (< 18px / < 14px bold)  | **4.5:1**                       |
| Large text (≥ 18px / ≥ 14px bold)   | **3:1**                         |
| UI components and graphical objects | **3:1**                         |
| Focus indicators                    | **3:1** against adjacent colors |

### Practical rules

- Use the project's theme tokens (`text-primary`, `text-secondary`, `bg-surface`, etc.) which should already meet contrast requirements — if they don't, fix the token
- **Never rely on color alone** to convey information — pair with icons, text, or patterns:
  - Status indicators: use icon + text + color (e.g., `<BaseIcon icon="check" /> {t('shared.success')}`)
  - Form validation: use red border + error icon + error message text
  - Charts / data visualisation: use distinct patterns or shapes alongside color
- When adding or overriding colors in scoped styles, verify contrast with a tool (e.g., browser DevTools contrast checker, axe)
- Disabled states may have reduced contrast, but must remain **distinguishable** from enabled states

### Dark theme considerations

- The project uses a dark theme preset — ensure custom colors work on dark backgrounds
- Test custom scoped styles against both the default dark surface and any alternative surface tokens

## Heading Hierarchy

### Rules

- Every page must have **exactly one `<h1>`** — typically the page title
- Headings must follow a **sequential descending order**: `h1 → h2 → h3 → ...` — never skip levels (e.g., `h1` then `h3`)
- The app shell (`App.jsx`) should not include headings that interfere with page-level hierarchy — the `<h1>` belongs in the page/view, not the shell
- Sidebar and footer content should use headings appropriate to their nesting level or use `aria-label` on landmark regions instead

### Enforcement in components

- Shared and feature components that render headings should accept a **`headingLevel`** prop (or use a sensible default) to avoid hardcoding a heading tag that may break the hierarchy when composed

```jsx
// Shared component with flexible heading level
function SectionTitle({ title, headingLevel = 2 }) {
  const Tag = `h${headingLevel}`;
  return <Tag className="text-xl font-semibold">{title}</Tag>;
}
```

- When composing a page, map out the heading structure to ensure no level is skipped:

```
h1 — Page title
  h2 — Section A
    h3 — Sub-section A.1
  h2 — Section B
```

## Accessibility Review Checklist

Before considering a UI task complete, verify:

- [ ] Semantic HTML elements are used (no `<div>` buttons or click-handler spans)
- [ ] All interactive elements are keyboard-accessible and have visible focus indicators
- [ ] Icon-only buttons and image elements have accessible labels (`aria-label`, `alt`)
- [ ] ARIA attributes are correctly applied where native semantics are insufficient
- [ ] Color is not the sole means of conveying information
- [ ] Text and UI component contrast meets WCAG 2.1 AA minimums
- [ ] Heading hierarchy is sequential and each page has exactly one `<h1>`
- [ ] Modals trap focus and return focus on close
- [ ] Dynamic content updates use `aria-live` regions
- [ ] Form inputs are associated with `<label>` elements and error messages use `aria-describedby`
