import fs from 'node:fs/promises'
import path from 'node:path'

import { renderMatricesMarkdown } from './models.js'
import { nowIso, readJson, writeJson, writeText } from './fs.js'

const DEFAULT_MODEL_POLICY = {
  matrixInclusions: {
    balanced: ['opencode/grok-4.20'],
    frontier: ['opencode/claude-sonnet-4-6']
  },
  lifecycle: {
    sunsetAfterDays: 30,
    promotionSmokeSuccessesRequired: 2,
    bootstrapSmokePromotionBefore: '2026-04-07T16:12:30.832Z',
    forceActiveModels: [],
    forceDeprecatedModels: [],
    forceSunsetModels: []
  },
  benchmarkCycles: {
    candidate_smoke: {
      description: 'Control-task smoke run for newly discovered models before they enter broader recurring benchmarks',
      taskGlob: '05*',
      repeats: 1,
      maxModels: 4
    },
    weekly: {
      description: 'Primary comparable weekly benchmark run',
      matrix: 'current_task_cheap_comparable',
      fallbackMatrices: ['cheap_headless', 'cheap', 'dev'],
      taskGlob: '*',
      repeats: 1
    },
    monthly: {
      description: 'Higher-signal monthly benchmark run over the release cohort',
      matrix: 'release',
      fallbackMatrices: ['frontier', 'balanced'],
      taskGlob: '*',
      repeats: 1
    }
  }
}

function uniqueStrings(values) {
  return [...new Set((values || []).filter(Boolean))]
}

function canonicalizeModelId(modelId) {
  return String(modelId || '')
    .replace(/[:/-]?free$/i, '')
    .replace(/-preview$/i, '')
    .replace(/-thinking$/i, '')
}

function buildReplacementGroup(modelId) {
  return canonicalizeModelId(modelId)
    .split(/[^a-zA-Z0-9.]+/)
    .map((part) => part.toLowerCase())
    .filter(Boolean)
    .map((part) => /\d/.test(part) ? '#' : part)
    .join('-')
}

function extractVersionVector(modelId) {
  const matches = canonicalizeModelId(modelId).match(/\d+(?:\.\d+)*/g) || []
  return matches
    .flatMap((part) => part.split('.'))
    .map((part) => Number.parseInt(part, 10))
    .filter((part) => Number.isFinite(part))
}

function compareVersionVectors(left, right) {
  const length = Math.max(left.length, right.length)
  for (let index = 0; index < length; index += 1) {
    const leftValue = left[index] ?? -1
    const rightValue = right[index] ?? -1
    if (leftValue !== rightValue) return leftValue - rightValue
  }
  return 0
}

