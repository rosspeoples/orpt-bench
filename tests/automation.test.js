import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { buildAutomationPlan, buildLifecycleCatalog, buildLifecycleIssuePlan, buildLifecycleTransitions, DEFAULT_MODEL_POLICY, syncAutomationArtifacts } from '../scripts/lib/automation.js'
import { writeJson } from '../scripts/lib/fs.js'

test('lifecycle catalog marks unseen inventory models as candidates', () => {
  const lifecycle = buildLifecycleCatalog({
    catalog: {
      models: [
        {
          model: 'opencode/gpt-5.5-mini',
          modelId: 'gpt-5.5-mini',
          family: 'openai',
          created: 1776000000,
          recommendedUse: 'dev-general',
          benchmark: { intelligenceScore: null }
        }
      ]
    },
    previousLifecycle: { models: [] },
    benchmarkHistory: [],
    policy: DEFAULT_MODEL_POLICY,
    now: '2026-04-07T00:00:00.000Z'
  })

  assert.equal(lifecycle.models[0].lifecycleStage, 'candidate')
  assert.match(lifecycle.models[0].lifecycleReason, /awaiting initial smoke benchmarking/i)
})

test('lifecycle catalog deprecates superseded available model after successor appears', () => {
  const lifecycle = buildLifecycleCatalog({
    catalog: {
      models: [
        {
          model: 'opencode/claude-sonnet-4-5',
          modelId: 'claude-sonnet-4-5',
          family: 'anthropic',
          created: 1775000000,
          recommendedUse: 'standard',
          benchmark: { intelligenceScore: null }
        },
        {
          model: 'opencode/claude-sonnet-4-6',
          modelId: 'claude-sonnet-4-6',
          family: 'anthropic',
          created: 1775532308,
          recommendedUse: 'release-frontier',
          benchmark: { intelligenceScore: 52 }
        }
      ]
    },
    previousLifecycle: { models: [] },
    benchmarkHistory: [
      {
        run: { id: 'run-1', completedAt: '2026-04-01T00:00:00.000Z' },
        modelSummary: [
          { model: 'opencode/claude-sonnet-4-5', runs: 9, successfulTasks: 7, comparable: true }
        ]
      }
    ],
    policy: DEFAULT_MODEL_POLICY,
    now: '2026-04-07T00:00:00.000Z'
  })

  const deprecated = lifecycle.models.find((model) => model.model === 'opencode/claude-sonnet-4-5')
  assert.equal(deprecated.lifecycleStage, 'deprecated')
  assert.equal(deprecated.successorModel, 'opencode/claude-sonnet-4-6')
})

test('lifecycle catalog sunsets model missing beyond grace period', () => {
  const lifecycle = buildLifecycleCatalog({
    catalog: { models: [] },
    previousLifecycle: {
      models: [
        {
          model: 'opencode/gpt-4.9',
          modelId: 'gpt-4.9',
          family: 'openai',
          firstSeenAt: '2026-01-01T00:00:00.000Z',
          firstMissingAt: '2026-02-01T00:00:00.000Z',
          lastSeenInInventoryAt: '2026-01-31T00:00:00.000Z',
          recommendedUse: 'standard'
        }
      ]
    },
    benchmarkHistory: [],
    policy: DEFAULT_MODEL_POLICY,
    now: '2026-04-07T00:00:00.000Z'
  })

  assert.equal(lifecycle.models[0].lifecycleStage, 'sunset')
})

test('automation plan schedules candidate smoke and recurring cycles', () => {
  const lifecycle = {
    updatedAt: '2026-04-07T00:00:00.000Z',
    summary: { active: 1, candidate: 1, deprecated: 0, sunset: 0 },
    models: [
      {
        model: 'opencode/grok-4.20',
        lifecycleStage: 'candidate',
        recommendedUse: 'balanced-general'
      },
      {
        model: 'opencode/gpt-5.4-mini',
        lifecycleStage: 'active',
        recommendedUse: 'dev-general'
      }
    ]
  }

  const plan = buildAutomationPlan({
    catalog: {
      models: [
        {
          model: 'opencode/grok-4.20',
          created: 1776000000,
          excludedFromMatrices: false,
          recommendedUse: 'balanced-general',
          benchmark: { intelligenceScore: 54, blendedPricePer1mTokensUsd: 3 }
        }
      ]
    },
    matrices: {
      matrices: {
        current_task_cheap_comparable: { models: ['opencode/gpt-5.4-mini'] },
        release: { models: ['opencode/gpt-5.4', 'opencode/claude-sonnet-4-6'] }
      }
    },
    lifecycle,
    policy: DEFAULT_MODEL_POLICY,
    now: '2026-04-07T00:00:00.000Z'
  })

  assert.deepEqual(plan.cycles.candidate_smoke.models, ['opencode/grok-4.20'])
  assert.equal(plan.cycles.weekly.matrix, 'current_task_cheap_comparable')
  assert.equal(plan.cycles.monthly.matrix, 'release')
})

