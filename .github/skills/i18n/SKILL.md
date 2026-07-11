# Internationalization (i18n)

> **Stack-specific skill** (react-i18next). Six locales: `en`, `es`, `ar`, `de`, `fa`, `fr` in `src/i18n/locales/`. `ar` and `fa` are RTL.

Best practices for **translation key management** and **i18n usage** in this React project.

## Core Rules

1. **Every visible label must use `t()`** — no hardcoded display text.
2. **All six locale files updated simultaneously** — never add a key to `en.json` without adding it to `es.json`, `ar.json`, `de.json`, `fa.json`, and `fr.json`.
3. **Never delete existing keys without explicit confirmation.**
4. **Search before creating** — check whether a key already covers the label.
5. **Dot-nested camelCase keys** — `settings.language`, `bahai.months.jalal`. Bahá'í-specific terms use the `bahai.*` prefix.

## Locale Files

```
src/i18n/
├── index.js          ← i18next config + language detector
└── locales/
    ├── en.json        ← English (source of truth)
    ├── es.json        ← Spanish
    ├── ar.json        ← Arabic (RTL)
    ├── de.json        ← German
    ├── fa.json        ← Persian/Farsi (RTL)
    └── fr.json        ← French
```

## Key Naming Conventions

| Scope               | Pattern                 | Example                                        |
| ------------------- | ----------------------- | ---------------------------------------------- |
| Feature / page      | `{feature}.{label}`     | `settings.language`, `help.title`              |
| Bahá'í domain terms | `bahai.{group}.{label}` | `bahai.months.jalal`, `bahai.holyDays.naw-ruz` |
| Shared labels       | `shared.{label}`        | `shared.today`, `shared.close`                 |

## Usage in Components

```jsx
import { useTranslation } from 'react-i18next';

function Settings() {
  const { t } = useTranslation();
  return <h2>{t('settings.title')}</h2>;
}
```

With interpolation:

```jsx
<p>{t('shared.eventCount', { count: total })}</p>
```

## Adding New Translation Keys

1. Identify the right key path (feature / `bahai.*` / `shared.*`).
2. Search `src/i18n/locales/` for existing coverage.
3. Add the key to **all six** locale files with the translated value.
4. Verify JSON validity (no trailing commas, correct nesting).
5. Use `t('key')` via `useTranslation()`.

## RTL (ar, fa)

- The app switches document direction for `ar` and `fa`. Verify layouts mirror correctly.
- Prefer logical Tailwind utilities (`ps-*`/`pe-*`, `ms-*`/`me-*`, `text-start`/`text-end`) so components flip automatically.

## Pluralization

react-i18next uses ICU-style plural keys:

```json
{
  "shared": {
    "eventCount_one": "{{count}} event",
    "shared_other": "{{count}} events"
  }
}
```

```jsx
t('shared.eventCount', { count });
```

## Review Checklist

- [ ] All six locale files updated for every new key
- [ ] No hardcoded display text in components
- [ ] Keys follow dot-nested camelCase; Bahá'í terms use `bahai.*`
- [ ] No duplicate keys — searched before creating
- [ ] JSON valid after editing
- [ ] RTL verified for `ar` and `fa`
