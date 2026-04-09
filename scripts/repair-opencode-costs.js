import path from 'node:path'

import { aggregateRun, computeOpenCodeZenCostUsd } from './lib/benchmark.js'
import { readJson, writeJson } from './lib/fs.js'

const EXACT_RUN_TOTALS = {
  '2026-04-09T14-34-38-436Z': {
    totalUsd: 53.17,
    label: 'monthly canonical run',
    source: 'user-provided exact billed total'
  }
}

const GPT_5_4_MINI_UPLIFT_EVIDENCE = {
  benchmarkRunId: '2026-04-09T03-57-54-365Z',
  accessibleSessionCount: 22,
  totalUpliftRatio: 11.090303,
  medianUpliftRatio: 11.6715,
  notes: 'Derived from accessible OpenCode gpt-5.4-mini benchmark session exports by summing all assistant message costs versus the final assistant message cost only.'
}

function buildAnchoredRepairNote(exactRunTotal) {
  return `Historical OpenCode repair anchored to exact ${exactRunTotal.label} total $${exactRunTotal.totalUsd.toFixed(2)} (${exactRunTotal.source}). Preserved reconstructed task costs where present, imputed prior zero-cost rows from the same model's average reconstructed cost per recorded request, then scaled the run so the total matches the exact billed total. Empirical multi-turn uplift evidence came from accessible gpt-5.4-mini benchmark session exports (22 sessions, total uplift 11.090303x, median uplift 11.6715x).`
}

function roundUsd(value) {
  return Number(value.toFixed(8))
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0)
}

function buildModelRepairStats(results) {
  const byModel = new Map()

  for (const result of results || []) {
    if (result.provider !== 'opencode') continue
    const current = byModel.get(result.model) || {
      nonzeroRequestCount: 0,
      requestCount: 0,
      reconstructedCostUsd: 0
    }
    const requestCount = Number(result.requestCount) || 0
    const costUsd = Number(result.costUsd) || 0
    current.requestCount += requestCount
    if (costUsd > 0) {
      current.nonzeroRequestCount += requestCount
      current.reconstructedCostUsd += costUsd
    }
    byModel.set(result.model, current)
  }

  const global = [...byModel.values()].reduce((acc, stats) => {
    acc.nonzeroRequestCount += stats.nonzeroRequestCount
    acc.reconstructedCostUsd += stats.reconstructedCostUsd
    return acc
  }, { nonzeroRequestCount: 0, reconstructedCostUsd: 0 })

  for (const stats of byModel.values()) {
    stats.avgCostPerNonzeroRequestUsd = stats.nonzeroRequestCount > 0
      ? stats.reconstructedCostUsd / stats.nonzeroRequestCount
      : null
  }

  global.avgCostPerNonzeroRequestUsd = global.nonzeroRequestCount > 0
    ? global.reconstructedCostUsd / global.nonzeroRequestCount
    : 0

  return { byModel, global }
}

function repairAnchoredHistoricalRun(run, exactRunTotal) {
  const repairStats = buildModelRepairStats(run.results)
  const repairedRows = []

  for (const result of run.results || []) {
    if (result.provider !== 'opencode') continue
    const modelStats = repairStats.byModel.get(result.model) || {}
    const requestCount = Number(result.requestCount) || 0
    const recordedCostUsd = Number(result.costUsd) || 0
    let inferredCostUsd = recordedCostUsd

    if (!(inferredCostUsd > 0) && requestCount > 0) {
      const avgCostPerRequestUsd = modelStats.avgCostPerNonzeroRequestUsd ?? repairStats.global.avgCostPerNonzeroRequestUsd
      inferredCostUsd = avgCostPerRequestUsd > 0 ? avgCostPerRequestUsd * requestCount : 0
    }

    repairedRows.push({ result, inferredCostUsd })
  }

  const inferredRunTotalUsd = sum(repairedRows.map((row) => row.inferredCostUsd))
  if (!(inferredRunTotalUsd > 0)) return 0

  const scale = exactRunTotal.totalUsd / inferredRunTotalUsd
  const repairedNote = buildAnchoredRepairNote(exactRunTotal)

  let changed = 0
  let assignedTotalUsd = 0
  const lastIndex = repairedRows.length - 1
  for (const [index, row] of repairedRows.entries()) {
    const repairedCostUsd = index === lastIndex
      ? roundUsd(exactRunTotal.totalUsd - assignedTotalUsd)
      : roundUsd(row.inferredCostUsd * scale)
    assignedTotalUsd += repairedCostUsd

    if (
      row.result.costUsd !== repairedCostUsd ||
      row.result.costAccountingSource !== 'historical-run-total-anchor-imputed-requests' ||
      row.result.costAccountingNotes !== repairedNote ||
      row.result.costAccountingUrl !== null
    ) {
      row.result.costUsd = repairedCostUsd
      row.result.costAccountingSource = 'historical-run-total-anchor-imputed-requests'
      row.result.costAccountingNotes = repairedNote
      row.result.costAccountingUrl = null
      changed += 1
    }
  }

  run.run.costRepairAppliedAt = new Date().toISOString()
  run.run.costRepairStrategy = 'historical-run-total-anchor-imputed-requests'
  run.run.costRepairNotes = repairedNote
  run.run.costRepairExactRunTotalUsd = exactRunTotal.totalUsd
  run.run.costRepairInferenceEvidence = GPT_5_4_MINI_UPLIFT_EVIDENCE
  return changed
}

