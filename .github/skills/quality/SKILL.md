# Code Quality & Clean Code

Clean code principles adapted for **JavaScript / JSX** and React components in the context of this project. (Source is `.jsx`/`.js`; use JSDoc where a type contract helps — do not introduce TypeScript files unless asked.)

## Naming

### Be descriptive and intentional

- **Variables**: describe what they hold — `activeRequests`, `isModalVisible`, `selectedSampleIds`
- **Functions**: describe what they do — `fetchRequestById()`, `formatDate()`, `resetFilters()`
- **Booleans**: use `is`, `has`, `should`, `can` prefixes — `isLoading`, `hasPermission`, `canSubmit`
- **Constants**: UPPER_SNAKE_CASE for true constants, camelCase for derived values — `MAX_RETRY_COUNT`, `DEFAULT_PAGE_SIZE`
- **Avoid generic names**: `data`, `info`, `temp`, `flag`, `result`, `item` — unless the scope is very small (e.g., a `.map()` callback)

### Naming consistency

- Use the same term for the same concept everywhere — if it's a "request" in the domain, don't call it "order" in some files and "submission" in others
- Match the naming conventions in `copilot-instructions.md` (camelCase for variables/functions, PascalCase for types/interfaces/enums/components, kebab-case for files)

## Functions

### Single Responsibility

Every function should do **one thing**. If you can describe it with "and", split it.

```typescript
// Bad — does two things
function fetchAndTransformRequests() {
  const raw = await get('/requests');
  return raw.map(mapToFrontendRequest);
}

// Good — separated concerns
async function fetchItems(): Promise<BackendItem[]> {
  return await get('/items');
}

function mapItems(raw: BackendItem[]): FrontendItem[] {
  return raw.map(mapToFrontendItem);
}
```

### Keep functions short

Aim for **≤ 30 lines**. If a function grows beyond that, extract helper functions with descriptive names.

### Limit parameters

- **≤ 3 parameters** is ideal
- If more are needed, group them into an options object or interface

```typescript
// Bad
function createRequest(title: string, samples: ISample[], accountId: string, priority: number, notes: string) { ... }

// Good
function createRequest(options: CreateRequestOptions) { ... }
```

### Prefer early returns

Reduce nesting by returning early for guard conditions:

```typescript
// Bad
function getLabel(item: Item | null) {
  if (item) {
    if (item.label) {
      return item.label;
    } else {
      return 'Unknown';
    }
  } else {
    return '';
  }
}

// Good
function getLabel(item: Item | null): string {
  if (!item) return '';
  if (!item.label) return 'Unknown';
  return item.label;
}
```

### Pure functions when possible

Functions in `utils/` should be **pure** — same input always produces same output, no side effects. This makes them easy to test and reason about.

## Constants & Magic Values

### No magic numbers or strings

Extract inline values to named constants or enums:

```typescript
// Bad
if (status === 3) { ... }
setTimeout(callback, 5000);

// Good
const STATUS_APPROVED = 3; // or better, use an enum
const TOAST_DURATION_MS = 5000;

if (status === RequestStatus.Approved) { ... }
setTimeout(callback, TOAST_DURATION_MS);
```

- Place shared constants near their usage or in a small module-level `const`
- Keep component-local constants at the top of the component function

## Error Handling

### Never silently swallow errors

```typescript
// Bad
try {
  await fetchData();
} catch (e) {
  // silently ignored
}

// Good
try {
  await fetchData();
} catch (error) {
  console.error('Failed to fetch data:', error);
  setError('Could not load data.'); // surface via UI state
}
```

### Be specific about what you catch

Don't wrap large blocks in try/catch. Wrap only the part that can fail and handle the specific failure.

## Code Organization

### One concern per file

- One context per file — `SettingsContext.jsx` handles settings, not also events
- One hook per file — `useSwipe.js` handles swipe, not also online status
- One utility topic per file — `weekNumber.js` has week helpers, not string utils

### Import order

Maintain a consistent import order (auto-organized by IDE is fine):

1. External packages (react, react-i18next, third-party libs)
2. Relative imports — base barrel first (`../base`), then other components/hooks/services
3. Local (`./`) imports

### Remove dead code

- Delete unused variables, functions, imports, and components
- Don't commit commented-out code — use version control to retrieve old code if needed
- Remove `console.log` statements before committing (except intentional `console.error` for error tracking)

## Type Safety & Defensive JS

### Prefer JSDoc over `any`; validate at boundaries

Source is JavaScript. Where a value's shape matters, add a JSDoc `@param`/`@returns` and validate inputs at boundaries (service responses, props) rather than trusting them.

### Use optional chaining and nullish coalescing

```js
// Bad
const name =
  user && user.profile && user.profile.name ? user.profile.name : 'Unknown';

// Good
const name = user?.profile?.name ?? 'Unknown';
```

## React-Specific

### Keep components organized

Follow this order within a component:

1. **Imports**
2. **Props destructuring**
3. **Context / hook** calls (`useSettings()`, `useTranslation()`, custom hooks)
4. **Local state** (`useState`, `useRef`)
5. **Derived values** (`useMemo`)
6. **Effects** (`useEffect`)
7. **Event handlers / helpers** (`useCallback` where needed)
8. **Return (JSX)**

### Avoid logic in JSX

Move conditionals and transformations to derived values or functions:

```jsx
// Bad
<span>{items.filter((i) => i.active).length > 0 ? 'Has active' : 'None'}</span>;

// Good
const activeItemsLabel = useMemo(
  () => (items.some((i) => i.active) ? 'Has active' : 'None'),
  [items],
);
<span>{activeItemsLabel}</span>;
```

### Don't mutate props or state

Treat props and state as immutable. Produce new values instead of mutating:

```jsx
// Bad
props.items.push(newItem);

// Good
onChange([...items, newItem]); // lift the change up
setItems((prev) => [...prev, newItem]); // or update local state immutably
```

## Comments

### Code should be self-explanatory

Good naming and structure reduce the need for comments. Use comments only for:

- **Why**, not **what** — explain non-obvious business rules or workarounds
- **TODOs** — mark known technical debt with a ticket reference: `// TODO(#1234): Refactor when API v2 is available`
- **JSDoc** on public hooks, utils, and complex functions for IDE hints

### Don't comment obvious code

```typescript
// Bad
// Set loading to true
setLoading(true);

// Good — no comment needed, the code speaks for itself
setLoading(true);
```

## Checklist

Before considering code clean:

- [ ] All names are descriptive and consistent
- [ ] Functions are short, focused, and have ≤ 3 parameters
- [ ] No magic numbers or strings — constants and enums are used
- [ ] No deep nesting — early returns are used
- [ ] No dead code, no commented-out code, no stray `console.log`
- [ ] Errors are handled explicitly, never silently swallowed
- [ ] `any` is not used — proper types are in place
- [ ] Template logic is minimal — computed properties handle complexity
- [ ] Props are never mutated directly
- [ ] Comments explain "why", not "what"
