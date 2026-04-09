import fs from 'node:fs/promises'
import path from 'node:path'
import { spawn } from 'node:child_process'

import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'

import { loadTasks, parseModel } from './tasks.js'
import { average, copyDir, ensureDir, exists, nowIso, readJson, slugify, sum, writeJson, writeText } from './fs.js'
import { extractRequestUnits, summarizeMessage, summarizeSessionMessages } from './extract.js'
import { startOpenCodeServer } from './opencode.js'
import { startRecordingProxy } from './proxy.js'

const OPENCODE_ZEN_PRICING_PER_MILLION = {
  'opencode/claude-opus-4-6': { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25, source: 'https://opencode.ai/docs/zen/#pricing' },
  'opencode/claude-sonnet-4-6': { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75, source: 'https://opencode.ai/docs/zen/#pricing' },
  'opencode/claude-haiku-4-5': { input: 1, output: 5, cacheRead: 0.1, cacheWrite: 1.25, source: 'https://opencode.ai/docs/zen/#pricing' },
  'opencode/claude-3-5-haiku': { input: 0.8, output: 4, cacheRead: 0.08, cacheWrite: 1, source: 'https://opencode.ai/docs/zen/#pricing' },
  'opencode/gpt-5.4': { input: 2.5, output: 15, cacheRead: 0.25, cacheWrite: 0, source: 'https://opencode.ai/docs/zen/#pricing' },
  'opencode/gpt-5.4-pro': { input: 30, output: 180, cacheRead: 30, cacheWrite: 0, source: 'https://opencode.ai/docs/zen/#pricing' },
  'opencode/gpt-5.4-mini': { input: 0.75, output: 4.5, cacheRead: 0.075, cacheWrite: 0, source: 'https://opencode.ai/docs/zen/#pricing' },
  'opencode/gpt-5.4-nano': { input: 0.2, output: 1.25, cacheRead: 0.02, cacheWrite: 0, source: 'https://opencode.ai/docs/zen/#pricing' },
  'opencode/gemini-3.1-pro': { input: 2, output: 12, cacheRead: 0.2, cacheWrite: 0, source: 'https://opencode.ai/docs/zen/#pricing' },
  'opencode/gemini-3-flash': { input: 0.5, output: 3, cacheRead: 0.05, cacheWrite: 0, source: 'https://opencode.ai/docs/zen/#pricing' },
  'opencode/glm-5.1': { input: 1.4, output: 4.4, cacheRead: 0.26, cacheWrite: 0, source: 'https://opencode.ai/docs/zen/#pricing' },
  'opencode/glm-5': { input: 1, output: 3.2, cacheRead: 0.2, cacheWrite: 0, source: 'https://opencode.ai/docs/zen/#pricing' },
  'opencode/minimax-m2.5': { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375, source: 'https://opencode.ai/docs/zen/#pricing' },
  'opencode/big-pickle': { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, source: 'https://opencode.ai/docs/zen/#pricing' },
  'opencode/nemotron-3-super-free': { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, source: 'https://opencode.ai/docs/zen/#pricing' },
  'opencode/minimax-m2.5-free': { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, source: 'https://opencode.ai/docs/zen/#pricing' },
  'opencode/qwen3.6-plus-free': { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, source: 'https://opencode.ai/docs/zen/#pricing' }
}

export function computeOpenCodeZenCostUsd(modelName, tokens) {
  const pricing = OPENCODE_ZEN_PRICING_PER_MILLION[modelName]
  if (!pricing || !tokens) return null
  const cache = tokens.cache || {}
  const inputTokens = (tokens.input || 0) + (cache.read || 0) + (cache.write || 0)
  const outputTokens = (tokens.output || 0) + (tokens.reasoning || 0)
  const cost = (
    (inputTokens * pricing.input) +
    (outputTokens * pricing.output)
  ) / 1_000_000
  return Number(cost.toFixed(8))
}