function buildSuccessorMap(models) {
  const groups = new Map()

  for (const model of models) {
    const key = `${model.family || 'unknown'}::${buildReplacementGroup(model.modelId || model.model)}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(model)
  }

  const successors = new Map()
  for (const group of groups.values()) {
    const sorted = [...group].sort((left, right) => {
      const versionDelta = compareVersionVectors(extractVersionVector(right.modelId || right.model), extractVersionVector(left.modelId || left.model))
      if (versionDelta !== 0) return versionDelta
      return (right.created || 0) - (left.created || 0) || right.model.localeCompare(left.model)
    })

    const newest = sorted[0]
    const newestVersion = extractVersionVector(newest.modelId || newest.model)
    for (const entry of sorted.slice(1)) {
      const entryVersion = extractVersionVector(entry.modelId || entry.model)
      if (compareVersionVectors(entryVersion, newestVersion) < 0) {
        successors.set(entry.model, newest.model)
      }
    }
  }

  return successors
}

function rankRecommendedUse(recommendedUse) {
  const ranks = {
    'release-frontier': 5,
    'balanced-general': 4,
    'dev-general': 3,
    'dev-smoke': 2,
    standard: 1
  }
  return ranks[recommendedUse] || 0
}

function countDaysBetween(startAt, endAt) {
  const startMs = Date.parse(startAt)
  const endMs = Date.parse(endAt)
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return null
  return Math.max(0, Math.floor((endMs - startMs) / 86400000))
}

function beforeOrEqualIso(left, right) {
  const leftMs = Date.parse(left)
  const rightMs = Date.parse(right)
  if (!Number.isFinite(leftMs) || !Number.isFinite(rightMs)) return false
  return leftMs <= rightMs
}

function mergePolicy(policy = {}) {
  const mergedCycles = {}
  const cycleNames = [...new Set([
    ...Object.keys(DEFAULT_MODEL_POLICY.benchmarkCycles),
    ...Object.keys(policy.benchmarkCycles || {})
  ])]

  for (const cycleName of cycleNames) {
    mergedCycles[cycleName] = {
      ...(DEFAULT_MODEL_POLICY.benchmarkCycles[cycleName] || {}),
      ...((policy.benchmarkCycles || {})[cycleName] || {})
    }
  }

  const mergedInclusions = {}
  const inclusionNames = [...new Set([
    ...Object.keys(DEFAULT_MODEL_POLICY.matrixInclusions),
    ...Object.keys(policy.matrixInclusions || {})
  ])]

  for (const inclusionName of inclusionNames) {
    mergedInclusions[inclusionName] = uniqueStrings([
      ...((DEFAULT_MODEL_POLICY.matrixInclusions || {})[inclusionName] || []),
      ...((policy.matrixInclusions || {})[inclusionName] || [])
    ])
  }

  return {
    matrixInclusions: mergedInclusions,
    lifecycle: {
      ...DEFAULT_MODEL_POLICY.lifecycle,
      ...(policy.lifecycle || {}),
      forceActiveModels: uniqueStrings(policy.lifecycle?.forceActiveModels || DEFAULT_MODEL_POLICY.lifecycle.forceActiveModels),
      forceDeprecatedModels: uniqueStrings(policy.lifecycle?.forceDeprecatedModels || DEFAULT_MODEL_POLICY.lifecycle.forceDeprecatedModels),
      forceSunsetModels: uniqueStrings(policy.lifecycle?.forceSunsetModels || DEFAULT_MODEL_POLICY.lifecycle.forceSunsetModels)
    },
    benchmarkCycles: mergedCycles
  }
}

export async function loadModelPolicy(rootDir) {
  const policyPath = path.join(rootDir, 'models/policy.json')
  const policy = await readJson(policyPath).catch(() => ({}))
  return mergePolicy(policy)
}

export async function loadBenchmarkHistory(rootDir) {
  const historyDir = path.join(rootDir, 'results/history')
  let fileNames = []
  try {
    fileNames = (await fs.readdir(historyDir)).filter((name) => name.endsWith('.json')).sort()
  } catch {
    fileNames = []
  }

  const runs = []
  for (const fileName of fileNames) {
    runs.push(await readJson(path.join(historyDir, fileName)).catch(() => null))
  }

  const latest = await readJson(path.join(rootDir, 'results/latest.json')).catch(() => null)
  if (latest) runs.push(latest)

  const deduped = new Map()
  for (const run of runs.filter(Boolean)) {
    const runId = run?.run?.id || `${run?.run?.startedAt || ''}:${run?.run?.completedAt || ''}`
    deduped.set(runId, run)
  }

  return [...deduped.values()].sort((left, right) => {
    const leftAt = Date.parse(left?.run?.completedAt || left?.run?.startedAt || 0)
    const rightAt = Date.parse(right?.run?.completedAt || right?.run?.startedAt || 0)
    return leftAt - rightAt
  })
}

function summarizeRunModelEntries(run) {
  if (Array.isArray(run.modelSummary) && run.modelSummary.length) {
    return run.modelSummary.map((entry) => ({
      model: entry.model,
      runs: entry.runs || 0,
      successfulTasks: entry.successfulTasks || 0,
      comparable: entry.comparable === true,
      taskCount: entry.runs || 0
    }))
  }

  const grouped = new Map()
  for (const result of run.results || []) {
    if (!grouped.has(result.model)) {
      grouped.set(result.model, { model: result.model, runs: 0, successfulTasks: 0, comparable: false, taskCount: 0 })
    }
    const summary = grouped.get(result.model)
    summary.runs += 1
    summary.taskCount += 1
    if (result.success) summary.successfulTasks += 1
  }

  return [...grouped.values()]
}

function isSmokeBenchmarkRun(run) {
  const benchmarkCycle = run?.run?.benchmarkCycle || null
  if (benchmarkCycle === 'candidate_smoke') return true

  const taskPatterns = Array.isArray(run?.run?.taskPatterns) ? run.run.taskPatterns.filter(Boolean) : []
  if (taskPatterns.length === 1 && taskPatterns[0] === '05*') return true

  const taskIds = Array.isArray(run?.taskCatalog) ? run.taskCatalog.map((task) => task.id).filter(Boolean) : []
  return taskIds.length === 1 && taskIds[0].startsWith('05-')
}

export function buildBenchmarkHistoryIndex(runs) {
  const byModel = new Map()

  for (const run of runs || []) {
    const benchmarkedAt = run?.run?.completedAt || run?.run?.startedAt || null
    const smokeBenchmark = isSmokeBenchmarkRun(run)
    for (const entry of summarizeRunModelEntries(run)) {
      if (!byModel.has(entry.model)) {
        byModel.set(entry.model, {
          model: entry.model,
          benchmarkSessions: 0,
          comparableBenchmarkSessions: 0,
          smokeBenchmarkSessions: 0,
          successfulSmokeBenchmarkSessions: 0,
          failedSmokeBenchmarkSessions: 0,
          totalTaskRuns: 0,
          successfulTaskRuns: 0,
          lastBenchmarkedAt: null,
          firstBenchmarkedAt: null,
          lastSmokeBenchmarkedAt: null,
          lastSuccessfulSmokeBenchmarkAt: null,
          successRate: 0
        })
      }

      const summary = byModel.get(entry.model)
      summary.benchmarkSessions += 1
      summary.totalTaskRuns += entry.runs || 0
      summary.successfulTaskRuns += entry.successfulTasks || 0
      if (entry.comparable) summary.comparableBenchmarkSessions += 1
      if (smokeBenchmark) {
        summary.smokeBenchmarkSessions += 1
        if (entry.successfulTasks > 0) summary.successfulSmokeBenchmarkSessions += 1
        else summary.failedSmokeBenchmarkSessions += 1
      }
      if (benchmarkedAt) {
        if (!summary.firstBenchmarkedAt || Date.parse(benchmarkedAt) < Date.parse(summary.firstBenchmarkedAt)) summary.firstBenchmarkedAt = benchmarkedAt
        if (!summary.lastBenchmarkedAt || Date.parse(benchmarkedAt) > Date.parse(summary.lastBenchmarkedAt)) summary.lastBenchmarkedAt = benchmarkedAt
        if (smokeBenchmark) {
          if (!summary.lastSmokeBenchmarkedAt || Date.parse(benchmarkedAt) > Date.parse(summary.lastSmokeBenchmarkedAt)) summary.lastSmokeBenchmarkedAt = benchmarkedAt
          if (entry.successfulTasks > 0 && (!summary.lastSuccessfulSmokeBenchmarkAt || Date.parse(benchmarkedAt) > Date.parse(summary.lastSuccessfulSmokeBenchmarkAt))) {
            summary.lastSuccessfulSmokeBenchmarkAt = benchmarkedAt
          }
        }
      }
    }
  }

  for (const summary of byModel.values()) {
    summary.successRate = summary.totalTaskRuns > 0 ? Number((summary.successfulTaskRuns / summary.totalTaskRuns).toFixed(6)) : 0
  }

  return byModel
}

function buildMatrixInclusionSet(policy) {
  return new Set(Object.values(policy.matrixInclusions || {}).flat().filter(Boolean))
}

function resolveForcedLifecycleState(modelName, policy) {
  if (policy.lifecycle.forceSunsetModels.includes(modelName)) return 'sunset'
  if (policy.lifecycle.forceDeprecatedModels.includes(modelName)) return 'deprecated'
  if (policy.lifecycle.forceActiveModels.includes(modelName)) return 'active'
  return null
}

export function buildLifecycleCatalog({ catalog, previousLifecycle = { models: [] }, benchmarkHistory = [], policy = DEFAULT_MODEL_POLICY, now = nowIso() }) {
  const currentModels = catalog.models || []
  const currentByModel = new Map(currentModels.map((model) => [model.model, model]))
  const previousByModel = new Map((previousLifecycle.models || []).map((model) => [model.model, model]))
  const historyByModel = buildBenchmarkHistoryIndex(benchmarkHistory)
  const successorMap = buildSuccessorMap(currentModels)
  const pinnedModels = buildMatrixInclusionSet(policy)
  const modelNames = [...new Set([
    ...currentByModel.keys(),
    ...previousByModel.keys(),
    ...historyByModel.keys()
  ])].sort()

  const models = modelNames.map((modelName) => {
    const current = currentByModel.get(modelName) || null
    const previous = previousByModel.get(modelName) || null
    const history = historyByModel.get(modelName) || {
      benchmarkSessions: 0,
      comparableBenchmarkSessions: 0,
      smokeBenchmarkSessions: 0,
      successfulSmokeBenchmarkSessions: 0,
      failedSmokeBenchmarkSessions: 0,
      totalTaskRuns: 0,
      successfulTaskRuns: 0,
      lastBenchmarkedAt: null,
      firstBenchmarkedAt: null,
      lastSmokeBenchmarkedAt: null,
      lastSuccessfulSmokeBenchmarkAt: null,
      successRate: 0
    }
    const available = Boolean(current)
    const createdAt = current?.created ? new Date(current.created * 1000).toISOString() : previous?.createdAt || history.firstBenchmarkedAt || null
    const firstSeenAt = previous?.firstSeenAt || createdAt || now
    const lastSeenInInventoryAt = available ? now : (previous?.lastSeenInInventoryAt || previous?.firstSeenAt || null)
    const firstMissingAt = available ? null : (previous?.firstMissingAt || now)
    const successorModel = available ? (successorMap.get(modelName) || null) : (previous?.successorModel || null)
    const recommendedUse = current?.recommendedUse || previous?.recommendedUse || 'standard'
    const forcedState = resolveForcedLifecycleState(modelName, policy)

    let lifecycleStage = 'active'
    let lifecycleReason = 'Benchmarked and still available for recurring automation.'
    const requiredSmokeSuccesses = Math.max(1, policy.lifecycle.promotionSmokeSuccessesRequired || 1)
    const hasPassingSmokeBenchmark = history.successfulSmokeBenchmarkSessions >= requiredSmokeSuccesses
    const hasSuccessfulBenchmark = history.successfulTaskRuns > 0
    const wasPreviouslyActive = previous?.lifecycleStage === 'active'
    const bootstrapSmokePromotionBefore = policy.lifecycle.bootstrapSmokePromotionBefore || null
    const eligibleForBootstrapPromotion = Boolean(
      bootstrapSmokePromotionBefore &&
      history.lastBenchmarkedAt &&
      history.comparableBenchmarkSessions > 0 &&
      hasSuccessfulBenchmark &&
      beforeOrEqualIso(history.lastBenchmarkedAt, bootstrapSmokePromotionBefore)
    )

    if (forcedState) {
      lifecycleStage = forcedState
      lifecycleReason = `Lifecycle state forced by models/policy.json: ${forcedState}.`
    } else if (!available) {
      const missingDays = countDaysBetween(firstMissingAt, now) || 0
      lifecycleStage = missingDays >= (policy.lifecycle.sunsetAfterDays || 30) ? 'sunset' : 'deprecated'
      lifecycleReason = lifecycleStage === 'sunset'
        ? `Missing from current OpenCode inventory for ${missingDays} days.`
        : 'Missing from current OpenCode inventory and awaiting sunset grace period.'
    } else if (successorModel && !pinnedModels.has(modelName) && (recommendedUse === 'standard' || history.benchmarkSessions === 0)) {
      lifecycleStage = 'deprecated'
      lifecycleReason = `Superseded by ${successorModel}.`
    } else if (history.benchmarkSessions === 0) {
      lifecycleStage = 'candidate'
      lifecycleReason = 'Discovered in the current inventory and awaiting initial smoke benchmarking.'
    } else if (wasPreviouslyActive && available) {
      lifecycleStage = 'active'
      lifecycleReason = 'Previously active model retained during stricter smoke-promotion rollout.'
    } else if (eligibleForBootstrapPromotion) {
      lifecycleStage = 'active'
      lifecycleReason = `Comparable successful benchmark history before ${bootstrapSmokePromotionBefore} bootstrapped this model into active status during the smoke-promotion rollout.`
    } else if (!hasPassingSmokeBenchmark && !hasSuccessfulBenchmark) {
      lifecycleStage = 'candidate'
      lifecycleReason = history.smokeBenchmarkSessions > 0
        ? `Smoke benchmarks have run, but the model has not reached the required ${requiredSmokeSuccesses} passing smoke runs yet.`
        : `Awaiting ${requiredSmokeSuccesses} passing smoke benchmark runs before promotion into recurring cohorts.`
    } else if (!hasPassingSmokeBenchmark && hasSuccessfulBenchmark) {
      lifecycleStage = 'candidate'
      lifecycleReason = `Successful benchmark data exists, but the model has not yet met the ${requiredSmokeSuccesses}-run smoke promotion requirement.`
    }

    return {
      model: modelName,
      modelId: current?.modelId || previous?.modelId || modelName.split('/').slice(1).join('/'),
      family: current?.family || previous?.family || 'unknown',
      inventoryStatus: available ? 'available' : 'missing',
      firstSeenAt,
      lastSeenInInventoryAt,
      firstMissingAt,
      createdAt,
      benchmarkSessions: history.benchmarkSessions,
      comparableBenchmarkSessions: history.comparableBenchmarkSessions,
      smokeBenchmarkSessions: history.smokeBenchmarkSessions,
      successfulSmokeBenchmarkSessions: history.successfulSmokeBenchmarkSessions,
      failedSmokeBenchmarkSessions: history.failedSmokeBenchmarkSessions,
      totalTaskRuns: history.totalTaskRuns,
      successfulTaskRuns: history.successfulTaskRuns,
      successRate: history.successRate,
      firstBenchmarkedAt: history.firstBenchmarkedAt || previous?.firstBenchmarkedAt || null,
      lastBenchmarkedAt: history.lastBenchmarkedAt || previous?.lastBenchmarkedAt || null,
      lastSmokeBenchmarkedAt: history.lastSmokeBenchmarkedAt || previous?.lastSmokeBenchmarkedAt || null,
      lastSuccessfulSmokeBenchmarkAt: history.lastSuccessfulSmokeBenchmarkAt || previous?.lastSuccessfulSmokeBenchmarkAt || null,
      recommendedUse,
      replacementGroup: buildReplacementGroup(current?.modelId || previous?.modelId || modelName),
      successorModel,
      lifecycleStage,
      lifecycleReason,
      pinnedInAutomation: pinnedModels.has(modelName)
    }
  })

  const summary = {
    candidate: models.filter((model) => model.lifecycleStage === 'candidate').length,
    active: models.filter((model) => model.lifecycleStage === 'active').length,
    deprecated: models.filter((model) => model.lifecycleStage === 'deprecated').length,
    sunset: models.filter((model) => model.lifecycleStage === 'sunset').length
  }

  return {
    updatedAt: now,
    summary,
    models: models.sort((left, right) => {
      const stageOrder = { active: 0, candidate: 1, deprecated: 2, sunset: 3 }
      return (stageOrder[left.lifecycleStage] ?? 9) - (stageOrder[right.lifecycleStage] ?? 9) || left.model.localeCompare(right.model)
    })
  }
}

function selectMatrixForCycle(matrices, cycleConfig) {
  const requested = [cycleConfig.matrix, ...(cycleConfig.fallbackMatrices || [])].filter(Boolean)
  for (const matrixName of requested) {
    const matrix = matrices.matrices?.[matrixName]
    if (matrix?.models?.length) {
      return { matrixName, models: matrix.models }
    }
  }
  return { matrixName: null, models: [] }
}

function sortCandidateModels(models) {
  return [...models].sort((left, right) => {
    const useDelta = rankRecommendedUse(right.recommendedUse) - rankRecommendedUse(left.recommendedUse)
    if (useDelta !== 0) return useDelta
    const intelligenceDelta = (right.benchmark?.intelligenceScore ?? -1) - (left.benchmark?.intelligenceScore ?? -1)
    if (intelligenceDelta !== 0) return intelligenceDelta
    const priceDelta = (left.benchmark?.blendedPricePer1mTokensUsd ?? Infinity) - (right.benchmark?.blendedPricePer1mTokensUsd ?? Infinity)
    if (priceDelta !== 0) return priceDelta
    return (right.created || 0) - (left.created || 0) || left.model.localeCompare(right.model)
  })
}

export function buildAutomationPlan({ catalog, matrices, lifecycle, policy = DEFAULT_MODEL_POLICY, now = nowIso() }) {
  const lifecycleByModel = new Map((lifecycle.models || []).map((model) => [model.model, model]))
  const smokeConfig = policy.benchmarkCycles.candidate_smoke || DEFAULT_MODEL_POLICY.benchmarkCycles.candidate_smoke
  const smokeModels = sortCandidateModels(
    (catalog.models || []).filter((model) => {
      const lifecycleEntry = lifecycleByModel.get(model.model)
      return lifecycleEntry?.lifecycleStage === 'candidate' && model.excludedFromMatrices !== true
    })
  ).slice(0, smokeConfig.maxModels || 4).map((model) => model.model)

  const cycles = {
    candidate_smoke: {
      description: smokeConfig.description,
      enabled: smokeModels.length > 0,
      matrix: null,
      taskGlob: smokeConfig.taskGlob || '05*',
      repeats: smokeConfig.repeats || 1,
      models: smokeModels
    }
  }

  for (const [cycleName, cycleConfig] of Object.entries(policy.benchmarkCycles || {})) {
    if (cycleName === 'candidate_smoke') continue
    const selection = selectMatrixForCycle(matrices, cycleConfig)
    cycles[cycleName] = {
      description: cycleConfig.description || cycleName,
      enabled: selection.models.length > 0,
      matrix: selection.matrixName,
      taskGlob: cycleConfig.taskGlob || '*',
      repeats: cycleConfig.repeats || 1,
      models: selection.models
    }
  }

  return {
    updatedAt: now,
    lifecycleSummary: lifecycle.summary,
    cycles
  }
}

export function buildLifecycleTransitions({ previousLifecycle = { models: [] }, lifecycle, plan, previousPlan = null, now = nowIso() }) {
  const previousByModel = new Map((previousLifecycle.models || []).map((model) => [model.model, model]))
  const planCandidateModels = new Set(plan?.cycles?.candidate_smoke?.models || [])

  const discovered = []
  const stageChanges = []
  const inventoryChanges = []
  const candidateSmokeQueue = []

  for (const model of lifecycle.models || []) {
    const previous = previousByModel.get(model.model) || null
    if (!previous) {
      discovered.push({ model: model.model, lifecycleStage: model.lifecycleStage, reason: model.lifecycleReason })
    } else {
      if (previous.lifecycleStage !== model.lifecycleStage) {
        stageChanges.push({ model: model.model, from: previous.lifecycleStage, to: model.lifecycleStage, reason: model.lifecycleReason })
      }
      if (previous.inventoryStatus !== model.inventoryStatus) {
        inventoryChanges.push({ model: model.model, from: previous.inventoryStatus, to: model.inventoryStatus })
      }
    }

    if (planCandidateModels.has(model.model)) {
      candidateSmokeQueue.push({ model: model.model, reason: model.lifecycleReason })
    }
  }

  const previousCandidateModels = new Set(previousPlan?.cycles?.candidate_smoke?.models || [])
  const smokeQueueChanges = {
    added: candidateSmokeQueue.filter((entry) => !previousCandidateModels.has(entry.model)).map((entry) => entry.model),
    removed: [...previousCandidateModels].filter((model) => !planCandidateModels.has(model))
  }

  return {
    updatedAt: now,
    summary: {
      discovered: discovered.length,
      stageChanges: stageChanges.length,
      inventoryChanges: inventoryChanges.length,
      candidateSmokeQueued: candidateSmokeQueue.length,
      deprecated: stageChanges.filter((entry) => entry.to === 'deprecated').length,
      sunset: stageChanges.filter((entry) => entry.to === 'sunset').length
    },
    discovered,
    stageChanges,
    inventoryChanges,
    candidateSmokeQueue,
    smokeQueueChanges
  }
}

export function renderTransitionsMarkdown(transitions) {
  const lines = [
    '# Lifecycle Transitions',
    '',
    `Updated: ${transitions.updatedAt}`,
    '',
    '## Summary',
    '',
    `- Discovered: ${transitions.summary.discovered}`,
    `- Stage changes: ${transitions.summary.stageChanges}`,
    `- Inventory changes: ${transitions.summary.inventoryChanges}`,
    `- Candidate smoke queued: ${transitions.summary.candidateSmokeQueued}`,
    `- Deprecated transitions: ${transitions.summary.deprecated}`,
    `- Sunset transitions: ${transitions.summary.sunset}`,
    '',
    '## Discovered',
    ''
  ]

  if (!transitions.discovered.length) {
    lines.push('- None')
  } else {
    for (const entry of transitions.discovered) {
      lines.push(`- ${entry.model}: ${entry.lifecycleStage} (${entry.reason})`)
    }
  }

  lines.push('', '## Stage Changes', '')
  if (!transitions.stageChanges.length) {
    lines.push('- None')
  } else {
    for (const entry of transitions.stageChanges) {
      lines.push(`- ${entry.model}: ${entry.from} -> ${entry.to} (${entry.reason})`)
    }
  }

  lines.push('', '## Inventory Changes', '')
  if (!transitions.inventoryChanges.length) {
    lines.push('- None')
  } else {
    for (const entry of transitions.inventoryChanges) {
      lines.push(`- ${entry.model}: ${entry.from} -> ${entry.to}`)
    }
  }

  lines.push('', '## Candidate Smoke Queue', '')
  if (!transitions.candidateSmokeQueue.length) {
    lines.push('- None')
  } else {
    for (const entry of transitions.candidateSmokeQueue) {
      lines.push(`- ${entry.model}: ${entry.reason}`)
    }
  }

  lines.push('')
  return lines.join('\n')
}

export function renderLifecycleMarkdown(lifecycle, plan) {
  const candidateModels = (lifecycle.models || []).filter((model) => model.lifecycleStage === 'candidate')
  const deprecatedModels = (lifecycle.models || []).filter((model) => model.lifecycleStage === 'deprecated')
  const sunsetModels = (lifecycle.models || []).filter((model) => model.lifecycleStage === 'sunset')
  const lines = [
    '# Model Lifecycle',
    '',
    `Updated: ${lifecycle.updatedAt}`,
    '',
    '## Summary',
    '',
    `- Active: ${lifecycle.summary.active}`,
    `- Candidate: ${lifecycle.summary.candidate}`,
    `- Deprecated: ${lifecycle.summary.deprecated}`,
    `- Sunset: ${lifecycle.summary.sunset}`,
    '',
    '## Planned Cycles',
    '',
    '| Cycle | Enabled | Matrix | Task Glob | Models |',
    '| --- | --- | --- | --- | --- |'
  ]

  for (const [cycleName, cycle] of Object.entries(plan.cycles || {})) {
    lines.push(`| ${cycleName} | ${cycle.enabled ? 'yes' : 'no'} | ${cycle.matrix || 'direct'} | ${cycle.taskGlob || '*'} | ${(cycle.models || []).join(', ') || 'none'} |`)
  }

  lines.push('', '## Candidates', '')
  if (!candidateModels.length) {
    lines.push('- None')
  } else {
    for (const model of candidateModels) {
      lines.push(`- ${model.model}: ${model.lifecycleReason}`)
    }
  }

  lines.push('', '## Deprecated', '')
  if (!deprecatedModels.length) {
    lines.push('- None')
  } else {
    for (const model of deprecatedModels) {
      lines.push(`- ${model.model}: ${model.lifecycleReason}`)
    }
  }

  lines.push('', '## Sunset', '')
  if (!sunsetModels.length) {
    lines.push('- None')
  } else {
    for (const model of sunsetModels) {
      lines.push(`- ${model.model}: ${model.lifecycleReason}`)
    }
  }

  lines.push('')
  return lines.join('\n')
}

function normalizeLifecycleForCompare(lifecycle) {
  return {
    summary: lifecycle.summary,
    models: (lifecycle.models || []).map((model) => {
      const { updatedAt, lastSeenInInventoryAt, ...rest } = model
      return rest
    })
  }
}

function normalizePlanForCompare(plan) {
  return {
    lifecycleSummary: plan.lifecycleSummary,
    cycles: plan.cycles
  }
}

function normalizeTransitionsForCompare(transitions) {
  return {
    summary: transitions.summary,
    discovered: transitions.discovered,
    stageChanges: transitions.stageChanges,
    inventoryChanges: transitions.inventoryChanges,
    candidateSmokeQueue: transitions.candidateSmokeQueue,
    smokeQueueChanges: transitions.smokeQueueChanges
  }
}

function normalizePlanCyclesForTransitionCompare(plan) {
  return {
    cycles: plan?.cycles || {}
  }
}

function pruneSunsetModelsFromMatrices(matrices, sunsetModels) {
  const pruned = {
    ...matrices,
    matrices: Object.fromEntries(Object.entries(matrices.matrices || {}).map(([matrixName, matrix]) => [
      matrixName,
      {
        ...matrix,
        models: (matrix.models || []).filter((model) => !sunsetModels.has(model))
      }
    ]))
  }
  return pruned
}

async function pruneSunsetModelsFromManualSources(rootDir, sunsetModels) {
  if (!sunsetModels.size) return { benchmarksPruned: [], stabilityPruned: [] }

  const benchmarkPath = path.join(rootDir, 'data/model-benchmarks.manual.json')
  const stabilityPath = path.join(rootDir, 'data/model-stability.manual.json')
  const [benchmarks, stability] = await Promise.all([
    readJson(benchmarkPath).catch(() => null),
    readJson(stabilityPath).catch(() => null)
  ])

  const benchmarksPruned = []
  const stabilityPruned = []

  if (benchmarks?.models) {
    for (const model of sunsetModels) {
      if (benchmarks.models[model]) {
        delete benchmarks.models[model]
        benchmarksPruned.push(model)
      }
    }
    if (benchmarksPruned.length) await writeJson(benchmarkPath, benchmarks)
  }

  if (stability?.models) {
    for (const model of sunsetModels) {
      if (stability.models[model]) {
        delete stability.models[model]
        stabilityPruned.push(model)
      }
    }
    if (stabilityPruned.length) await writeJson(stabilityPath, stability)
  }

  return { benchmarksPruned, stabilityPruned }
}

async function writeIssuePlanArtifacts(rootDir, issues) {
  await writeJson(path.join(rootDir, 'models/issues.json'), issues)
  const lines = [
    '# Model Lifecycle Issues',
    '',
    `Updated: ${issues.updatedAt}`,
    '',
    '## Planned Issues',
    ''
  ]

  if (!issues.items.length) {
    lines.push('- None')
  } else {
    for (const item of issues.items) {
      lines.push(`- [${item.kind}] ${item.title}`)
    }
  }
  lines.push('')
  await writeText(path.join(rootDir, 'models/ISSUES.md'), lines.join('\n'))
}

export function buildLifecycleIssuePlan({ transitions, lifecycle, now = nowIso() }) {
  const lifecycleByModel = new Map((lifecycle.models || []).map((model) => [model.model, model]))
  const items = []

  for (const entry of transitions.stageChanges || []) {
    if (entry.to !== 'deprecated' && entry.to !== 'sunset') continue
    const lifecycleEntry = lifecycleByModel.get(entry.model)
    if (!lifecycleEntry) continue
    items.push({
      id: `${entry.to}:${entry.model}`,
      kind: entry.to,
      model: entry.model,
      title: `${entry.to === 'sunset' ? 'Sunset' : 'Deprecate'} ${entry.model}`,
      labels: ['automation', 'models', entry.to],
      body: [
        `Model: ${entry.model}`,
        `Transition: ${entry.from} -> ${entry.to}`,
        `Reason: ${entry.reason}`,
        lifecycleEntry.successorModel ? `Successor: ${lifecycleEntry.successorModel}` : null
      ].filter(Boolean).join('\n')
    })
  }

  return {
    updatedAt: now,
    items
  }
}

function sameJsonShape(left, right) {
  return JSON.stringify(left) === JSON.stringify(right)
}

export async function writeAutomationArtifacts(rootDir, { lifecycle, plan }) {
  await writeJson(path.join(rootDir, 'models/lifecycle.json'), lifecycle)
  await writeJson(path.join(rootDir, 'models/automation.plan.json'), plan)
  await writeText(path.join(rootDir, 'models/LIFECYCLE.md'), renderLifecycleMarkdown(lifecycle, plan))
}

async function writeTransitionArtifacts(rootDir, transitions) {
  await writeJson(path.join(rootDir, 'models/transitions.json'), transitions)
  await writeText(path.join(rootDir, 'models/TRANSITIONS.md'), renderTransitionsMarkdown(transitions))
}

export async function syncAutomationArtifacts(runtime) {
  const rootDir = runtime.rootDir
  const [catalog, matrices, previousLifecycle, previousPlan, previousTransitions, policy, benchmarkHistory] = await Promise.all([
    readJson(path.join(rootDir, 'models/catalog.json')),
    readJson(path.join(rootDir, 'models/matrices.json')),
    readJson(path.join(rootDir, 'models/lifecycle.json')).catch(() => ({ models: [] })),
    readJson(path.join(rootDir, 'models/automation.plan.json')).catch(() => null),
    readJson(path.join(rootDir, 'models/transitions.json')).catch(() => null),
    loadModelPolicy(rootDir),
    loadBenchmarkHistory(rootDir)
  ])
  const now = nowIso()
  let lifecycle = buildLifecycleCatalog({ catalog, previousLifecycle, benchmarkHistory, policy, now })
  const sunsetModels = new Set((lifecycle.models || []).filter((model) => model.lifecycleStage === 'sunset').map((model) => model.model))
  const prunedMatrices = pruneSunsetModelsFromMatrices(matrices, sunsetModels)
  if (!sameJsonShape(prunedMatrices, matrices)) {
    await writeJson(path.join(rootDir, 'models/matrices.json'), prunedMatrices)
    await writeText(path.join(rootDir, 'models/MATRICES.md'), renderMatricesMarkdown(prunedMatrices))
  }
  const pruneResult = await pruneSunsetModelsFromManualSources(rootDir, sunsetModels)
  let plan = buildAutomationPlan({ catalog, matrices: prunedMatrices, lifecycle, policy, now })

  if (previousLifecycle?.models?.length && sameJsonShape(normalizeLifecycleForCompare(lifecycle), normalizeLifecycleForCompare(previousLifecycle))) {
    lifecycle = previousLifecycle
  }
  if (previousPlan && sameJsonShape(normalizePlanForCompare(plan), normalizePlanForCompare(previousPlan))) {
    plan = previousPlan
  }

  const transitions = buildLifecycleTransitions({ previousLifecycle, lifecycle, plan, previousPlan, now })
  const stableTransitions = previousTransitions && sameJsonShape(
    normalizeTransitionsForCompare(transitions),
    normalizeTransitionsForCompare({
      ...previousTransitions,
      smokeQueueChanges: buildLifecycleTransitions({
        previousLifecycle,
        lifecycle,
        plan,
        previousPlan: previousPlan || normalizePlanCyclesForTransitionCompare(plan),
        now: previousTransitions.updatedAt || now
      }).smokeQueueChanges
    })
  )
    ? previousTransitions
    : transitions

  const issues = buildLifecycleIssuePlan({ transitions: stableTransitions, lifecycle, now })

  await writeAutomationArtifacts(rootDir, { lifecycle, plan })
  await writeTransitionArtifacts(rootDir, stableTransitions)
  await writeIssuePlanArtifacts(rootDir, issues)
  return { lifecycle, plan, transitions: stableTransitions, issues, pruneResult }
}

export async function selectBenchmarkCycle(runtime, cycleName) {
  const planPath = path.join(runtime.rootDir, 'models/automation.plan.json')
  let plan = await readJson(planPath).catch(() => null)
  if (!plan) {
    plan = (await syncAutomationArtifacts(runtime)).plan
  }

  const cycle = plan.cycles?.[cycleName]
  if (!cycle) {
    throw new Error(`Unknown benchmark cycle: ${cycleName}`)
  }

  return {
    cycle: cycleName,
    ...cycle,
    csv: (cycle.models || []).join(',')
  }
}

function upsertEnvLine(text, name, value) {
  const pattern = new RegExp(`^${name}=.*$`, 'm')
  if (value == null || value === '') {
    return text.replace(new RegExp(`^${name}=.*$\n?`, 'm'), '')
  }
  const line = `${name}=${value}`
  if (pattern.test(text)) return text.replace(pattern, line)
  return `${line}\n${text}`
}

export async function useBenchmarkCycle(runtime, cycleName) {
  const cycle = await selectBenchmarkCycle(runtime, cycleName)
  const envPath = path.join(runtime.rootDir, '.env.benchmark')
  let envText = ''
  try {
    envText = await fs.readFile(envPath, 'utf8')
  } catch {
    envText = ''
  }

  envText = upsertEnvLine(envText, 'BENCHMARK_MODELS', cycle.csv)
  envText = upsertEnvLine(envText, 'BENCHMARK_CYCLE', cycle.cycle)
  envText = upsertEnvLine(envText, 'BENCHMARK_TASK_GLOB', cycle.taskGlob || '*')
  envText = upsertEnvLine(envText, 'BENCHMARK_REPEATS', String(cycle.repeats || 1))

  await writeText(envPath, envText)
  return cycle
}

export {
  DEFAULT_MODEL_POLICY,
  buildReplacementGroup,
  compareVersionVectors,
  extractVersionVector
}
