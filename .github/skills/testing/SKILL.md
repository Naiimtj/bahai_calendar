# Vitest Testing

The project uses Vitest 4 with the Node environment and tests under `src/**/*.test.js`.

## Test Priorities

- Test pure calendar/date utilities and service mapping logic thoroughly.
- Test context actions and non-trivial hooks through their public behavior.
- Test component branches and interactions when the environment supports the required DOM behavior.
- Mock network services with `vi.mock()` or `vi.fn()`; do not call live endpoints in unit tests.

## Conventions

- Place tests beside the source file: `src/utils/date.test.js` or `src/context/SettingsContext.test.js`.
- Keep tests deterministic and independent.
- Cover valid, empty, invalid, boundary, and error cases.
- Do not assume browser globals or a DOM test library unless the test explicitly configures them and the dependency exists.

```js
import { describe, expect, it } from 'vitest';

function formatEventLabel(event) {
  return event?.label || 'Unknown event';
}

describe('formatEventLabel', () => {
  it('handles a missing event', () => {
    expect(formatEventLabel(null)).toBe('Unknown event');
  });
});
```

## Commands

- `pnpm test` runs the suite once.
- `pnpm test:watch` runs Vitest in watch mode.

Before reporting completion, run the narrowest affected test, then `pnpm test` when the change is shared.