function resolveBenchmarkCost({ modelName, provider, messageSummary, sessionCostSource = null, sessionExportError = null, sessionDbError = null }) {
  if (provider === 'opencode') {
    if (messageSummary.costUsd != null) {
      const source = sessionCostSource === 'session-db-cost'
        ? 'session-db-cost'
        : 'session-export-cost'
      const notes = sessionCostSource === 'session-db-cost'
        ? 'Summed from assistant messages stored in the live OpenCode SQLite message ledger for the session.'
        : 'Summed from all assistant messages in the exported OpenCode session.'
      return {
        costUsd: messageSummary.costUsd,
        costAccountingSource: source,
        costAccountingNotes: notes,
        costAccountingUrl: null
      }
    }

    const reconstructed = computeOpenCodeZenCostUsd(modelName, messageSummary.tokens)
    if (reconstructed != null) {
      const upstreamFailure = sessionDbError || sessionExportError
      const notes = upstreamFailure
        ? `Computed from official OpenCode Zen input/output rates using recorded prompt-side and completion-side token counts after exact session cost recovery failed: ${upstreamFailure}`
        : 'Computed from official OpenCode Zen input/output rates using recorded prompt-side and completion-side token counts.'
      return {
        costUsd: reconstructed,
        costAccountingSource: 'zen-io-token-reconstruction',
        costAccountingNotes: notes,
        costAccountingUrl: OPENCODE_ZEN_PRICING_PER_MILLION[modelName].source
      }
    }
  }

  return {
    costUsd: messageSummary.costUsd,
    costAccountingSource: messageSummary.costUsd == null ? null : 'session-message-cost',
    costAccountingNotes: messageSummary.costUsd == null ? null : 'Captured from the OpenCode session message payload.',
    costAccountingUrl: null
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

export function computeCompositeScore(score, valueScore, weights = { score: 0.7, valueScore: 0.3 }) {
  return Number(clamp((score * weights.score) + (valueScore * weights.valueScore), 0, 1).toFixed(6))
}

function createTaskValueBaseline() {
  return {
    bestRequestUnits: null,
    bestDurationMs: null,
    bestCostUsd: null,
    bestPositiveCostUsd: null
  }
}

function updateTaskValueBaseline(baseline, result) {
  if (result.requestUnits != null && result.requestUnits >= 0) {
    baseline.bestRequestUnits = baseline.bestRequestUnits == null ? result.requestUnits : Math.min(baseline.bestRequestUnits, result.requestUnits)
  }

  if (result.durationMs != null && result.durationMs >= 0) {
    baseline.bestDurationMs = baseline.bestDurationMs == null ? result.durationMs : Math.min(baseline.bestDurationMs, result.durationMs)
  }

  if (result.costUsd != null && result.costUsd >= 0) {
    baseline.bestCostUsd = baseline.bestCostUsd == null ? result.costUsd : Math.min(baseline.bestCostUsd, result.costUsd)
    if (result.costUsd > 0) {
      baseline.bestPositiveCostUsd = baseline.bestPositiveCostUsd == null ? result.costUsd : Math.min(baseline.bestPositiveCostUsd, result.costUsd)
    }
  }

  return baseline
}

function inverseFactor(value, bestValue) {
  if (value == null || bestValue == null) return 0
  if (value === 0 && bestValue === 0) return 1
  if (value <= 0 || bestValue < 0) return 0
  if (bestValue === 0) return 0
  return clamp(bestValue / value, 0, 1)
}

function costFactor(costUsd, baseline) {
  if (costUsd == null || !baseline) return 0
  if (costUsd === 0) return 1
  if ((baseline.bestCostUsd ?? null) === 0) {
    if (baseline.bestPositiveCostUsd == null || costUsd <= 0) return 0
    return clamp(baseline.bestPositiveCostUsd / costUsd, 0, 1)
  }
  return inverseFactor(costUsd, baseline.bestCostUsd)
}

export function computeCompositeValueScore({ requestUnits, costUsd, durationMs, baseline, weights = { orpt: 0.45, cost: 0.35, time: 0.2 } }) {
  if (!baseline) {
    return {
      valueScore: 0,
      components: {
        orptFactor: 0,
        costFactor: 0,
        timeFactor: 0
      }
    }
  }

  const orptComponent = inverseFactor(requestUnits, baseline.bestRequestUnits)
  const costComponent = costFactor(costUsd, baseline)
  const timeComponent = inverseFactor(durationMs, baseline.bestDurationMs)

  const score = Math.pow(orptComponent, weights.orpt) * Math.pow(costComponent, weights.cost) * Math.pow(timeComponent, weights.time)
  return {
    valueScore: Number(clamp(score, 0, 1).toFixed(6)),
    components: {
      orptFactor: Number(orptComponent.toFixed(6)),
      costFactor: Number(costComponent.toFixed(6)),
      timeFactor: Number(timeComponent.toFixed(6))
    }
  }
}

function buildSyntheticFailureResults({ runID, modelName, provider, entries, reason, durationMs }) {
  const results = []
  for (const { task, repeat } of entries) {
    results.push({
      runId: runID,
      repeat,
      taskId: task.id,
      taskName: task.name,
      category: task.category,
      model: modelName,
      provider,
      sessionId: null,
      success: false,
      score: 0,
      durationMs,
      startedAt: nowIso(),
      completedAt: nowIso(),
      steps: 0,
      requestCount: 0,
      tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
      costUsd: 0,
      toolInvocations: {},
      filesChanged: 0,
      diff: [],
      requestUnits: 0,
      requestAccountingSource: 'synthetic-timeout',
      dnf: true,
      dnfReason: 'process-timeout',
      proxyRecords: [],
      logExcerpt: [],
      verifier: {
        command: task.verifier,
        code: 124,
        stdout: '',
        stderr: reason
      },
      error: { message: reason, stack: null }
    })
  }
  return results
}

export function collectRemainingTaskEntries(tasks, repeats, startRepeatIndex, startTaskIndex) {
  const entries = []

  for (let repeat = startRepeatIndex; repeat <= repeats; repeat += 1) {
    const fromTaskIndex = repeat === startRepeatIndex ? startTaskIndex : 0
    for (let taskIndex = fromTaskIndex; taskIndex < tasks.length; taskIndex += 1) {
      entries.push({ task: tasks[taskIndex], repeat })
    }
  }

  return entries
}

async function writeChildOutput(run) {
  if (!process.env.BENCHMARK_CHILD_OUTPUT_FILE) return
  await writeJson(process.env.BENCHMARK_CHILD_OUTPUT_FILE, run)
}

async function flushRunProgress(runtime, run, writeArtifacts) {
  aggregateRun(run, runtime.baseConfig.runner.requestExtractors)
  if (writeArtifacts) {
    await writeRunArtifacts(runtime, run)
  }
  await writeChildOutput(run)
}

function createProcessDeadline(processTimeoutMs) {
  if (!(processTimeoutMs > 0)) return null
  return Date.now() + processTimeoutMs
}

function computeTaskTimeoutMs(runtime, task, processDeadlineAt) {
  const taskLimitMs = (task.timeoutSeconds || 300) * 1000
  if (!processDeadlineAt) return taskLimitMs

  const remainingMs = processDeadlineAt - Date.now()
  if (remainingMs <= 0) return 1
  return Math.max(1, Math.min(taskLimitMs, remainingMs))
}

function isTaskTimeoutError(error) {
  const message = error?.message || ''
  return /Timed out after \d+ms|Task exceeded \d+s hard timeout/i.test(message)
}

export function isProviderLimitedFailure({ verifier, error, proxyRecords }) {
  const message = `${error?.message || ''} ${verifier?.stderr || ''}`
  return /OpenCode API .* failed with 429|too_many_requests/i.test(message) || (proxyRecords || []).some((record) => record.status === 429)
}

export function summarizeFailureOutcome({ verifier, error, proxyRecords = [], logExcerpt = [] }) {
  const combinedMessage = [
    error?.message || '',
    verifier?.stderr || '',
    verifier?.stdout || '',
    ...(logExcerpt || [])
  ].filter(Boolean).join(' ')
  const proxyStatus = proxyRecords.find((record) => Number.isFinite(record?.status))?.status ?? null
  const suggestionMatch = combinedMessage.match(/"suggestions":\["([^"]+)"\]/)
  const suggestedModel = suggestionMatch?.[1] || null

  if (isProviderLimitedFailure({ verifier, error, proxyRecords })) {
    return {
      outcomeLabel: 'provider-limited',
      proxyStatus,
      suggestedModel: null
    }
  }

  if (/ProviderModelNotFoundError/i.test(combinedMessage)) {
    return {
      outcomeLabel: 'provider-model-not-found',
      proxyStatus,
      suggestedModel
    }
  }

  if (proxyStatus != null && proxyStatus >= 400) {
    return {
      outcomeLabel: 'provider-http-error',
      proxyStatus,
      suggestedModel: null
    }
  }

  return null
}

export function runContainsSyntheticTimeoutRows(run) {
  return (run?.results || []).some((entry) => entry?.requestAccountingSource === 'synthetic-timeout' || entry?.dnfReason === 'process-timeout')
}

export function shouldWriteLatestRunArtifact(run) {
  if (!runContainsSyntheticTimeoutRows(run)) return true
  return run?.run?.benchmarkCycle === 'candidate_smoke'
}

async function runCommand(command, args, options = {}) {
  return await new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env,
      stdio: ['ignore', 'pipe', 'pipe']
    })

    let timedOut = false
    let timer = null
    if (options.timeoutMs && options.timeoutMs > 0) {
      timer = setTimeout(() => {
        timedOut = true
        child.kill('SIGTERM')
        setTimeout(() => {
          if (child.exitCode == null) child.kill('SIGKILL')
        }, 3000)
      }, options.timeoutMs)
    }

    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString()
    })
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
    })
    child.on('exit', (code) => {
      if (timer) clearTimeout(timer)
      resolve({ code: code ?? 1, stdout, stderr, timedOut })
    })
  })
}

