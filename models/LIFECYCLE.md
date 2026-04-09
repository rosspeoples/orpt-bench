# Model Lifecycle

Updated: 2026-04-09T02:46:04.959Z

## Summary

- Active: 6
- Candidate: 17
- Deprecated: 17
- Sunset: 0

## Planned Cycles

| Cycle | Enabled | Matrix | Task Glob | Models |
| --- | --- | --- | --- | --- |
| candidate_smoke | yes | direct | 16-event-status-shell,17-log-level-rollup,05* | opencode/gemini-3.1-pro, opencode/gpt-5.4-nano, opencode/minimax-m2.5-free |
| weekly | yes | current_task_cheap_comparable | * | opencode/gpt-5.4-mini, opencode/gpt-5.4-nano, opencode/kimi-k2.5, opencode/minimax-m2.5, opencode/glm-5.1, opencode/big-pickle |
| monthly | yes | release | * | opencode/glm-5.1, opencode/gpt-5.4-nano, opencode/kimi-k2.5, opencode/minimax-m2.5, opencode/gpt-5.4, opencode/gemini-3.1-pro, opencode/claude-opus-4-6 |

## Active

- opencode/big-pickle: Full benchmark published with 14/17 task successes. Cost is still unknown, but capability is strong enough for inclusion in the cheap comparable field.
- opencode/glm-5.1: Full benchmark published with 16/17 task successes after harness fairness fixes. This is the current strongest cheap frontier-style result in the field.
- opencode/gpt-5.4-mini: Established low-cost headless dev baseline and still the preferred smallest proven matrix member.
- opencode/gpt-5.4-nano: Full benchmark published with 16/17 task successes at very low observed cost, making it a flagship cheap OpenAI comparable result.
- opencode/kimi-k2.5: Full benchmark published with 14/17 task successes at low observed cost. Included in the promoted cheap comparable field.
- opencode/minimax-m2.5: Full benchmark published with 11/17 task successes after harness fairness fixes. Included as a meaningful cheap comparable model.

## Candidates

- opencode/claude-3-5-haiku: Discovered in the current inventory and awaiting initial smoke benchmarking.
- opencode/claude-haiku-4-5: Discovered in the current inventory and awaiting initial smoke benchmarking.
- opencode/claude-opus-4-6: Discovered in the current inventory and awaiting initial smoke benchmarking.
- opencode/claude-sonnet-4: Discovered in the current inventory and awaiting initial smoke benchmarking.
- opencode/claude-sonnet-4-6: Discovered in the current inventory and awaiting initial smoke benchmarking.
- opencode/gemini-3-flash: Re-tested on the cleaned harness and still not promotion-ready on the control ramp.
- opencode/gemini-3.1-pro: Broader non-control slice completed on the cleaned harness, but results are not yet strong enough to justify a full run.
- opencode/gpt-5.1-codex-max: Discovered in the current inventory and awaiting initial smoke benchmarking.
- opencode/gpt-5.1-codex-mini: Cleaned smoke run completed, but the model timed out on all control tasks and is not promotion-ready.
- opencode/gpt-5.3-codex: Discovered in the current inventory and awaiting initial smoke benchmarking.
- opencode/gpt-5.3-codex-spark: Discovered in the current inventory and awaiting initial smoke benchmarking.
- opencode/gpt-5.4: Successful benchmark data exists, but the model has not yet met the 2-run smoke promotion requirement.
- opencode/gpt-5.4-pro: Discovered in the current inventory and awaiting initial smoke benchmarking.
- opencode/minimax-m2.5-free: Control-ramp smoke completed, but current results are not strong enough for promotion.
- opencode/nemotron-3-super-free: Discovered in the current inventory and awaiting initial smoke benchmarking.
- opencode/qwen3.6-plus-free: Re-tested and still blocked by provider-model-not-found failures.
- opencode/trinity-large-preview-free: Re-tested and still blocked by provider-model-not-found failures.

## Deprecated

- opencode/claude-opus-4-1: Superseded by opencode/claude-opus-4-6.
- opencode/claude-opus-4-5: Superseded by opencode/claude-opus-4-6.
- opencode/claude-sonnet-4-5: Superseded by opencode/claude-sonnet-4-6.
- opencode/gemini-3-pro: Superseded by opencode/gemini-3.1-pro.
- opencode/glm-4.6: Superseded by opencode/glm-5.1.
- opencode/glm-4.7: Superseded by opencode/glm-5.1.
- opencode/glm-5: Superseded by opencode/glm-5.1.
- opencode/gpt-5: Superseded by opencode/gpt-5.4.
- opencode/gpt-5-codex: Superseded by opencode/gpt-5.3-codex.
- opencode/gpt-5-nano: Superseded by opencode/gpt-5.4-nano.
- opencode/gpt-5.1: Superseded by opencode/gpt-5.4.
- opencode/gpt-5.1-codex: Superseded by opencode/gpt-5.3-codex.
- opencode/gpt-5.2: Superseded by opencode/gpt-5.4.
- opencode/gpt-5.2-codex: Superseded by opencode/gpt-5.3-codex.
- opencode/kimi-k2: Superseded by opencode/kimi-k2.5.
- opencode/kimi-k2-thinking: Superseded by opencode/kimi-k2.5.
- opencode/minimax-m2.1: Superseded by opencode/minimax-m2.5-free.

## Sunset

- None
