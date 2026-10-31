---
description: Lint discipline for JavaScript and JSX
applyTo: '**/*.{js,jsx,ts,tsx}'
---

<!-- absorbed from .github-old — verify still applies -->

# Lint Discipline

Never add comments that suppress or silence linter or type-checker warnings. Do not introduce `eslint-disable`, `@ts-ignore`, `@ts-expect-error`, `@ts-nocheck`, `prettier-ignore`, or equivalent directives. Fix unused values, imports, hook dependencies, and type issues at their cause. If suppression appears unavoidable, ask the user before adding it.