function repairRunCosts(run) {
  const exactRunTotal = EXACT_RUN_TOTALS[run?.run?.id]
  if (exactRunTotal) {
    return repairAnchoredHistoricalRun(run, exactRunTotal)
  }

  let changed = 0
  for (const result of run.results || []) {
    if (result.provider !== 'opencode') continue
    const repaired = computeOpenCodeZenCostUsd(result.model, result.tokens)
    if (repaired == null) continue
    if (result.costUsd !== repaired || result.costAccountingSource !== 'zen-io-token-reconstruction') {
      result.costUsd = repaired
      result.costAccountingSource = 'zen-io-token-reconstruction'
      result.costAccountingNotes = 'Computed from official OpenCode Zen input/output rates using recorded prompt-side and completion-side token counts.'
      result.costAccountingUrl = 'https://opencode.ai/docs/zen/#pricing'
      changed += 1
    }
  }
  return changed
}

function normalizeRunRepairMetadata(run) {
  const exactRunTotal = EXACT_RUN_TOTALS[run?.run?.id]
  if (exactRunTotal) {
    const repairedNote = buildAnchoredRepairNote(exactRunTotal)
    const needsUpdate = run.run?.costRepairStrategy !== 'historical-run-total-anchor-imputed-requests' ||
      run.run?.costRepairNotes !== repairedNote ||
      run.run?.costRepairExactRunTotalUsd !== exactRunTotal.totalUsd ||
      JSON.stringify(run.run?.costRepairInferenceEvidence || null) !== JSON.stringify(GPT_5_4_MINI_UPLIFT_EVIDENCE)
    if (!needsUpdate) return false

    run.run.costRepairAppliedAt = new Date().toISOString()
    run.run.costRepairStrategy = 'historical-run-total-anchor-imputed-requests'
    run.run.costRepairNotes = repairedNote
    run.run.costRepairExactRunTotalUsd = exactRunTotal.totalUsd
    run.run.costRepairInferenceEvidence = GPT_5_4_MINI_UPLIFT_EVIDENCE
    return true
  }

  const needsUpdate = run.run?.costRepairStrategy !== 'zen-io-token-reconstruction' ||
    run.run?.costRepairNotes !== 'OpenCode provider costs repaired in place from official Zen input/output rates using recorded prompt-side and completion-side token counts.'
  if (!needsUpdate) return false

  run.run.costRepairAppliedAt = new Date().toISOString()
  run.run.costRepairStrategy = 'zen-io-token-reconstruction'
  run.run.costRepairNotes = 'OpenCode provider costs repaired in place from official Zen input/output rates using recorded prompt-side and completion-side token counts.'
  delete run.run.costRepairExactRunTotalUsd
  delete run.run.costRepairInferenceEvidence
  return true
}

async function repairRunFile(filePath) {
  const run = await readJson(filePath)
  const exactRunTotal = EXACT_RUN_TOTALS[run?.run?.id]
  const originalRunMeta = { ...run.run }
  const changed = repairRunCosts(run)
  const metadataChanged = normalizeRunRepairMetadata(run)
  if (!changed && !metadataChanged) {
    return { filePath, changed: 0 }
  }

  const repaired = aggregateRun(run, run.requestExtractors)
  if (exactRunTotal) {
    repaired.run = {
      ...repaired.run,
      costRepairAppliedAt: run.run.costRepairAppliedAt || new Date().toISOString(),
      costRepairStrategy: 'historical-run-total-anchor-imputed-requests',
      costRepairNotes: run.run.costRepairNotes,
      costRepairExactRunTotalUsd: exactRunTotal.totalUsd,
      costRepairInferenceEvidence: GPT_5_4_MINI_UPLIFT_EVIDENCE
    }
  } else {
    repaired.run = {
      ...repaired.run,
      costRepairAppliedAt: run.run.costRepairAppliedAt || originalRunMeta.costRepairAppliedAt || new Date().toISOString(),
      costRepairStrategy: 'zen-io-token-reconstruction',
      costRepairNotes: 'OpenCode provider costs repaired in place from official Zen input/output rates using recorded prompt-side and completion-side token counts.'
    }
    delete repaired.run.costRepairExactRunTotalUsd
    delete repaired.run.costRepairInferenceEvidence
  }
  await writeJson(filePath, repaired)
  return { filePath, changed }
}

async function main() {
  const rootDir = process.cwd()
  const targets = process.argv.slice(2)
  const files = targets.length
    ? targets.map((target) => path.resolve(rootDir, target))
    : [
        path.join(rootDir, 'results', 'latest.json')
      ]

  const results = []
  for (const filePath of files) {
    results.push(await repairRunFile(filePath))
  }

  for (const result of results) {
    console.log(`${result.changed ? 'repaired' : 'skipped'} ${path.relative(rootDir, result.filePath)} (${result.changed} rows)`)
  }
}

main().catch((error) => {
  console.error(error.stack || error.message || String(error))
  process.exitCode = 1
})
