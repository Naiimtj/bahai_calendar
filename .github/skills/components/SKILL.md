# React Components

This project uses React 19 function components, custom primitives in `src/components/base/`, TailwindCSS v4, and `react-i18next`.

## Structure

- `src/components/base/`: reusable primitives and the icon barrel.
- `src/components/`: calendar views, modals, headers, and feature components.
- `src/hooks/`: reusable reactive logic.
- `src/context/`: shared state providers.

Before creating a component, search for an existing base primitive or neighboring feature with the same behavior. Keep reusable behavior in base components and domain behavior in feature components.

## Component Rules

- Use function components with explicit destructured props.
- Use `.jsx` for components and JavaScript conventions; do not introduce TypeScript source.
- Use `BaseIcon` and the existing icon registry for icons.
- Use `useTranslation()` for every user-facing label.
- Prefer semantic HTML and keyboard-operable controls.
- Keep business logic in contexts, hooks, services, or pure helpers rather than complex JSX.
- Preserve parity across Gregorian, Compact, Mixed, and Badíʿ calendar views when changing shared calendar behavior.
- Use Tailwind utilities and existing `src/index.css` tokens; avoid inline styles.

```jsx
import { useTranslation } from 'react-i18next';

export function ExampleButton({ disabled = false, onClick }) {
  const { t } = useTranslation();
  return (
    <button type="button" disabled={disabled} onClick={onClick}>
      {t('shared.save')}
    </button>
  );
}
```

## Review Checklist

- Existing base components and similar features were searched.
- Props and callbacks are clear and stable.
- Labels are translated and icons use `BaseIcon`.
- Focus, keyboard, RTL, mobile, and reduced-motion states are considered.
- Changed behavior is mirrored across affected calendar views.
