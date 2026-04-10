import test from 'node:test'
import assert from 'node:assert/strict'

import { aggregateRun, collectRemainingTaskEntries, computeCompositeScore, computeCompositeValueScore, computeOpenCodeZenCostUsd, isProviderLimitedFailure, runContainsSyntheticTimeoutRows, shouldWriteLatestRunArtifact, summarizeFailureOutcome } from '../scripts/lib/benchmark.js'
import { permissionRules } from '../scripts/lib/opencode.js'

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

test('computeOpenCodeZenCostUsd bills recorded prompt-side tokens at input rate and completion-side tokens at output rate', () => {
  const cost = computeOpenCodeZenCostUsd('opencode/claude-sonnet-4-6', {
    input: 1000,
    output: 200,
    reasoning: 50,
    cache: { read: 5000, write: 1000 }
  })

  assert.equal(cost, 0.02475)
})

test('computeOpenCodeZenCostUsd returns null for unknown model pricing', () => {
  assert.equal(computeOpenCodeZenCostUsd('opencode/unknown-model', { input: 1, output: 1, reasoning: 0, cache: { read: 0, write: 0 } }), null)
})

test('computeOpenCodeZenCostUsd remains available as fallback when exact session export cost is missing', () => {
  const cost = computeOpenCodeZenCostUsd('opencode/gpt-5.4-mini', {
    input: 1000,
    output: 100,
    reasoning: 0,
    cache: { read: 500, write: 0 }
  })

  assert.equal(cost, 0.001575)
})

test('computeOpenCodeZenCostUsd clamps signed token deltas when reconstructing cost', () => {
  const cost = computeOpenCodeZenCostUsd('opencode/glm-5', {
    input: -10569,
    output: 207,
    reasoning: 0,
    cache: { read: 22048, write: 0 }
  })

  assert.equal(cost, 0.0227104)
})