function isVerifierDependencyFailure(result) {
  const combined = `${result?.stderr || ''}\n${result?.stdout || ''}`
  return /ModuleNotFoundError|ImportError|No module named|FileNotFoundError: \[Errno 2\] No such file or directory|command not found|can't open file/i.test(combined)
}

export function aggregateRun(run, extractors) {
  const byModel = new Map()
  const byTaskAndModel = new Map()
  const modelCatalog = new Map((run.modelCatalog?.models || []).map((entry) => [entry.model, entry]))
  const taskCatalog = new Map((run.taskCatalog || []).map((task) => [task.id, task]))
  const taskValueBaselines = new Map()

  function evaluateTaskComparability(modelName, taskId) {
    const catalogEntry = modelCatalog.get(modelName)
    const task = taskCatalog.get(taskId)
    const requiredCapabilities = task?.requiredCapabilities || []
    const unsupported = []

    for (const capability of requiredCapabilities) {
      const support = catalogEntry?.featureSupport?.[capability] || 'unknown'
      if (support === 'limited' || support === 'unsupported') {
        unsupported.push({ capability, support })
      }
    }

    const comparable = unsupported.length === 0
    const comparabilityNote = unsupported.length
      ? unsupported.map(({ capability, support }) => `${capability}: ${support}`).join(', ')
      : null

    return {
      comparable,
      comparabilityNote,
      requiredCapabilities,
      unsupportedCapabilities: unsupported
    }
  }

  for (const result of run.results) {
    if (!byModel.has(result.model)) byModel.set(result.model, [])
    byModel.get(result.model).push(result)

    const taskKey = `${result.taskId}::${result.model}`
    if (!byTaskAndModel.has(taskKey)) byTaskAndModel.set(taskKey, [])
    byTaskAndModel.get(taskKey).push(result)

    const comparability = evaluateTaskComparability(result.model, result.taskId)
    if (comparability.comparable && result.success && result.requestUnits != null) {
      const baseline = taskValueBaselines.get(result.taskId) || createTaskValueBaseline()
      taskValueBaselines.set(result.taskId, updateTaskValueBaseline(baseline, result))
    }
  }

  for (const result of run.results) {
    const comparability = evaluateTaskComparability(result.model, result.taskId)
    const composite = comparability.comparable && result.success && result.requestUnits != null
      ? computeCompositeValueScore({
        requestUnits: result.requestUnits,
        costUsd: result.costUsd,
        durationMs: result.durationMs,
        baseline: taskValueBaselines.get(result.taskId) || null,
        weights: run.scoring?.valueScoreWeights
      })
      : {
        valueScore: 0,
        components: {
          orptFactor: 0,
          costFactor: 0,
          timeFactor: 0
        }
      }
    result.valueScore = composite.valueScore
    result.valueScoreComponents = composite.components
    const compositeWeights = run.scoring?.compositeScoreWeights || { score: 0.7, valueScore: 0.3 }
    result.compositeScore = computeCompositeScore(result.score, result.valueScore, compositeWeights)
  }

  run.modelSummary = [...byModel.entries()]
    .map(([model, entries]) => {
      const successful = entries.filter((entry) => entry.success)
      const dnfEntries = entries.filter((entry) => entry.dnf)
      const providerLimitedEntries = entries.filter((entry) => entry.providerLimited)
      const eligible = successful.every((entry) => entry.requestUnits != null) && successful.length > 0
      const requestUnits = successful.map((entry) => entry.requestUnits).filter((value) => value != null)
      const allRequestUnits = entries.map((entry) => entry.requestUnits).filter((value) => value != null)
      const catalogEntry = modelCatalog.get(model)
      const modelTaskChecks = entries.map((entry) => evaluateTaskComparability(model, entry.taskId))
      const comparable = modelTaskChecks.every((entry) => entry.comparable)
      const notes = [...new Set(modelTaskChecks.map((entry) => entry.comparabilityNote).filter(Boolean))]
      return {
        model,
        provider: entries[0]?.provider || model.split('/')[0],
        runs: entries.length,
        successfulTasks: successful.length,
        failedTasks: entries.length - successful.length,
        dnfTasks: dnfEntries.length,
        providerLimited: providerLimitedEntries.length > 0,
        successRate: entries.length ? successful.length / entries.length : 0,
        score: average(entries.map((entry) => entry.score)) || 0,
        valueScore: average(entries.map((entry) => entry.valueScore ?? 0)) || 0,
        compositeScore: average(entries.map((entry) => entry.compositeScore ?? 0)) || 0,
        orpt: eligible ? sum(requestUnits) / successful.length : null,
        totalRequestCount: allRequestUnits.length ? sum(allRequestUnits) : 0,
        totalRequestUnits: allRequestUnits.length ? sum(allRequestUnits) : null,
        totalWallTimeMs: sum(entries.map((entry) => entry.durationMs)),
        totalCostUsd: sumDefined(entries.map((entry) => entry.costUsd)),
        averageDurationMs: average(successful.map((entry) => entry.durationMs)) || 0,
        medianSteps: medianNumber(successful.map((entry) => entry.steps)),
        averageCostUsd: average(successful.map((entry) => entry.costUsd).filter((value) => Number.isFinite(value))) || null,
        eligible,
        comparable,
        comparabilityNote: notes.join('; ') || null,
        unattendedBenchmarkRuns: catalogEntry?.featureSupport?.unattendedBenchmarkRuns || 'unknown',
        requiredCapabilities: [...new Set(modelTaskChecks.flatMap((entry) => entry.requiredCapabilities))],
        unsupportedCapabilities: modelTaskChecks.flatMap((entry) => entry.unsupportedCapabilities),
        knownLimitations: catalogEntry?.featureSupport?.knownLimitations || [],
        requestAccountingSource: eligible ? [...new Set(successful.map((entry) => entry.requestAccountingSource))].join(', ') : null
      }
    })
    .sort((a, b) => {
      if (a.comparable && b.comparable) return b.compositeScore - a.compositeScore || (a.orpt ?? Infinity) - (b.orpt ?? Infinity)
      if (a.comparable) return -1
      if (b.comparable) return 1
      if (a.eligible && b.eligible) return b.compositeScore - a.compositeScore || (a.orpt ?? Infinity) - (b.orpt ?? Infinity)
      if (a.eligible) return -1
      if (b.eligible) return 1
      return b.successRate - a.successRate
    })

  run.leaderboard = run.modelSummary

  run.taskSummary = [...byTaskAndModel.values()]
    .map((entries) => {
      const sample = entries[0]
      const successful = entries.filter((entry) => entry.success)
      const dnfEntries = entries.filter((entry) => entry.dnf)
      const providerLimitedEntries = entries.filter((entry) => entry.providerLimited)
      const requestUnits = entries.map((entry) => entry.requestUnits).filter((value) => value != null)
      const catalogEntry = modelCatalog.get(sample.model)
      const eligible = successful.length > 0 && successful.every((entry) => entry.requestUnits != null)
      const comparability = evaluateTaskComparability(sample.model, sample.taskId)
      return {
        taskId: sample.taskId,
        taskName: sample.taskName,
        category: sample.category,
        model: sample.model,
        provider: sample.provider,
        runs: entries.length,
        successes: successful.length,
        failures: entries.length - successful.length,
        dnfs: dnfEntries.length,
        providerLimited: providerLimitedEntries.length > 0,
        score: average(entries.map((entry) => entry.score)) || 0,
        valueScore: average(entries.map((entry) => entry.valueScore ?? 0)) || 0,
        compositeScore: average(entries.map((entry) => entry.compositeScore ?? 0)) || 0,
        successRate: entries.length ? successful.length / entries.length : 0,
        totalRequestCount: requestUnits.length ? sum(requestUnits) : 0,
        totalRequestUnits: requestUnits.length ? sum(requestUnits) : null,
        averageRequestUnits: requestUnits.length ? average(requestUnits) : null,
        totalWallTimeMs: sum(entries.map((entry) => entry.durationMs)),
        averageWallTimeMs: average(entries.map((entry) => entry.durationMs)) || 0,
        totalCostUsd: sumDefined(entries.map((entry) => entry.costUsd)),
        averageCostUsd: average(entries.map((entry) => entry.costUsd).filter((value) => Number.isFinite(value))) || null,
        averageSteps: average(entries.map((entry) => entry.steps)) || 0,
        eligible,
        comparable: comparability.comparable,
        comparabilityNote: comparability.comparabilityNote,
        unattendedBenchmarkRuns: catalogEntry?.featureSupport?.unattendedBenchmarkRuns || 'unknown',
        requiredCapabilities: comparability.requiredCapabilities,
        unsupportedCapabilities: comparability.unsupportedCapabilities,
        knownLimitations: catalogEntry?.featureSupport?.knownLimitations || [],
        requestAccountingSource: requestUnits.length ? [...new Set(entries.map((entry) => entry.requestAccountingSource).filter(Boolean))].join(', ') || null : null
      }
    })
    .sort((a, b) => a.taskId.localeCompare(b.taskId) || b.score - a.score || a.model.localeCompare(b.model))

  run.requestExtractors = extractors
  return run
}

