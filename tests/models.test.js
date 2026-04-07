import test from 'node:test'
import assert from 'node:assert/strict'

import {
  applyDenylist,
  applyManualBenchmarkEnrichment,
  applyOpenRouterPricingEnrichment,
  buildMatrices,
  buildOpenRouterIndex,
  mapOpenCodeModelToOpenRouterCandidates,
  pickOpenRouterPricing
} from '../scripts/lib/models.js'

test('free model matching finds same-family paid sibling reference', () => {
  const index = buildOpenRouterIndex([
    { id: 'arcee-ai/trinity-large-preview:free', pricing: { prompt: '0', completion: '0' } },
    { id: 'arcee-ai/trinity-large-thinking', pricing: { prompt: '0.00000027', completion: '0.00000070' } },
    { id: 'arcee-ai/trinity-mini', pricing: { prompt: '0.00000005', completion: '0.00000012' } }
  ])

  const candidates = mapOpenCodeModelToOpenRouterCandidates('trinity-large-preview-free', index)
  const pricing = pickOpenRouterPricing(candidates, 'trinity-large-preview-free')

  assert.equal(pricing.primary?.id, 'arcee-ai/trinity-large-preview:free')
  assert.equal(pricing.reference?.id, 'arcee-ai/trinity-large-thinking')
})

test('matrix cadence keeps expensive models out of cheap and in frontier/release', () => {
  const catalog = {
    models: [
      {
        model: 'opencode/gpt-5.4-mini',
        devTier: 'dev-cheap',
        stability: { headlessFriendly: true },
        featureSupport: { unattendedBenchmarkRuns: 'supported' },
        benchmark: { intelligenceScore: null, agenticScore: null, speedTokensPerSecond: null, blendedPricePer1mTokensUsd: 1.68 }
      },
      {
        model: 'opencode/gpt-5.4',
        devTier: 'standard',
        stability: { headlessFriendly: null },
        featureSupport: { unattendedBenchmarkRuns: 'supported' },
        benchmark: { intelligenceScore: 57, agenticScore: null, speedTokensPerSecond: 74, blendedPricePer1mTokensUsd: 5.6 }
      },
      {
        model: 'opencode/claude-opus-4-6',
        devTier: 'expensive',
        stability: { headlessFriendly: null },
        featureSupport: { unattendedBenchmarkRuns: 'supported' },
        benchmark: { intelligenceScore: 53, agenticScore: null, speedTokensPerSecond: 49, blendedPricePer1mTokensUsd: 10 }
      }
    ]
  }

  const matrices = buildMatrices(catalog, { taskIds: ['05-log-audit-script'], requiredCapabilities: ['unattendedBenchmarkRuns'] })

  assert.deepEqual(matrices.matrices.cheap.models, ['opencode/gpt-5.4-mini'])
  assert.ok(matrices.matrices.frontier.models.includes('opencode/gpt-5.4'))
  assert.ok(matrices.matrices.frontier.models.includes('opencode/claude-opus-4-6'))
  assert.ok(matrices.matrices.release.models.includes('opencode/gpt-5.4'))
  assert.ok(matrices.matrices.release.models.includes('opencode/claude-opus-4-6'))
})

test('automatic free pricing sets reference semantics clearly', () => {
  const index = buildOpenRouterIndex([
    { id: 'minimax/minimax-m2.5:free', pricing: { prompt: '0', completion: '0' } },
    { id: 'minimax/minimax-m2.5', pricing: { prompt: '0.000000112', completion: '0.00000056' } }
  ])

  const baseModel = applyManualBenchmarkEnrichment({ modelId: 'minimax-m2.5-free', benchmark: {} }, null)
  const enriched = applyOpenRouterPricingEnrichment(baseModel, index)

  assert.equal(enriched.benchmark.blendedPricePer1mTokensUsd, 0)
  assert.equal(enriched.benchmark.referenceBlendedPricePer1mTokensUsd, 0.224)
  assert.equal(enriched.benchmark.pricingSourceType, 'automatic-openrouter-primary')
  assert.equal(enriched.benchmark.pricingConfidence, 'medium')
  assert.match(enriched.benchmark.pricingNotes, /Reference price uses minimax\/minimax-m2\.5/)
})

test('manual primary pricing keeps manual-primary-with-openrouter-reference semantics', () => {
  const index = buildOpenRouterIndex([
    { id: 'openai/gpt-5.4', pricing: { prompt: '0.00000375', completion: '0.00001125' } }
  ])

  const baseModel = applyManualBenchmarkEnrichment({ modelId: 'gpt-5.4', benchmark: {} }, {
    benchmark: {
      intelligenceScore: 57,
      speedTokensPerSecond: 74,
      blendedPricePer1mTokensUsd: 5.6,
      source: 'artificial-analysis',
      sourceUrl: 'https://artificialanalysis.ai/models/gpt-5-4',
      confidence: 'manual'
    }
  })
  const enriched = applyOpenRouterPricingEnrichment(baseModel, index)

  assert.equal(enriched.benchmark.blendedPricePer1mTokensUsd, 5.6)
  assert.equal(enriched.benchmark.pricingSourceType, 'manual-primary-with-openrouter-reference')
  assert.equal(enriched.benchmark.pricingConfidence, 'high')
  assert.match(enriched.benchmark.pricingNotes, /OpenRouter reference blend for openai\/gpt-5\.4 is 5\.625/)
})

test('denylist excludes models from generated matrices without removing catalog entries', () => {
  const catalog = {
    models: applyDenylist([
      {
        model: 'opencode/gpt-5.4-pro',
        devTier: 'expensive',
        stability: { headlessFriendly: null },
        featureSupport: { unattendedBenchmarkRuns: 'supported' },
        benchmark: { intelligenceScore: 60, agenticScore: null, speedTokensPerSecond: 50, blendedPricePer1mTokensUsd: 67.5 }
      },
      {
        model: 'opencode/gpt-5.4',
        devTier: 'standard',
        stability: { headlessFriendly: null },
        featureSupport: { unattendedBenchmarkRuns: 'supported' },
        benchmark: { intelligenceScore: 57, agenticScore: null, speedTokensPerSecond: 74, blendedPricePer1mTokensUsd: 5.6 }
      }
    ], {
      models: [{ id: 'opencode/gpt-5.4-pro', reason: 'too expensive' }]
    })
  }

  const matrices = buildMatrices(catalog, { taskIds: ['05-log-audit-script'], requiredCapabilities: ['unattendedBenchmarkRuns'] })

  assert.equal(catalog.models.find((model) => model.model === 'opencode/gpt-5.4-pro')?.excludedFromMatrices, true)
  assert.ok(!matrices.matrices.frontier.models.includes('opencode/gpt-5.4-pro'))
  assert.ok(matrices.matrices.frontier.models.includes('opencode/gpt-5.4'))
})
