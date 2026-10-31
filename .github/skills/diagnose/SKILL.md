---
name: diagnose
description: Disciplined diagnosis loop for hard bugs and performance regressions. Use when debugging, reproducing failures, or investigating intermittent behavior.
---

<!-- absorbed from .github-old — verify still applies -->

# Diagnose

Build a fast, deterministic feedback loop before changing code. Prefer, in order: a failing test, HTTP/CLI harness, headless browser, captured trace replay, minimal harness, property loop, or a final human-in-the-loop script.

Do not proceed until the loop reproduces the user-described symptom. Rank 3-5 falsifiable hypotheses before instrumentation, change one variable at a time, tag temporary logs, and remove them afterward.

Write a regression test before the fix when a correct seam exists; otherwise document the missing seam. Re-run the original repro after the fix, verify the regression check, remove debug instrumentation and throwaway prototypes, and record the confirmed cause.
