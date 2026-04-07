# Cheap Model Review

Reference notes for requested cheap/free model families that may or may not currently be present in the OpenCode inventory.

## In OpenCode Inventory

| Requested Family | OpenCode Model | Notes |
| --- | --- | --- |
| MiniMax M2.5 | `opencode/minimax-m2.5` | Present in inventory. OpenRouter-derived blended price added at `0.3365` USD per 1M tokens. |
| MiniMax M2.5 Free | `opencode/minimax-m2.5-free` | Present in inventory. Free listing plus paid sibling reference price `0.3365` USD per 1M tokens added. |
| GLM-5 | `opencode/glm-5` | Present in inventory. Artificial Analysis price retained at `1.6`; OpenRouter reference blend noted at `1.115` USD per 1M tokens. |
| Trinity Large Preview Free | `opencode/trinity-large-preview-free` | Present in inventory. Free listing plus nearby paid family reference price `0.3775` USD per 1M tokens added. |
| Big Pickle | `opencode/big-pickle` | Present in inventory. No reliable external price reference found yet. |

## Requested But Not In Current OpenCode Inventory

| Requested Family | External Match Reviewed | Notes |
| --- | --- | --- |
| Mimo V2 Flash | `xiaomi/mimo-v2-flash` on OpenRouter | Not in OpenCode inventory currently. OpenRouter-derived blended price is approximately `0.14` USD per 1M tokens. |
| Mimo V2 Pro | `xiaomi/mimo-v2-pro` on OpenRouter | Not in OpenCode inventory currently. OpenRouter-derived blended price is approximately `1.5` USD per 1M tokens. |
| MiniMax M2.7 | `minimax/minimax-m2.7` on OpenRouter | Not in OpenCode inventory currently. OpenRouter-derived blended price is approximately `0.525` USD per 1M tokens. |
| GLM-5.1 | No confirmed match | No matching OpenRouter or OpenCode model found in this review. |
| Trinity Mini | `arcee-ai/trinity-mini` and `arcee-ai/trinity-mini:free` on OpenRouter | Not in OpenCode inventory currently. Paid variant implies a blended reference price of approximately `0.07125` USD per 1M tokens; free variant is listed at zero. |
| Trinity Large | `arcee-ai/trinity-large-thinking` on OpenRouter | Likely family match; not the same exact model name and not in OpenCode inventory. Paid OpenRouter-derived blended price is approximately `0.3775` USD per 1M tokens. |

## Pricing Method Notes

- ORPT-Bench keeps `blendedPricePer1mTokensUsd` for the primary listed benchmark price used in ranking views.
- When a free model has a useful external paid analogue, ORPT-Bench can also store `referenceBlendedPricePer1mTokensUsd`.
- Reference pricing is always labeled in the catalog and is not treated as the actual billed price for the free model.
- Current OpenRouter-derived reference prices use a simple 3:1 input:output blend from the listed prompt/completion token rates.
- Example formula: `(3 * prompt_price + completion_price) / 4 * 1_000_000`.
- If no trustworthy sibling or family reference is available, the reference price remains unknown.