function medianNumber(values) {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle]
}

function sumDefined(values) {
  const filtered = values.filter((value) => Number.isFinite(value))
  if (!filtered.length) return null
  return sum(filtered)
}

async function prepareRunTaskDir(runtime, runID, task, model, repeatIndex) {
  const runTaskDir = path.join(runtime.sandboxDir, 'runs', runID, task.id, `${slugify(model.providerID)}-${slugify(model.modelID)}`, `repeat-${repeatIndex}`)
  await copyDir(task.taskDir, runTaskDir)
  return {
    runTaskDir,
    workspaceDir: path.join(runTaskDir, 'workspace')
  }
}

async function executeTask({ runtime, task, model, repeatIndex, runID, server, proxy, taskTimeoutMs, preparedDirs = null }) {
  const { runTaskDir, workspaceDir } = preparedDirs || await prepareRunTaskDir(runtime, runID, task, model, repeatIndex)
  const startedAt = nowIso()
  const startedMs = Date.now()
  const logCursor = server.logCursor()
  proxy.reset()

  let sessionID = null
  let promptPayload = null
  let verifier = { code: 1, stdout: '', stderr: '' }
  let error = null
  let diff = []
  let dnf = false
  let dnfReason = null
  let sessionExportError = null
  let sessionDbError = null
  let sessionCostSource = null

  try {
    const session = await server.createSession(workspaceDir, `${task.id}:${model.providerID}/${model.modelID}`)
    sessionID = session.id
    promptPayload = await server.promptSession({
      directory: workspaceDir,
      sessionID,
      prompt: task.prompt,
      taskTimeoutMs,
      agent: runtime.agent,
      model
    })
    try {
      const sessionMessages = await server.sessionMessagesFromDb({ sessionID, timeoutMs: taskTimeoutMs })
      if (sessionMessages.length) {
        promptPayload = { ...promptPayload, sessionMessages }
        sessionCostSource = 'session-db-cost'
      }
    } catch (caught) {
      sessionDbError = caught.message
    }
    try {
      if (!promptPayload?.sessionMessages?.length) {
        const sessionExport = await server.exportSession({ sessionID, timeoutMs: taskTimeoutMs })
        promptPayload = { ...promptPayload, sessionExport }
        sessionCostSource = 'session-export-cost'
      }
    } catch (caught) {
      sessionExportError = caught.message
    }
    diff = await server.sessionDiff({ directory: workspaceDir, sessionID })
    verifier = await runCommand('python3', [path.join(runTaskDir, 'verify.py')], { cwd: runTaskDir, env: process.env })
  } catch (caught) {
    error = caught
    if (isTaskTimeoutError(caught)) {
      dnf = true
      dnfReason = 'task-timeout'
      verifier = {
        code: 124,
        stdout: '',
        stderr: `Task exceeded ${Math.round(taskTimeoutMs / 1000)}s hard timeout`
      }
    }
  }

  const completedAt = nowIso()
  const durationMs = Date.now() - startedMs
  const logLines = server.sliceLogs(logCursor)
  const proxyRecords = proxy.records()
  const requestSummary = extractRequestUnits({
    proxyRecords,
    logLines,
    extractors: runtime.baseConfig.runner.requestExtractors
  })
  const messageInfo = promptPayload?.info || {
    cost: null,
    tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } }
  }
  const messageSummary = promptPayload?.sessionMessages?.length
    ? summarizeSessionMessages(promptPayload.sessionMessages, logLines)
    : promptPayload?.sessionExport?.messages?.length
    ? summarizeSessionMessages(promptPayload.sessionExport.messages, logLines)
    : summarizeMessage(messageInfo, promptPayload?.parts || [], logLines)
  const benchmarkCost = resolveBenchmarkCost({
    modelName: `${model.providerID}/${model.modelID}`,
    provider: model.providerID,
    messageSummary,
    sessionCostSource,
    sessionExportError,
    sessionDbError
  })
  const providerLimited = isProviderLimitedFailure({ verifier, error, proxyRecords })
  const failureSummary = !(!error && verifier.code === 0)
    ? summarizeFailureOutcome({ verifier, error, proxyRecords, logExcerpt: logLines.slice(-50) })
    : null

  return {
    runId: runID,
    repeat: repeatIndex,
    taskId: task.id,
    taskName: task.name,
    category: task.category,
    model: `${model.providerID}/${model.modelID}`,
    provider: model.providerID,
    sessionId: sessionID,
    success: !error && verifier.code === 0,
    score: !error && verifier.code === 0 ? 1 : 0,
    durationMs,
    startedAt,
    completedAt,
    steps: messageSummary.steps,
    requestCount: proxyRecords.length,
    tokens: messageSummary.tokens,
    costUsd: benchmarkCost.costUsd,
    costAccountingSource: benchmarkCost.costAccountingSource,
    costAccountingNotes: benchmarkCost.costAccountingNotes,
    costAccountingUrl: benchmarkCost.costAccountingUrl,
    toolInvocations: messageSummary.toolInvocations,
    filesChanged: Array.isArray(diff) ? diff.length : 0,
    diff,
    requestUnits: requestSummary.requestUnits,
    requestAccountingSource: requestSummary.source,
    dnf,
    dnfReason,
    providerLimited,
    failureSummary,
    proxyRecords,
    logExcerpt: logLines.slice(-50),
    verifier: {
      command: task.verifier,
      code: verifier.code,
      stdout: verifier.stdout,
      stderr: verifier.stderr
    },
    error: error ? { message: error.message, stack: error.stack } : null
  }
}

