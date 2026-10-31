# State Management

> **Stack-specific skill** (React 19 Context API). Global state lives in `src/context/` as `createContext` + provider + `useXxx()` hook. For other stacks, start from `skills-templates/state-management/` and replace this file.

Best practices for **contexts**, **hooks**, and shared state in this project.

## Context Boundaries & Scope

### One domain, one context

Each provider in `src/context/` owns a **single domain concern**. If you can describe it with "and", split it.

- `SettingsContext` — settings, language, dark mode (persisted to `localStorage`)
- `BadiYearContext` — Badíʿ year data
- `PersonalEventsContext` — user personal events

```jsx
// context/SettingsContext.jsx
const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem('darkMode') ?? 'system',
  );

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  const value = useMemo(() => ({ darkMode, setDarkMode }), [darkMode]);
  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
```

### Detect duplicated or overlapping state

- Before adding state to a context, check whether it already lives elsewhere.
- Two contexts holding the same concept (different name) → consolidate into one authoritative owner.
- A context reading another context is fine; shared mutable state must have a single owner.

## Context vs Hook vs Util

| Need                                         | Use                  | Location               |
| -------------------------------------------- | -------------------- | ---------------------- |
| Global state shared across many components   | **Context provider** | `src/context/*.jsx`    |
| Reusable reactive logic, not globally shared | **Custom hook**      | `src/hooks/use*.js`    |
| Pure transformation / formatting, no React   | **Utility**          | `src/utils/*.js`       |
| Badíʿ date conversion                        | **lib**              | `src/lib/badiDate.jsx` |

**Boundary violations to flag:**

- A hook keeping module-scope mutable state so all callers share it → should be a context.
- A context consumed by only one component → consider local `useState` or a hook.
- A "utility" importing React hooks → should be a hook.

## Mutating State

### Mutate through provider actions only

Consumers must never mutate context values directly. Expose action functions from the provider.

```jsx
// Good — component calls an action
const { addEvent } = usePersonalEvents();
addEvent(newEvent);

// Bad — component reaches into and mutates context data
const { events } = usePersonalEvents();
events.push(newEvent); // ❌ direct mutation, no re-render
```

### Immutable updates

Treat state as immutable. Produce new arrays/objects instead of mutating in place:

```jsx
setEvents((prev) => [...prev, newEvent]);
setSettings((prev) => ({ ...prev, weekStart: 'monday' }));
```

## Effect & Memo Dependencies

- Keep `useEffect` / `useMemo` / `useCallback` dependency arrays **focused and complete** — list the specific values used, not whole context objects.
- Do not silence `react-hooks/exhaustive-deps` (see `.github/instructions/lint-discipline.instructions.md`) — fix the root cause (add the dep, restructure, or memoize).
- Memoize the context `value` object with `useMemo` so consumers don't re-render on every provider render.

## Persistence

- Settings persist to `localStorage` through `SettingsContext` (write in a `useEffect` keyed on the value).
- Never read/write `localStorage` scattered across components — go through the owning context.

## Review Checklist

- [ ] Context owns a single domain concern — no "and"
- [ ] No duplicated state across contexts — single source of truth
- [ ] Components mutate only via provider actions, never directly
- [ ] State updates are immutable (new arrays/objects)
- [ ] Context `value` is memoized with `useMemo`
- [ ] Effect/memo dependency arrays are complete and focused (no lint suppression)
- [ ] Context vs hook vs util boundaries respected
