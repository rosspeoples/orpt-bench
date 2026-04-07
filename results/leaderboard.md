# Model Summary

| Rank | Model | Score | Value Score | Composite Score | Success Rate | Request Count | ORPT | Total Wall Time (s) | Total Cost (USD) | Eligible | Comparable | Cohort Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | opencode/gpt-5.4-mini | 1.00 | 1.000 | 1.000 | 100% | 6 | 6.00 | 48.3 | 0.0106 | yes | yes |  |

# Limited Comparability

| Rank | Model | Score | Value Score | Composite Score | Success Rate | Request Count | ORPT | Total Wall Time (s) | Total Cost (USD) | Eligible | Comparable | Cohort Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | opencode/gemini-3-flash | 0.00 | 0.000 | 0.000 | 0% | 4 | n/a | 106.6 | 0.0000 | no | no | unattendedBenchmarkRuns: limited |

# Task Detail

| Task | Model | Score | Value Score | Composite Score | Success Rate | Request Count | Avg Requests | Total Wall Time (s) | Total Cost (USD) | Avg Steps | Comparable | Cohort Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 05-log-audit-script | opencode/gpt-5.4-mini | 1.00 | 1.000 | 1.000 | 100% | 6 | 6.00 | 48.3 | 0.0106 | 1.00 | yes |  |

# Task Detail: Limited Comparability

| Task | Model | Score | Value Score | Composite Score | Success Rate | Request Count | Avg Requests | Total Wall Time (s) | Total Cost (USD) | Avg Steps | Comparable | Cohort Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 05-log-audit-script | opencode/gemini-3-flash | 0.00 | 0.000 | 0.000 | 0% | 4 | 4.00 | 106.6 | 0.0000 | 0.00 | no | unattendedBenchmarkRuns: limited |

# Scoring

- `Score` is binary correctness.
- `Value Score` is the secondary efficiency metric based on ORPT, actual observed cost, and wall time.
- `Composite Score = 0.70 * Score + 0.30 * Value Score`.
- Comparable model rankings are sorted by `Composite Score`, with ORPT as a tie-breaker.

# Value Score Components

| Task | Model | Value Score | ORPT Factor | Cost Factor | Time Factor |
| --- | --- | --- | --- | --- | --- |
| 05-log-audit-script | opencode/gpt-5.4-mini | 1.000 | 1.000 | 1.000 | 1.000 |

# Pricing Provenance

| Model | Benchmark Price $/1M | Reference Price $/1M | Price Source | Price Type | Price Confidence | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| opencode/gpt-5.4-mini | 1.6875 | n/a | openrouter | automatic-openrouter-primary | medium | Primary blended price derived automatically from OpenRouter listing openai/gpt-5.4-mini using a 3:1 input:output blend. |
| opencode/gemini-3-flash | 1.1 | n/a | artificial-analysis | manual-primary-with-openrouter-reference | high | OpenRouter reference blend for google/gemini-3-flash-preview is 1.125 USD per 1M tokens using a 3:1 input:output mix. |

## Capability Coverage

- Fully comparable models for the current task set: opencode/gpt-5.4-mini
- Models with limited comparability: opencode/gemini-3-flash
- Task set capability requirements: unattendedBenchmarkRuns

Known exclusions by model:
- opencode/gemini-3-flash: 05-log-audit-script (unattendedBenchmarkRuns: limited)


## Capability Matrix

| Capability | Required By Tasks | Supported Models | Limited Models | Unsupported Models | Unknown Models |
| --- | --- | --- | --- | --- | --- |
| unattendedBenchmarkRuns | 01-iac-kubernetes-rollout, 02-terraform-static-site, 03-ansible-nginx-role, 04-docker-compose-observability, 05-log-audit-script | opencode/gpt-5.4-mini | opencode/gemini-3-flash | - | - |