async function restartOpenCodeServerForWorkspace({ runtime, model, proxy, workspaceDir }) {
  return await startOpenCodeServer({ runtime, model, proxy, workingDirectory: workspaceDir })
}

async function writeRunArtifacts(runtime, run) {
  const latestFile = path.join(runtime.rootDir, runtime.baseConfig.results.latestFile)
  const historyFile = path.join(runtime.rootDir, runtime.baseConfig.results.historyDir, `${run.run.id}.json`)
  await writeJson(historyFile, run)

  if (shouldWriteLatestRunArtifact(run)) {
    await writeJson(latestFile, run)
  }
}

export async function runBenchmarkSingle(runtime, modelsOverride = null, runIDOverride = null, writeArtifacts = true) {
  const models = modelsOverride || runtime.models
  if (!models.length) {
    throw new Error('No models configured. Set BENCHMARK_MODELS or benchmark.config.json models.')
  }
  const tasks = await loadTasks(runtime)
  const runID = runIDOverride || new Date().toISOString().replace(/[:.]/g, '-')
  const run = {
    run: {
      id: runID,
      startedAt: nowIso(),
      completedAt: null,
      benchmarkCycle: runtime.benchmarkCycle || null,
      models,
      taskCount: tasks.length,
      taskPatterns: runtime.taskPatterns,
      repeats: runtime.repeats,
      taskTimeoutSeconds: runtime.taskTimeoutSeconds,
      processTimeoutSeconds: runtime.processTimeoutSeconds,
      derivedRunTimeoutSeconds: runtime.derivedRunTimeoutSeconds
    },
    results: [],
    leaderboard: [],
    modelCatalog: await readJson(path.join(runtime.rootDir, 'models/catalog.json')).catch(() => ({ models: [] })),
    taskCatalog: tasks.map((task) => ({ id: task.id, name: task.name, difficulty: task.difficulty || 'medium', timeoutSeconds: task.timeoutSeconds, requiredCapabilities: task.requiredCapabilities || [] })),
    scoring: runtime.scoring
  }

  await ensureDir(runtime.tmpDir)
  const proxy = await startRecordingProxy(runtime.proxy)
  const processDeadlineAt = createProcessDeadline(runtime.processTimeoutMs)

  let runError = null

  try {
    for (const modelName of models) {
      const model = parseModel(modelName)
      console.log(`START model ${model.providerID}/${model.modelID}`)
      let server = null

      try {
        for (let repeatIndex = 1; repeatIndex <= runtime.repeats; repeatIndex += 1) {
          for (let taskIndex = 0; taskIndex < tasks.length; taskIndex += 1) {
            const task = tasks[taskIndex]
            const taskTimeoutMs = computeTaskTimeoutMs(runtime, task, processDeadlineAt)
            const preparedDirs = await prepareRunTaskDir(runtime, runID, task, model, repeatIndex)
            const { workspaceDir } = preparedDirs

            if (server) {
              await server.close()
            }
            server = await restartOpenCodeServerForWorkspace({ runtime, model, proxy, workspaceDir })

            const result = await executeTask({ runtime, task, model, repeatIndex, runID, server, proxy, taskTimeoutMs, preparedDirs })
            run.results.push(result)
            await flushRunProgress(runtime, run, writeArtifacts)
            console.log(`${result.success ? 'PASS' : result.dnf ? 'DNF' : 'FAIL'} ${result.taskId} ${result.model} steps=${result.steps} requestUnits=${result.requestUnits ?? 'n/a'}`)

            if (result.dnf) {
              await server.close()
              server = null
            }
          }
        }
      } finally {
        console.log(`STOP model ${model.providerID}/${model.modelID}`)
        if (server) {
          await server.close()
        }
        await flushRunProgress(runtime, run, writeArtifacts)
      }
    }
  } catch (error) {
    runError = error
  } finally {
    await proxy.close()
    run.run.completedAt = nowIso()
    await flushRunProgress(runtime, run, writeArtifacts)
  }

  if (runError) {
    throw runError
  }

  return run
}