test('candidate model becomes active after a passing smoke benchmark', () => {
  const lifecycle = buildLifecycleCatalog({
    catalog: {
      models: [
        {
          model: 'opencode/grok-4.20',
          modelId: 'grok-4.20',
          family: 'x-ai',
          created: 1776000000,
          recommendedUse: 'balanced-general',
          benchmark: { intelligenceScore: 54 }
        }
      ]
    },
    previousLifecycle: { models: [] },
    benchmarkHistory: [
      {
        run: {
          id: 'smoke-run-1',
          benchmarkCycle: 'candidate_smoke',
          completedAt: '2026-04-07T01:00:00.000Z'
        },
        taskCatalog: [{ id: '05-log-audit-script' }],
        modelSummary: [
          { model: 'opencode/grok-4.20', runs: 1, successfulTasks: 1, comparable: true }
        ]
      },
      {
        run: {
          id: 'smoke-run-2',
          benchmarkCycle: 'candidate_smoke',
          completedAt: '2026-04-07T01:30:00.000Z'
        },
        taskCatalog: [{ id: '05-log-audit-script' }],
        modelSummary: [
          { model: 'opencode/grok-4.20', runs: 1, successfulTasks: 1, comparable: true }
        ]
      }
    ],
    policy: DEFAULT_MODEL_POLICY,
    now: '2026-04-07T02:00:00.000Z'
  })

  assert.equal(lifecycle.models[0].lifecycleStage, 'active')
  assert.equal(lifecycle.models[0].successfulSmokeBenchmarkSessions, 2)
})

test('candidate model remains candidate until required smoke passes are met', () => {
  const lifecycle = buildLifecycleCatalog({
    catalog: {
      models: [
        {
          model: 'opencode/grok-4.20',
          modelId: 'grok-4.20',
          family: 'x-ai',
          created: 1776000000,
          recommendedUse: 'balanced-general',
          benchmark: { intelligenceScore: 54 }
        }
      ]
    },
    previousLifecycle: { models: [] },
    benchmarkHistory: [
      {
        run: {
          id: 'smoke-run-1',
          benchmarkCycle: 'candidate_smoke',
          completedAt: '2026-04-08T01:00:00.000Z'
        },
        taskCatalog: [{ id: '05-log-audit-script' }],
        modelSummary: [
          { model: 'opencode/grok-4.20', runs: 1, successfulTasks: 1, comparable: true }
        ]
      }
    ],
    policy: DEFAULT_MODEL_POLICY,
    now: '2026-04-08T02:00:00.000Z'
  })

  assert.equal(lifecycle.models[0].lifecycleStage, 'candidate')
  assert.match(lifecycle.models[0].lifecycleReason, /2-run smoke promotion requirement/i)
})

test('previously active model stays active during stricter smoke rollout', () => {
  const lifecycle = buildLifecycleCatalog({
    catalog: {
      models: [
        {
          model: 'opencode/gpt-5.4-mini',
          modelId: 'gpt-5.4-mini',
          family: 'openai',
          created: 1775532308,
          recommendedUse: 'dev-general',
          benchmark: { intelligenceScore: null }
        }
      ]
    },
    previousLifecycle: {
      models: [
        {
          model: 'opencode/gpt-5.4-mini',
          lifecycleStage: 'active'
        }
      ]
    },
    benchmarkHistory: [
      {
        run: { id: 'run-1', completedAt: '2026-04-07T00:00:00.000Z' },
        modelSummary: [
          { model: 'opencode/gpt-5.4-mini', runs: 9, successfulTasks: 7, comparable: true }
        ]
      }
    ],
    policy: DEFAULT_MODEL_POLICY,
    now: '2026-04-07T02:00:00.000Z'
  })

  assert.equal(lifecycle.models[0].lifecycleStage, 'active')
  assert.match(lifecycle.models[0].lifecycleReason, /retained during stricter smoke-promotion rollout/i)
})

