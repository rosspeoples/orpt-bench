import test from 'node:test'
import assert from 'node:assert/strict'

import { aggregateRun, collectRemainingTaskEntries, computeCompositeScore, computeCompositeValueScore, runContainsSyntheticTimeoutRows } from '../scripts/lib/benchmark.js'

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

test('collectRemainingTaskEntries includes current and subsequent tasks across repeats', () => {
  const tasks = [
    { id: '01' },
    { id: '02' },
    { id: '03' }
  ]

  const remaining = collectRemainingTaskEntries(tasks, 2, 1, 1)
  assert.deepEqual(remaining, [
    { task: tasks[1], repeat: 1 },
    { task: tasks[2], repeat: 1 },
    { task: tasks[0], repeat: 2 },
    { task: tasks[1], repeat: 2 },
    { task: tasks[2], repeat: 2 }
  ])
})

test('aggregateRun keeps failed runs comparable when capability support is present', () => {
  const run = {
    results: [
      {
        taskId: 'task-1',
        taskName: 'Task 1',
        category: 'scripting',
        model: 'opencode/gpt-5.4-mini',
        provider: 'opencode',
        success: false,
        score: 0,
        durationMs: 1000,
        requestUnits: 5,
        requestAccountingSource: 'proxy-call-count',
        costUsd: 0.1,
        steps: 1,
        tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } }
      }
    ],
    modelCatalog: {
      models: [
        {
          model: 'opencode/gpt-5.4-mini',
          featureSupport: {
            unattendedBenchmarkRuns: 'supported'
          }
        }
      ]
    },
    taskCatalog: [
      {
        id: 'task-1',
        name: 'Task 1',
        requiredCapabilities: ['unattendedBenchmarkRuns']
      }
    ],
    scoring: {
      valueScoreWeights: { orpt: 0.45, cost: 0.35, time: 0.2 },
      compositeScoreWeights: { score: 0.7, valueScore: 0.3 }
    }
  }

  aggregateRun(run, { headerCandidates: [], logRegexes: [] })

  assert.equal(run.modelSummary[0].comparable, true)
  assert.equal(run.taskSummary[0].comparable, true)
  assert.equal(run.results[0].valueScore, 0)
})

test('aggregateRun preserves task difficulty metadata in task catalog inputs', () => {
  const run = {
    results: [],
    modelCatalog: { models: [] },
    taskCatalog: [
      { id: 'task-control', name: 'Control', difficulty: 'control', requiredCapabilities: [] },
      { id: 'task-high', name: 'High', difficulty: 'high', requiredCapabilities: ['unattendedBenchmarkRuns'] }
    ],
    scoring: {
      valueScoreWeights: { orpt: 0.45, cost: 0.35, time: 0.2 },
      compositeScoreWeights: { score: 0.7, valueScore: 0.3 }
    }
  }

  aggregateRun(run, { headerCandidates: [], logRegexes: [] })

  assert.equal(run.taskCatalog[0].difficulty, 'control')
  assert.equal(run.taskCatalog[1].difficulty, 'high')
})

test('aggregateRun counts DNF task results in summaries', () => {
  const run = {
    results: [
      {
        taskId: 'task-1',
        taskName: 'Task 1',
        category: 'scripting',
        model: 'opencode/gpt-5.4-mini',
        provider: 'opencode',
        success: false,
        score: 0,
        durationMs: 5000,
        requestUnits: 12,
        requestAccountingSource: 'proxy-call-count',
        costUsd: 0.2,
        steps: 3,
        dnf: true,
        dnfReason: 'task-timeout',
        tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } }
      }
    ],
    modelCatalog: { models: [{ model: 'opencode/gpt-5.4-mini', featureSupport: { unattendedBenchmarkRuns: 'supported' } }] },
    taskCatalog: [{ id: 'task-1', name: 'Task 1', requiredCapabilities: ['unattendedBenchmarkRuns'] }],
    scoring: {
      valueScoreWeights: { orpt: 0.45, cost: 0.35, time: 0.2 },
      compositeScoreWeights: { score: 0.7, valueScore: 0.3 }
    }
  }

  aggregateRun(run, { headerCandidates: [], logRegexes: [] })

  assert.equal(run.modelSummary[0].dnfTasks, 1)
  assert.equal(run.taskSummary[0].dnfs, 1)
})

test('runContainsSyntheticTimeoutRows detects synthetic timeout artifacts', () => {
  const run = {
    results: [
      { taskId: 'task-1', model: 'opencode/gpt-5.4-mini', requestAccountingSource: 'proxy-call-count' },
      { taskId: 'task-2', model: 'opencode/gpt-5.4-mini', requestAccountingSource: 'synthetic-timeout', dnfReason: 'process-timeout' }
    ]
  }

  assert.equal(runContainsSyntheticTimeoutRows(run), true)
  assert.equal(runContainsSyntheticTimeoutRows({ results: [{ requestAccountingSource: 'proxy-call-count' }] }), false)
})

test('runtime config defaults model concurrency to one when unset', async () => {
  const { loadRuntimeConfig } = await import('../scripts/lib/config.js')
  const previous = process.env.BENCHMARK_MODEL_CONCURRENCY
  delete process.env.BENCHMARK_MODEL_CONCURRENCY

  try {
    const runtime = await loadRuntimeConfig()
    assert.equal(runtime.modelConcurrency, 1)
  } finally {
    if (previous == null) delete process.env.BENCHMARK_MODEL_CONCURRENCY
    else process.env.BENCHMARK_MODEL_CONCURRENCY = previous
  }
})

test('runtime config derives process timeout from selected task budgets', async () => {
  const { loadRuntimeConfig } = await import('../scripts/lib/config.js')
  const previousTaskGlob = process.env.BENCHMARK_TASK_GLOB
  const previousProcessTimeout = process.env.BENCHMARK_PROCESS_TIMEOUT_SECONDS
  const previousRepeats = process.env.BENCHMARK_REPEATS

  process.env.BENCHMARK_TASK_GLOB = '05*'
  process.env.BENCHMARK_REPEATS = '1'
  process.env.BENCHMARK_PROCESS_TIMEOUT_SECONDS = '999'

  try {
    const runtime = await loadRuntimeConfig()
    assert.equal(runtime.taskBudgetCatalog.length, 1)
    assert.equal(runtime.taskBudgetCatalog[0].id, '05-log-audit-script')
    assert.equal(runtime.taskBudgetCatalog[0].timeoutSeconds, 60)
    assert.equal(runtime.derivedRunTimeoutSeconds, 61)
    assert.equal(runtime.processTimeoutSeconds, 61)
    assert.equal(runtime.taskTimeoutSeconds, 60)
  } finally {
    if (previousTaskGlob == null) delete process.env.BENCHMARK_TASK_GLOB
    else process.env.BENCHMARK_TASK_GLOB = previousTaskGlob
    if (previousProcessTimeout == null) delete process.env.BENCHMARK_PROCESS_TIMEOUT_SECONDS
    else process.env.BENCHMARK_PROCESS_TIMEOUT_SECONDS = previousProcessTimeout
    if (previousRepeats == null) delete process.env.BENCHMARK_REPEATS
    else process.env.BENCHMARK_REPEATS = previousRepeats
  }
})