export async function runBenchmark(runtime) {
  const tasks = await loadTasks(runtime)

  if (runtime.models.length <= 1) {
    return await runBenchmarkSingle(runtime)
  }

  const runID = new Date().toISOString().replace(/[:.]/g, '-')
  const combined = {
    run: {
      id: runID,
      startedAt: nowIso(),
      completedAt: null,
      benchmarkCycle: runtime.benchmarkCycle || null,
      models: runtime.models,
      taskCount: tasks.length,
      taskPatterns: runtime.taskPatterns,
      repeats: runtime.repeats,
      taskTimeoutSeconds: runtime.taskTimeoutSeconds,
      processTimeoutSeconds: runtime.processTimeoutSeconds,
      derivedRunTimeoutSeconds: runtime.derivedRunTimeoutSeconds
    },
    results: [],
    leaderboard: [],
    modelSummary: [],
    taskSummary: [],
    modelCatalog: await readJson(path.join(runtime.rootDir, 'models/catalog.json')).catch(() => ({ models: [] })),
    taskCatalog: tasks.map((task) => ({ id: task.id, name: task.name, difficulty: task.difficulty || 'medium', timeoutSeconds: task.timeoutSeconds, requiredCapabilities: task.requiredCapabilities || [] })),
    scoring: runtime.scoring
  }

  await ensureDir(path.join(runtime.tmpDir, 'child-runs'))
  const childRunDir = path.join(runtime.tmpDir, 'child-runs', runID)
  await ensureDir(childRunDir)

  const childTimeoutMs = runtime.processTimeoutMs > 0 ? runtime.processTimeoutMs : 0
  const remainingModels = [...runtime.models]
  const childResults = []

  async function runChild(model, childIndex) {
    const outputFile = path.join(childRunDir, `${slugify(model)}.json`)
    const proxyListenPort = (runtime.proxy?.listenPort || 18080) + childIndex + 1
    const child = await runCommand('node', ['scripts/cli.js', 'benchmark-single'], {
      cwd: runtime.rootDir,
      env: {
        ...process.env,
        BENCHMARK_MODELS: model,
        BENCHMARK_CHILD_OUTPUT_FILE: outputFile,
        BENCHMARK_PARENT_RUN_ID: runID,
        BENCHMARK_PROXY_LISTEN_PORT: String(proxyListenPort)
      },
      timeoutMs: childTimeoutMs
    })

    let childRun = null
    if (await exists(outputFile)) {
      childRun = await readJson(outputFile)
      if (childRun?.run?.id !== runID) {
        childRun = null
      }
    }

    return { model, child, childRun }
  }

  while (remainingModels.length) {
    const batch = remainingModels.splice(0, runtime.modelConcurrency)
    const batchStartIndex = childResults.length
    const settled = await Promise.all(batch.map((model, index) => runChild(model, batchStartIndex + index)))
    childResults.push(...settled)
  }

  let childFailure = null
  for (const { model, child, childRun } of childResults) {
    if (childRun) {
      combined.results.push(...(childRun.results || []))
      aggregateRun(combined, runtime.baseConfig.runner.requestExtractors)
      await writeRunArtifacts(runtime, combined)
    }

    if (child.timedOut) {
      const seenTaskKeys = new Set((childRun?.results || []).map((entry) => `${entry.repeat}:${entry.taskId}`))
      const missingEntries = []
      for (let repeat = 1; repeat <= runtime.repeats; repeat += 1) {
        for (const task of tasks) {
          if (!seenTaskKeys.has(`${repeat}:${task.id}`)) {
            missingEntries.push({ task, repeat })
          }
        }
      }
      const synthetic = buildSyntheticFailureResults({
        runID,
        modelName: model,
        provider: model.split('/')[0],
        entries: missingEntries,
        reason: `Model run timed out after ${Math.round(childTimeoutMs / 1000)}s`,
        durationMs: runtime.processTimeoutMs > 0 ? runtime.processTimeoutMs : 0
      })
      combined.results.push(...synthetic)
      aggregateRun(combined, runtime.baseConfig.runner.requestExtractors)
      await writeRunArtifacts(runtime, combined)
      if (child.stderr || child.stdout) {
        console.error((child.stderr || child.stdout).trim())
      }
      continue
    }

    if (child.code !== 0 && !childFailure) {
      childFailure = new Error(child.stderr || child.stdout || `Child benchmark failed for ${model}`)
    }
  }

  combined.run.completedAt = nowIso()
  aggregateRun(combined, runtime.baseConfig.runner.requestExtractors)
  await writeRunArtifacts(runtime, combined)
  if (childFailure) {
    throw childFailure
  }
  return combined
}

