# Migration State

## Identity

- Migration identifier:
- Source stack/framework:
- Legacy source root:
- Frontend target root:
- Backend target root: `NOT APPLICABLE` or absolute path

## Phase

- Analysis status:
- Last completed phase:
- Next phase:
- Blockers:

## AST Analysis

- AST status: `COMPLETE` or `BLOCKED`
- Temporary AST corpus persisted: `NO`
- Source files discovered / parsed / blocked:
- Parser adapter per language:
- Source hash summary and verification result:
- Syntax errors or missing parsers:
- Explicitly excluded files and evidence:

Do not persist literal AST values or copy the temporary AST corpus into a target.

## Confirmed Behavior and Questions

- Evidenced behavior:
- User-confirmed behavior:
- Pending questions and answers:
- Excluded/dead behavior:
- Environment-specific behavior:

## Frontend Library Decisions

- Detected/current UI library and evidence:
- UI library decision: `KEEP CURRENT`, `ATOMS/PRIMEVUE`, or `VUETIFY`
- Detected/current styling library and evidence:
- Styling library decision: `KEEP CURRENT`, `TAILWINDCSS`, or `UNOCSS`
- Approved migration direction or `NO CHANGE`:
- Confirmation status: `USER CONFIRMED` or `BLOCKED`

## Backend Decision

- Decision: `REQUIRED` or `NOT REQUIRED`
- Evidence:
- Confirmed server-side behavior:
- Rejected browser-only alternative:
- Contracts:

## Company Styling and Mapping

- Selected UI/styling libraries and exact verified versions:
- Atoms/PrimeVue or Vuetify integration evidence, when selected:
- Theme and evidence:
- Tokens/components/icons/assets:
- Component map path:
- Planned/implemented/verified/blocked/excluded totals:

## Assumptions

Repeat for every assumption:

```text
Status: ASSUMED - NEEDS CONFIRMATION
Reason:
Impact:
Affected files:
Requested confirmation:
Resolution:
```

## Validation and Files

| Check | Command or method | Result | Evidence/blocker |
| ----- | ----------------- | ------ | ---------------- |

- Created files:
- Modified files:
- Git: `NOT REQUESTED` unless explicitly requested by the user
- Remote configured: `NO`
