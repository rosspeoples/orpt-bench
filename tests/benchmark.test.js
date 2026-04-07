import test from 'node:test'
import assert from 'node:assert/strict'

import { computeCompositeScore, computeCompositeValueScore } from '../scripts/lib/benchmark.js'

test('computeCompositeValueScore returns 1 for task-best comparable run', () => {
  const score = computeCompositeValueScore({
    requestUnits: 10,
    costUsd: 0.5,
    durationMs: 1000,
    baseline: {
      bestRequestUnits: 10,
      bestDurationMs: 1000,
      bestCostUsd: 0.5,
      bestPositiveCostUsd: 0.5
    }
  })

  assert.equal(score.valueScore, 1)
  assert.deepEqual(score.components, { orptFactor: 1, costFactor: 1, timeFactor: 1 })
})

test('computeCompositeValueScore penalizes worse ORPT cost and time', () => {
  const score = computeCompositeValueScore({
    requestUnits: 20,
    costUsd: 1,
    durationMs: 2000,
    baseline: {
      bestRequestUnits: 10,
      bestDurationMs: 1000,
      bestCostUsd: 0.5,
      bestPositiveCostUsd: 0.5
    }
  })

  assert.ok(score.valueScore > 0)
  assert.ok(score.valueScore < 1)
  assert.ok(score.components.orptFactor < 1)
  assert.ok(score.components.costFactor < 1)
  assert.ok(score.components.timeFactor < 1)
})

test('computeCompositeValueScore handles zero-cost baseline with paid comparison', () => {
  const score = computeCompositeValueScore({
    requestUnits: 20,
    costUsd: 0.5,
    durationMs: 2000,
    baseline: {
      bestRequestUnits: 10,
      bestDurationMs: 1000,
      bestCostUsd: 0,
      bestPositiveCostUsd: 0.25
    }
  })

  assert.ok(score.valueScore > 0)
  assert.ok(score.valueScore < 1)
  assert.equal(score.components.orptFactor, 0.5)
})

test('computeCompositeScore keeps correctness dominant', () => {
  assert.equal(computeCompositeScore(1, 1), 1)
  assert.equal(computeCompositeScore(0, 0), 0)
  assert.equal(computeCompositeScore(1, 0.5), 0.85)
  assert.equal(computeCompositeScore(0, 1), 0.3)
})
