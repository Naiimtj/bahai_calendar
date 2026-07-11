---
applyTo: src/**/*.{jsx,tsx,js,ts}
---

<!-- absorbed from .github_old — verify still applies -->

# Base Components Rule

Always use components from `src/components/base/` for common UI primitives. Never use raw HTML elements when a base component exists.

## Mapping — use base, not raw HTML

| Need                      | Use                               | NOT                              |
| ------------------------- | --------------------------------- | -------------------------------- |
| Button / clickable action | `BaseButton`                      | `<button>`                       |
| Text input                | `BaseTextInput`                   | `<input type="text">`            |
| Number input              | `BaseNumberInput`                 | `<input type="number">`          |
| Textarea                  | `BaseTextarea`                    | `<textarea>`                     |
| Select / dropdown         | `BaseSelect` or `BaseSelectInput` | `<select>`                       |
| Multi-select              | `BaseMultiSelectInput`            | custom multi-select              |
| Autocomplete              | `BaseAutocompleteInput`           | custom autocomplete              |
| Checkbox                  | `BaseCheckbox`                    | `<input type="checkbox">`        |
| Toggle switch             | `BaseToggleSwitch`                | custom toggle                    |
| Toggle (generic)          | `BaseToggle`                      | custom toggle                    |
| Box selector              | `BaseBoxSelector`                 | custom radio group               |
| Search bar                | `BaseSearchBar`                   | `<input type="search">`          |
| Form date field           | `BaseFormDateField`               | `<input type="date">`            |
| Form wrapper              | `BaseForm`                        | `<form>`                         |
| Label                     | `BaseLabel`                       | `<label>`                        |
| Icon                      | `BaseIcon`                        | raw `<svg>`                      |
| Modal / dialog            | `BaseModal`                       | custom modal                     |
| Spinner / loader          | `BaseSpinner`                     | custom spinner                   |
| Tag / badge               | `BaseTag`                         | custom badge                     |
| Tooltip                   | `BaseTooltip`                     | title attribute / custom tooltip |
| Expandable section        | `BaseExpandableSection`           | custom accordion                 |
| Copy button               | `BaseCopyButton`                  | custom copy impl                 |
| File drop                 | `BaseDropFile`                    | custom drop zone                 |
| Anchor / link             | `BaseAnchor`                      | `<a>`                            |

All base components are exported from `src/components/base/index.js` — import from there.

```js
// correct
import { BaseButton, BaseTextInput, BaseSelect } from '../base';

// wrong
import BaseButton from '../base/BaseButton';
```

## If the base component doesn't exist

1. Create it in `src/components/base/` following the naming convention `Base<Name>.jsx`.
2. Export it from `src/components/base/index.js`.
3. Use the new component immediately — never leave raw HTML as a "temporary" impl.

## Exceptions

None. No raw HTML form/input/button elements in `src/` outside of `src/components/base/` itself.