export async function validateWorkspace(runtime) {
  const tasks = await loadTasks(runtime)
  const validationRoot = path.join(runtime.tmpDir, 'validation-fixtures')
  await ensureDir(validationRoot)

  for (const task of tasks) {
    const taskCopyDir = path.join(validationRoot, path.basename(task.taskDir))
    await copyDir(task.taskDir, taskCopyDir)
    const result = await runCommand('python3', [path.join(taskCopyDir, 'verify.py')], { cwd: taskCopyDir, env: process.env })
    if (isVerifierDependencyFailure(result)) {
      throw new Error(`Task ${task.id} verifier failed due to missing dependency or setup error during validation:\n${(result.stderr || result.stdout).trim()}`)
    }
    if (result.code === 0) {
      throw new Error(`Task fixture ${task.id} already passes verifier; benchmark fixtures must start broken.`)
    }
  }

  const schema = await readJson(path.join(runtime.rootDir, 'docs/result-schema.json'))
  const resultsFile = path.join(runtime.rootDir, runtime.baseConfig.results.latestFile)
  if (await exists(resultsFile)) {
    const payload = await readJson(resultsFile)
    const ajv = new Ajv2020({ allErrors: true })
    addFormats(ajv)
    const validate = ajv.compile(schema)
    if (!validate(payload)) {
      throw new Error(`results/latest.json failed schema validation: ${ajv.errorsText(validate.errors)}`)
    }
  }

  await writeText(path.join(runtime.tmpDir, 'validation.ok'), 'ok\n')
  console.log('Validation passed')
}
