---
applyTo: src/**/*.{jsx,tsx,js,ts}
---

<!-- absorbed from .github-old — verify still applies -->

# Base Components Rule

Use components from `src/components/base/` for common UI primitives. Prefer `BaseButton`, `BaseTextInput`, `BaseNumberInput`, `BaseSelect`, `BaseCheckbox`, `BaseToggleSwitch`, `BaseModal`, `BaseIcon`, `BaseSpinner`, `BaseTooltip`, `BaseLabel`, and `BaseAnchor` over raw equivalents. Import from `src/components/base/index.js`.

If a needed primitive is missing, create `Base<Name>.jsx`, export it from the barrel, and use it immediately. Do not leave temporary raw form controls in feature code.