test('pre-rollout comparable successful model bootstraps to active without smoke history', () => {
  const lifecycle = buildLifecycleCatalog({
    catalog: {
      models: [
        {
          model: 'opencode/gpt-5.4',
          modelId: 'gpt-5.4',
          family: 'openai',
          created: 1775532308,
          recommendedUse: 'release-frontier',
          benchmark: { intelligenceScore: 57 }
        }
      ]
    },
    previousLifecycle: { models: [] },
    benchmarkHistory: [
      {
        run: { id: 'run-1', completedAt: '2026-04-06T22:32:45.565Z' },
        modelSummary: [
          { model: 'opencode/gpt-5.4', runs: 5, successfulTasks: 1, comparable: true }
        ]
      }
    ],
    policy: DEFAULT_MODEL_POLICY,
    now: '2026-04-07T18:00:00.000Z'
  })

  assert.equal(lifecycle.models[0].lifecycleStage, 'active')
  assert.match(lifecycle.models[0].lifecycleReason, /bootstrapped this model into active status/i)
})

test('post-rollout comparable successful model still requires smoke promotion', () => {
  const lifecycle = buildLifecycleCatalog({
    catalog: {
      models: [
        {
          model: 'opencode/gpt-5.5',
          modelId: 'gpt-5.5',
          family: 'openai',
          created: 1777000000,
          recommendedUse: 'release-frontier',
          benchmark: { intelligenceScore: 58 }
        }
      ]
    },
    previousLifecycle: { models: [] },
    benchmarkHistory: [
      {
        run: { id: 'run-2', completedAt: '2026-04-08T00:00:00.000Z' },
        modelSummary: [
          { model: 'opencode/gpt-5.5', runs: 5, successfulTasks: 2, comparable: true }
        ]
      }
    ],
    policy: DEFAULT_MODEL_POLICY,
    now: '2026-04-08T01:00:00.000Z'
  })

  assert.equal(lifecycle.models[0].lifecycleStage, 'candidate')
  assert.match(lifecycle.models[0].lifecycleReason, /smoke promotion requirement/i)
})

test('lifecycle transitions capture newly discovered and deprecated models', () => {
  const transitions = buildLifecycleTransitions({
    previousLifecycle: {
      models: [
        {
          model: 'opencode/claude-sonnet-4-5',
          lifecycleStage: 'active',
          inventoryStatus: 'available'
        }
      ]
    },
    lifecycle: {
      models: [
        {
          model: 'opencode/claude-sonnet-4-5',
          lifecycleStage: 'deprecated',
          inventoryStatus: 'available',
          lifecycleReason: 'Superseded by opencode/claude-sonnet-4-6.'
        },
        {
          model: 'opencode/grok-4.20',
          lifecycleStage: 'candidate',
          inventoryStatus: 'available',
          lifecycleReason: 'Discovered in the current inventory and awaiting initial smoke benchmarking.'
        }
      ]
    },
    previousPlan: {
      cycles: {
        candidate_smoke: {
          models: []
        }
      }
    },
    plan: {
      cycles: {
        candidate_smoke: {
          models: ['opencode/grok-4.20']
        }
      }
    },
    now: '2026-04-07T02:00:00.000Z'
  })

  assert.equal(transitions.summary.discovered, 1)
  assert.equal(transitions.summary.stageChanges, 1)
  assert.deepEqual(transitions.smokeQueueChanges.added, ['opencode/grok-4.20'])
})

test('lifecycle issue plan emits deprecated and sunset issues', () => {
  const issues = buildLifecycleIssuePlan({
    transitions: {
      stageChanges: [
        {
          model: 'opencode/claude-sonnet-4-5',
          from: 'active',
          to: 'deprecated',
          reason: 'Superseded by opencode/claude-sonnet-4-6.'
        },
        {
          model: 'opencode/gpt-4.9',
          from: 'deprecated',
          to: 'sunset',
          reason: 'Missing from current OpenCode inventory for 45 days.'
        }
      ]
    },
    lifecycle: {
      models: [
        { model: 'opencode/claude-sonnet-4-5', successorModel: 'opencode/claude-sonnet-4-6' },
        { model: 'opencode/gpt-4.9', successorModel: null }
      ]
    },
    now: '2026-04-07T02:00:00.000Z'
  })

  assert.equal(issues.items.length, 2)
  assert.equal(issues.items[0].kind, 'deprecated')
  assert.equal(issues.items[1].kind, 'sunset')
})

