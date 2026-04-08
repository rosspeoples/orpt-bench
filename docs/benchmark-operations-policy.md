# Benchmark Operations Policy

This document defines the non-negotiable operating rules for ORPT-Bench benchmark runs.

## Golden Rule

Never spend benchmark tokens on a run that has not been verified safe from the exact command path being used.

## Failure Visibility

Failed models are valuable benchmark evidence and must not be hidden.

- If a model is benchmarked fairly and fails, times out, or DNF's, publish that outcome.
- Show the bad result clearly in benchmark output.
- Preserve the zero score, wall time, cost, and DNF status so the failure is visible to users.
- Do not silently drop failed models from published results just because they performed badly.

## Retry Policy

Visibility and recurring spend are separate decisions.

- A model that fails a fair smoke benchmark should remain visible in the catalog and published results.
- That same model should not remain in recurring cheap unattended matrices by default.
- Failed smoke models may be retried only when explicitly requested, or when the model/version meaningfully changes.

## Control Smoke Gate

The control smoke gate is an ordered three-task ramp for cheap unattended support.

- The candidate smoke run uses `16-event-status-shell`, then `17-log-level-rollup`, then `05-log-audit-script`.
- Task `05-log-audit-script` remains the control anchor; it is not replaced or renamed.
- A passing smoke session means the model clears the full control ramp within the configured task timeouts.
- Models that time out or fail anywhere in the control ramp should receive a DNF or failed row for that task and a zero score for the failed task.
- That result is useful and should be published.
- A control-smoke failure means the model is not worth continued default unattended support in cheap recurring matrices.

## Timeout Policy

Task timeouts are required and task-defined.

- Every task must declare `timeoutSeconds` in `tasks/*/task.json`.
- Benchmark runs must derive their outer process timeout from the selected tasks, not from a guessed manual process cap.
- The derived outer timeout is:

  `sum(task.timeoutSeconds for selected tasks) + number_of_selected_tasks`

- Full wildcard runs must not start with a nonzero development-only process timeout override.

## DNF Policy

DNF is a first-class result state.

- A timed out or abandoned task must be marked `DNF`.
- A `DNF` task receives `score = 0`.
- Wall time and cost still count against the model.
- Benchmark output should show DNF counts in summaries and DNF status where practical in detailed views.

## Invalid Run Admission

Broken synthetic timeout artifacts must not become canonical benchmark outputs.

- Runs containing synthetic timeout filler rows must not overwrite `results/latest.json`.
- Runs containing synthetic timeout filler rows must not be eligible for GitHub Pages publication.
- Invalid raw artifacts may be retained for debugging, but must not be treated as benchmark evidence.

## Preflight Requirements

Before any token-spending run, verify and print:

- selected models
- selected task glob
- selected repeat count
- per-task timeout
- derived outer timeout
- process timeout override
- whether any runner containers are already active

If any of these are wrong, do not run the benchmark.

## Command Safety

- Prefer the repository's safe full-run wrapper for publication-quality runs.
- Do not rely on shell assumptions about environment precedence.
- Do not use a benchmark command path unless its resolved inputs have been verified from that exact invocation path.

## Principle

Bad models should be measured and exposed.
Bad benchmark runs should be rejected and never promoted.

## Persistence Requirement

Completed benchmark value must not die in a local worktree.

- Any benchmark command path used for meaningful smoke or full runs must have a corresponding persist step that commits and pushes the resulting artifacts.
- Scheduled workflows must use a runner label that actually exists on the Gitea instance.
- Overnight or manual batch scripts must checkpoint benchmark artifacts during execution rather than waiting until the very end.
