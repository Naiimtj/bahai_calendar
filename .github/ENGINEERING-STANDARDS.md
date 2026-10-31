# Lean Engineering Standards

This file is the compact, low-token reference for the project's engineering baseline. It intentionally captures the most important quality, performance, security, and scalability rules without overloading the model context.

Apply only the sections relevant to the current task. For routine work, focus on the first 20 rules and the rules tied to the affected domain; do not paste the full 100-item catalog into the main prompt.

## 1) Correctness and safety

1. Prefer the simplest correct solution over clever abstractions.
2. Validate assumptions before modifying behavior.
3. Read the nearest implementation and test before editing.
4. Preserve existing contracts unless the task explicitly changes them.
5. Fail fast on invalid input and missing configuration.
6. Do not hide errors; surface actionable failures.
7. Keep invariants explicit and check them at boundaries.
8. Prefer deterministic behavior over implicit state.
9. Avoid silent fallbacks when a failure matters.
10. Treat security and accessibility as default requirements, not optional polish.

## 2) Simplicity and maintainability

11. One responsibility per function, component, and module.
12. Keep names honest, precise, and consistent.
13. Prefer clear flow over clever indirection.
14. Keep functions small enough to reason about in one pass.
15. Remove dead code as soon as it is no longer needed.
16. Avoid duplication before checking for an existing abstraction.
17. Prefer composition over deep inheritance or coupling.
18. Minimize global mutable state.
19. Keep comments for intent, not obvious code explanation.
20. Make the next engineer's change cheap and obvious.

## 3) Architecture and boundaries

21. Separate transport, domain logic, and persistence layers.
22. Keep interfaces narrow and stable.
23. Do not leak implementation details across boundaries.
24. Make dependencies flow inward, not outward.
25. Prefer local modules before cross-cutting global helpers.
26. Keep side effects at the edge of the system.
27. Normalize data once at the boundary.
28. Keep domain rules near the domain, not in UI code.
29. Use explicit contracts for APIs, events, and config.
30. Prefer small modules over giant monoliths by concern.

## 4) Data, APIs, and schemas

31. Validate API input at the boundary.
32. Validate output shape before trusting external data.
33. Use typed contracts instead of loose dictionaries.
34. Reject unsupported values early and explicitly.
35. Keep pagination, filters, sorting, and error handling consistent.
36. Do not invent hidden API behavior.
37. Version breaking changes intentionally and document them.
38. Treat time, locale, and timezone as first-class data concerns.
39. Keep serialization and transformation logic explicit.
40. Avoid partial or ambiguous data contracts.

## 5) Frontend and UI quality

41. Build accessible interfaces by default.
42. Ensure keyboard and focus behavior works without a mouse.
43. Keep semantics meaningful: headings, labels, landmarks, and roles.
44. Use real components before custom reimplementations.
45. Keep visual state derived from data, not arbitrary classes.
46. Prefer reusable primitives over repeated bespoke markup.
47. Do not hardcode brand colors, user text, or URLs.
48. Keep views thin and logic in services, stores, or handlers.
49. Avoid unnecessary re-renders and expensive computed work.
50. Treat empty, loading, and error states as essential UI states.

## 6) Performance and scalability

51. Measure before optimizing.
52. Avoid work in loops that can be moved outside.
53. Cache results only when the cost and lifecycle are understood.
54. Prefer streaming, pagination, and lazy loading for large data.
55. Avoid unnecessary network round-trips.
56. Keep large data transformations pure and testable.
57. Minimize blocking work on the main UI thread.
58. Reuse computed values and memoized work where it helps.
59. Reduce memory churn in hot paths.
60. Design for growth by keeping bottlenecks visible and isolated.

## 7) Security and privacy

61. Never trust client input or user-controlled data.
62. Validate at every security boundary.
63. Never expose secrets, tokens, or internal errors to clients.
64. Use least privilege for service accounts and tokens.
65. Sanitize output before rendering HTML or rich content.
66. Avoid unsafe dynamic code execution.
67. Use secure defaults and verified libraries.
68. Treat logs as sensitive data and redact secrets.
69. Protect against injection, XSS, CSRF, and SSRF risks.
70. Make authorization checks explicit and central.

## 8) Testing and verification

71. Write tests for changed behavior, not only for happy paths.
72. Test edge cases, validation failures, and boundary conditions.
73. Prefer small, focused tests over giant end-to-end chains.
74. Keep tests readable and deterministic.
75. Do not test implementation details that are not user-visible.
76. Verify bug fixes with a failing check before the final fix.
77. Run the smallest relevant validation command for the change.
78. Keep regression coverage near the behavior being changed.
79. Prefer proving behavior with evidence over assumptions.
80. Treat broken tests as a release blocker unless explicitly waived.

## 9) Collaboration and workflow

81. Keep changes scoped to the root cause.
82. Do not broaden scope with unrelated cleanup.
83. Resolve conflicts early and make the root decision explicit.
84. Document any non-obvious tradeoff in the code or project notes.
85. Keep PRs and diffs reviewable and small.
86. Prefer incremental delivery over large opaque rewrites.
87. Make it easy for teammates to understand the change.
88. Keep conventions consistent with the repository, not with personal preference.
89. Ask for clarification only when the requirement is genuinely ambiguous.
90. Prefer durable project memory over ad hoc tribal knowledge.

## 10) Delivery and operations

91. Keep environments, config, and secrets explicit and separate.
92. Design for observability from the start.
93. Add metrics and logging around business-critical paths.
94. Make failures diagnosable with useful context, not vague logs.
95. Keep build, lint, and test commands reproducible.
96. Prefer automation for repetitive checks and deployment safety.
97. Keep infrastructure changes reviewable and traceable.
98. Design rollback paths for risky changes.
99. Monitor the real bottlenecks, not only the obvious symptoms.
100.  Improve the system in small, measurable steps; avoid one-off overengineering.

## Operating rule

When a task is large, do not read all 100 rules in one pass. Read the section relevant to the current risk, apply the checklist, then continue. The goal is to raise quality without exhausting model context or producing prompt bloat.
