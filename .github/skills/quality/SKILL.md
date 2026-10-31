# Code Quality and Clean Code

Quality guidance for JavaScript/JSX React code in this project.

## Naming and Organization

- Use PascalCase for React component filenames and camelCase for helpers, hooks, and variables.
- Use `.jsx` for components and `.js` for non-component modules.
- Use descriptive names such as `selectedDate`, `isLoading`, and `formatBadiDate`.
- Keep rendering in `src/components/`, shared state in `src/context/`, reactive logic in `src/hooks/`, services in `src/services/`, and pure helpers in `src/utils/` or `src/lib/`.
- Keep one concern per context, hook, service, utility, or component.
- Keep functions focused, prefer early returns, and group more than three parameters into an options object.
- Remove unused imports, dead code, and stray `console.log` calls.

## State and Effects

- Keep one authoritative owner for each piece of state.
- Update arrays and objects immutably through provider actions.
- Keep `useEffect` dependencies complete and focused; never suppress hook lint warnings.
- Keep context values stable when needed and avoid unnecessary derived state.

## Errors and Boundaries

- Do not silently swallow errors. Handle expected failures and preserve useful diagnostics.
- Validate external data before using it.
- Keep network access in `src/services/` and use native `fetch` according to the existing service patterns.
- Use JSDoc only where it clarifies a public JavaScript contract; do not introduce TypeScript source.

## Example

```js
function getEventLabel(event) {
  if (!event) return '';
  return event.label || 'Unknown event';
}
```

## Checklist

- Names are descriptive and consistent.
- Functions are short and single-purpose.
- No duplicated state or direct context mutation.
- No magic values without a named constant.
- Errors are handled explicitly.
- User-facing strings use `react-i18next`.
- Changed business logic has focused Vitest coverage.