test('syncAutomationArtifacts preserves prior timestamps when lifecycle and plan are unchanged', async () => {
  const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), 'orpt-bench-automation-'))
  await fs.mkdir(path.join(rootDir, 'models'), { recursive: true })
  await fs.mkdir(path.join(rootDir, 'results', 'history'), { recursive: true })

  await writeJson(path.join(rootDir, 'models', 'catalog.json'), {
    models: [
      {
        model: 'opencode/gpt-5.4-mini',
        modelId: 'gpt-5.4-mini',
        family: 'openai',
        created: 1775532308,
        recommendedUse: 'dev-general',
        excludedFromMatrices: false,
        benchmark: { intelligenceScore: null, blendedPricePer1mTokensUsd: 1.68 }
      }
    ]
  })
  await writeJson(path.join(rootDir, 'models', 'matrices.json'), {
    matrices: {
      current_task_cheap_comparable: { models: ['opencode/gpt-5.4-mini'] },
      release: { models: ['opencode/gpt-5.4-mini'] }
    }
  })
  await writeJson(path.join(rootDir, 'results', 'latest.json'), {
    run: { id: 'run-1', completedAt: '2026-04-07T00:00:00.000Z' },
    modelSummary: [
      { model: 'opencode/gpt-5.4-mini', runs: 9, successfulTasks: 7, comparable: true }
    ]
  })

  const runtime = { rootDir }
  const first = await syncAutomationArtifacts(runtime)
  const second = await syncAutomationArtifacts(runtime)

  assert.deepEqual(second.lifecycle.summary, first.lifecycle.summary)
  assert.deepEqual(second.plan.cycles, first.plan.cycles)
  assert.ok(first.transitions.summary.discovered >= 0)
  assert.equal(second.transitions.summary.stageChanges, 0)
  assert.equal(second.transitions.summary.inventoryChanges, 0)
})

test('syncAutomationArtifacts prunes sunset models from manual sources', async () => {
  const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), 'orpt-bench-prune-'))
  await fs.mkdir(path.join(rootDir, 'models'), { recursive: true })
  await fs.mkdir(path.join(rootDir, 'results', 'history'), { recursive: true })
  await fs.mkdir(path.join(rootDir, 'data'), { recursive: true })

  await writeJson(path.join(rootDir, 'models', 'catalog.json'), { models: [] })
  await writeJson(path.join(rootDir, 'models', 'matrices.json'), {
    matrices: {
      release: {
        description: 'release',
        models: ['opencode/gpt-4.9']
      }
    }
  })
  await writeJson(path.join(rootDir, 'models', 'lifecycle.json'), {
    models: [
      {
        model: 'opencode/gpt-4.9',
        modelId: 'gpt-4.9',
        family: 'openai',
        firstSeenAt: '2026-01-01T00:00:00.000Z',
        firstMissingAt: '2026-02-01T00:00:00.000Z',
        lastSeenInInventoryAt: '2026-01-31T00:00:00.000Z',
        recommendedUse: 'standard'
      }
    ]
  })
  await writeJson(path.join(rootDir, 'data', 'model-benchmarks.manual.json'), {
    models: {
      'opencode/gpt-4.9': { benchmark: { intelligenceScore: 1 } }
    }
  })
  await writeJson(path.join(rootDir, 'data', 'model-stability.manual.json'), {
    models: {
      'opencode/gpt-4.9': { stability: { headlessFriendly: false }, featureSupport: { unattendedBenchmarkRuns: 'unsupported', knownLimitations: [] } }
    }
  })

  const result = await syncAutomationArtifacts({ rootDir })
  const benchmarks = await fs.readFile(path.join(rootDir, 'data', 'model-benchmarks.manual.json'), 'utf8').then(JSON.parse)
  const stability = await fs.readFile(path.join(rootDir, 'data', 'model-stability.manual.json'), 'utf8').then(JSON.parse)
  const matrices = await fs.readFile(path.join(rootDir, 'models', 'matrices.json'), 'utf8').then(JSON.parse)

  assert.deepEqual(result.pruneResult.benchmarksPruned, ['opencode/gpt-4.9'])
  assert.deepEqual(result.pruneResult.stabilityPruned, ['opencode/gpt-4.9'])
  assert.deepEqual(benchmarks.models, {})
  assert.deepEqual(stability.models, {})
  assert.deepEqual(matrices.matrices.release.models, [])
})