test('aggregateRun preserves exact exported session costs in summaries', () => {
  const run = {
    results: [
      {
        taskId: 'task-1',
        taskName: 'Task 1',
        category: 'scripting',
        model: 'opencode/gpt-5.4-mini',
        provider: 'opencode',
        success: true,
        score: 1,
        durationMs: 1000,
        requestUnits: 5,
        requestAccountingSource: 'proxy-call-count',
        costUsd: 0.0314238,
        costAccountingSource: 'session-export-cost',
        steps: 8,
        tokens: { input: 100, output: 50, reasoning: 10, cache: { read: 500, write: 0 } }
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

  assert.equal(run.modelSummary[0].totalCostUsd, 0.0314238)
  assert.equal(run.taskSummary[0].totalCostUsd, 0.0314238)
})

test('aggregateRun preserves DB-backed session costs in summaries', () => {
  const run = {
    results: [
      {
        taskId: 'task-1',
        taskName: 'Task 1',
        category: 'scripting',
        model: 'opencode/gpt-5.4-nano',
        provider: 'opencode',
        success: true,
        score: 1,
        durationMs: 1000,
        requestUnits: 16,
        requestAccountingSource: 'proxy-call-count',
        costUsd: 0.0151336,
        costAccountingSource: 'session-db-cost',
        steps: 17,
        tokens: { input: 21498, output: 2686, reasoning: 2818, cache: { read: 208640, write: 0 } }
      }
    ],
    modelCatalog: {
      models: [
        {
          model: 'opencode/gpt-5.4-nano',
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

  assert.equal(run.modelSummary[0].totalCostUsd, 0.0151336)
  assert.equal(run.taskSummary[0].totalCostUsd, 0.0151336)
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

test('isProviderLimitedFailure only marks concrete rate-limit failures as provider-limited', () => {
  assert.equal(isProviderLimitedFailure({
    verifier: { stderr: 'OpenCode API request failed with 429' },
    error: null,
    proxyRecords: []
  }), true)

  assert.equal(isProviderLimitedFailure({
    verifier: { stderr: 'AI_APICallError: model: claude-3-5-haiku-20241022' },
    error: null,
    proxyRecords: [{ status: 400 }]
  }), false)

  assert.equal(isProviderLimitedFailure({
    verifier: { stderr: '' },
    error: { message: 'stream error: too_many_requests' },
    proxyRecords: []
  }), true)
})

test('summarizeFailureOutcome classifies provider model not found and provider http failures', () => {
  assert.deepEqual(summarizeFailureOutcome({
    verifier: { stderr: '', stdout: '' },
    error: { message: 'ProviderModelNotFoundError' },
    proxyRecords: [],
    logExcerpt: ['ERROR ProviderModelNotFoundError {"suggestions":["gemini-3.1-pro"]}']
  }), {
    outcomeLabel: 'provider-model-not-found',
    proxyStatus: null,
    suggestedModel: 'gemini-3.1-pro'
  })

  assert.deepEqual(summarizeFailureOutcome({
    verifier: { stderr: 'AI_APICallError: model: claude-3-5-haiku-20241022', stdout: '' },
    error: { message: 'AI_APICallError: model: claude-3-5-haiku-20241022' },
    proxyRecords: [{ status: 400 }],
    logExcerpt: []
  }), {
    outcomeLabel: 'provider-http-error',
    proxyStatus: 400,
    suggestedModel: null
  })
})

test('shouldWriteLatestRunArtifact allows smoke synthetic rows but blocks canonical full-run synthetic rows', () => {
  assert.equal(shouldWriteLatestRunArtifact({
    run: { benchmarkCycle: 'candidate_smoke' },
    results: [{ requestAccountingSource: 'synthetic-timeout', dnfReason: 'process-timeout' }]
  }), true)

  assert.equal(shouldWriteLatestRunArtifact({
    run: { benchmarkCycle: 'weekly' },
    results: [{ requestAccountingSource: 'synthetic-timeout', dnfReason: 'process-timeout' }]
  }), false)
})

test('benchmark opencode permissions keep sandbox allowed after fallback deny', () => {
  const rules = permissionRules({ sandboxDir: '/tmp/orpt-bench-sandbox' })
  const entries = Object.entries(rules.external_directory)

  assert.deepEqual(entries, [
    ['*', 'deny'],
    ['/root/.local/share/opencode/tool-output/**', 'allow'],
    ['/tmp/orpt-bench-sandbox/**', 'allow']
  ])
})

test('child run artifacts are namespaced by parent run id', async () => {
  const path = await import('node:path')
  const runID = '2026-04-08T20-55-31-047Z'
  const outputFile = path.join('/tmp/orpt-bench', 'child-runs', runID, 'opencode-glm-5-1.json')
  assert.equal(outputFile, '/tmp/orpt-bench/child-runs/2026-04-08T20-55-31-047Z/opencode-glm-5-1.json')
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
    assert.equal(runtime.taskBudgetCatalog[0].timeoutSeconds, 75)
    assert.equal(runtime.derivedRunTimeoutSeconds, 85)
    assert.equal(runtime.processTimeoutSeconds, 85)
    assert.equal(runtime.taskTimeoutSeconds, 75)
  } finally {
    if (previousTaskGlob == null) delete process.env.BENCHMARK_TASK_GLOB
    else process.env.BENCHMARK_TASK_GLOB = previousTaskGlob
    if (previousProcessTimeout == null) delete process.env.BENCHMARK_PROCESS_TIMEOUT_SECONDS
    else process.env.BENCHMARK_PROCESS_TIMEOUT_SECONDS = previousProcessTimeout
    if (previousRepeats == null) delete process.env.BENCHMARK_REPEATS
    else process.env.BENCHMARK_REPEATS = previousRepeats
  }
})

test('runtime config preserves requested task pattern order for control smoke ramp', async () => {
  const { loadRuntimeConfig } = await import('../scripts/lib/config.js')
  const previousTaskGlob = process.env.BENCHMARK_TASK_GLOB

    process.env.BENCHMARK_TASK_GLOB = '16-event-status-shell,17-log-level-rollup,05*'

  try {
    const runtime = await loadRuntimeConfig()
    assert.deepEqual(runtime.taskBudgetCatalog.map((task) => task.id), [
      '16-event-status-shell',
      '17-log-level-rollup',
      '05-log-audit-script'
    ])
    assert.deepEqual(runtime.taskBudgetCatalog.map((task) => task.timeoutSeconds), [45, 60, 75])
    assert.equal(runtime.derivedRunTimeoutSeconds, 210)
  } finally {
    if (previousTaskGlob == null) delete process.env.BENCHMARK_TASK_GLOB
    else process.env.BENCHMARK_TASK_GLOB = previousTaskGlob
  }
})

test('runtime config falls back to .env.benchmark when shell env is unset', async () => {
  const fs = await import('node:fs/promises')
  const path = await import('node:path')
  const previousModels = process.env.BENCHMARK_MODELS
  const previousTaskGlob = process.env.BENCHMARK_TASK_GLOB
  const envPath = path.join(process.cwd(), '.env.benchmark')
  const originalEnvFile = await fs.readFile(envPath, 'utf8')

  delete process.env.BENCHMARK_MODELS
  delete process.env.BENCHMARK_TASK_GLOB

  try {
    await fs.writeFile(envPath, [
      'BENCHMARK_MODELS=opencode/gpt-5.4-mini',
      'BENCHMARK_TASK_GLOB=05*',
      'BENCHMARK_REPEATS=1',
      'BENCHMARK_PROCESS_TIMEOUT_SECONDS=0'
    ].join('\n') + '\n', 'utf8')

    const { loadRuntimeConfig } = await import('../scripts/lib/config.js')
    const runtime = await loadRuntimeConfig()
    assert.deepEqual(runtime.models, ['opencode/gpt-5.4-mini'])
    assert.deepEqual(runtime.taskBudgetCatalog.map((task) => task.id), ['05-log-audit-script'])
  } finally {
    await fs.writeFile(envPath, originalEnvFile, 'utf8')
    if (previousModels == null) delete process.env.BENCHMARK_MODELS
    else process.env.BENCHMARK_MODELS = previousModels
    if (previousTaskGlob == null) delete process.env.BENCHMARK_TASK_GLOB
    else process.env.BENCHMARK_TASK_GLOB = previousTaskGlob
  }
})

test('benchmark command refuses to run outside containerized runner environment', async () => {
  const previousExpectedRunner = process.env.ORPT_EXPECTED_RUNNER
  const previousTaskGlob = process.env.BENCHMARK_TASK_GLOB

  delete process.env.ORPT_EXPECTED_RUNNER
  process.env.BENCHMARK_TASK_GLOB = '*'

  try {
    const runtime = await (await import('../scripts/lib/config.js')).loadRuntimeConfig()
    const { ensureExpectedRunnerEnvironment } = await import('../scripts/cli.js')
    assert.throws(
      () => ensureExpectedRunnerEnvironment('benchmark', runtime),
      /Refusing benchmark execution outside the expected container runner environment/
    )
  } finally {
    if (previousExpectedRunner == null) delete process.env.ORPT_EXPECTED_RUNNER
    else process.env.ORPT_EXPECTED_RUNNER = previousExpectedRunner
    if (previousTaskGlob == null) delete process.env.BENCHMARK_TASK_GLOB
    else process.env.BENCHMARK_TASK_GLOB = previousTaskGlob
  }
})
