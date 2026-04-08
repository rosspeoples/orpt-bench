import path from 'node:path'

import { aggregateRun } from './benchmark.js'
import { ensureDir, readJson, writeJson, writeText } from './fs.js'

async function loadFullTaskCatalog(rootDir) {
  const tasksDir = path.join(rootDir, 'tasks')
  try {
    const entries = await import('node:fs/promises').then((fs) => fs.readdir(tasksDir, { withFileTypes: true }))
    const tasks = []
    for (const entry of entries.filter((item) => item.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
      try {
        const task = await readJson(path.join(tasksDir, entry.name, 'task.json'))
        tasks.push({ id: task.id, name: task.name, difficulty: task.difficulty || 'medium', timeoutSeconds: task.timeoutSeconds, requiredCapabilities: task.requiredCapabilities || [] })
      } catch {
        continue
      }
    }
    return tasks
  } catch {
    return []
  }
}

function getComparabilityDetails(entry, catalogByModel, taskCatalogById) {
  if (typeof entry.comparable === 'boolean') {
    return {
      comparable: entry.comparable,
      comparabilityNote: entry.comparabilityNote ?? ''
    }
  }

  const catalogEntry = catalogByModel.get(entry.model)
  const taskRequirements = taskCatalogById.get(entry.taskId)?.requiredCapabilities || ['unattendedBenchmarkRuns']
  const unsupported = taskRequirements
    .filter((capability) => {
      const support = catalogEntry?.featureSupport?.[capability] || 'unknown'
      return support === 'limited' || support === 'unsupported'
    })
    .map((capability) => `${capability}: ${catalogEntry?.featureSupport?.[capability] || 'unknown'}`)

  return {
    comparable: unsupported.length === 0,
    comparabilityNote: unsupported.join(', ')
  }
}

function renderModelSummaryTable(summary, catalogByModel, taskCatalogById) {
  const lines = [
    '| Rank | Model | Score | Value Score | Composite Score | Success Rate | DNF | Request Count | ORPT | Total Wall Time (s) | Total Cost (USD) | Eligible | Comparable | Cohort Note |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |'
  ]

  summary.forEach((entry, index) => {
    const comparability = getComparabilityDetails(entry, catalogByModel, taskCatalogById)
    lines.push(
      `| ${index + 1} | ${entry.model} | ${entry.score.toFixed(2)} | ${(entry.valueScore ?? 0).toFixed(3)} | ${(entry.compositeScore ?? 0).toFixed(3)} | ${(entry.successRate * 100).toFixed(0)}% | ${(entry.dnfTasks ?? 0).toFixed(0)} | ${entry.totalRequestCount.toFixed(0)} | ${entry.orpt == null ? 'n/a' : entry.orpt.toFixed(2)} | ${(entry.totalWallTimeMs / 1000).toFixed(1)} | ${entry.totalCostUsd.toFixed(4)} | ${entry.eligible ? 'yes' : 'no'} | ${comparability.comparable ? 'yes' : 'no'} | ${comparability.comparabilityNote} |`
    )
  })

  if (summary.length === 0) {
    lines.push('| - | No runs yet | - | - | - | - | - | - | - | - | - | - | - | - |')
  }

  return lines.join('\n')
}

function renderTaskSummaryTable(summary, catalogByModel, taskCatalogById) {
  const lines = [
    '| Task | Model | Score | Value Score | Composite Score | Success Rate | DNF | Request Count | Avg Requests | Total Wall Time (s) | Total Cost (USD) | Avg Steps | Comparable | Cohort Note |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |'
  ]

  summary.forEach((entry) => {
    const comparability = getComparabilityDetails(entry, catalogByModel, taskCatalogById)
    lines.push(
      `| ${entry.taskId} | ${entry.model} | ${entry.score.toFixed(2)} | ${(entry.valueScore ?? 0).toFixed(3)} | ${(entry.compositeScore ?? 0).toFixed(3)} | ${(entry.successRate * 100).toFixed(0)}% | ${(entry.dnfs ?? 0).toFixed(0)} | ${entry.totalRequestCount.toFixed(0)} | ${entry.averageRequestUnits == null ? 'n/a' : entry.averageRequestUnits.toFixed(2)} | ${(entry.totalWallTimeMs / 1000).toFixed(1)} | ${entry.totalCostUsd.toFixed(4)} | ${entry.averageSteps.toFixed(2)} | ${comparability.comparable ? 'yes' : 'no'} | ${comparability.comparabilityNote} |`
    )
  })

  if (summary.length === 0) {
    lines.push('| No runs yet | - | - | - | - | - | - | - | - | - | - | - | - | - |')
  }

  return lines.join('\n')
}

function renderPricingProvenanceTable(run, catalogByModel) {
  const lines = [
    '| Model | Benchmark Price $/1M | Reference Price $/1M | Price Source | Price Type | Price Confidence | Notes |',
    '| --- | --- | --- | --- | --- | --- | --- |'
  ]

  const models = [...new Set((run.modelSummary || []).map((entry) => entry.model))]
  for (const modelName of models) {
    const model = catalogByModel.get(modelName)
    lines.push(`| ${modelName} | ${model?.benchmark?.blendedPricePer1mTokensUsd ?? 'n/a'} | ${model?.benchmark?.referenceBlendedPricePer1mTokensUsd ?? 'n/a'} | ${model?.benchmark?.source ?? 'n/a'} | ${model?.benchmark?.pricingSourceType ?? 'n/a'} | ${model?.benchmark?.pricingConfidence ?? 'n/a'} | ${model?.benchmark?.pricingNotes ?? ''} |`)
  }

  if (!models.length) {
    lines.push('| No benchmarked models yet | - | - | - | - | - | - |')
  }

  return lines.join('\n')
}

function renderValueScoreComponentsTable(run) {
  const lines = [
    '| Task | Model | Value Score | ORPT Factor | Cost Factor | Time Factor |',
    '| --- | --- | --- | --- | --- | --- |'
  ]

  const successfulComparable = (run.results || []).filter((entry) => entry.success && (entry.valueScore ?? 0) > 0)
  for (const entry of successfulComparable) {
    lines.push(`| ${entry.taskId} | ${entry.model} | ${(entry.valueScore ?? 0).toFixed(3)} | ${(entry.valueScoreComponents?.orptFactor ?? 0).toFixed(3)} | ${(entry.valueScoreComponents?.costFactor ?? 0).toFixed(3)} | ${(entry.valueScoreComponents?.timeFactor ?? 0).toFixed(3)} |`)
  }

  if (!successfulComparable.length) {
    lines.push('| No successful comparable runs yet | - | - | - | - | - |')
  }

  return lines.join('\n')
}

function renderChartHtml({ title, data, layout }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <script src="https://cdn.plot.ly/plotly-2.35.2.min.js"></script>
</head>
<body>
  <div id="chart" style="width:100%;height:90vh"></div>
  <script>
    const data = ${JSON.stringify(data)};
    const layout = ${JSON.stringify(layout)};
    Plotly.newPlot('chart', data, layout, {responsive: true});
  </script>
</body>
</html>
`
}

function buildCapabilityCoverage(run, catalogByModel, taskCatalogById) {
  const tasks = run.taskCatalog || []
  const models = run.modelSummary || []
  const comparableModels = []
  const limitedModels = []
  const exclusions = []

  for (const model of models) {
    const blockedTasks = (run.taskSummary || [])
      .filter((entry) => entry.model === model.model)
      .map((entry) => ({ entry, comparability: getComparabilityDetails(entry, catalogByModel, taskCatalogById) }))
      .filter(({ comparability }) => !comparability.comparable)
      .map(({ entry, comparability }) => `${entry.taskId} (${comparability.comparabilityNote || 'not comparable'})`)

    if (blockedTasks.length) {
      limitedModels.push(model.model)
      exclusions.push(`- ${model.model}: ${blockedTasks.join('; ')}`)
    } else {
      comparableModels.push(model.model)
    }
  }

  const lines = [
    '## Capability Coverage',
    '',
    `- Fully comparable models for the current task set: ${comparableModels.length ? comparableModels.join(', ') : 'none'}`,
    `- Models with limited comparability: ${limitedModels.length ? limitedModels.join(', ') : 'none'}`,
    `- Task set capability requirements: ${tasks.length ? [...new Set(tasks.flatMap((task) => task.requiredCapabilities || []))].join(', ') : 'none declared'}`,
    ''
  ]

  if (exclusions.length) {
    lines.push('Known exclusions by model:', ...exclusions, '')
  }

  return lines.join('\n')
}

function renderCapabilityCoverageTable(run, catalogByModel) {
  const capabilities = [...new Set((run.taskCatalog || []).flatMap((task) => task.requiredCapabilities || []))]
  const models = (run.modelSummary || []).map((entry) => entry.model)
  const lines = [
    '| Capability | Required By Tasks | Supported Models | Limited Models | Unsupported Models | Unknown Models |',
    '| --- | --- | --- | --- | --- | --- |'
  ]

  for (const capability of capabilities) {
    const requiredByTasks = (run.taskCatalog || []).filter((task) => (task.requiredCapabilities || []).includes(capability)).map((task) => task.id)
    const buckets = { supported: [], limited: [], unsupported: [], unknown: [] }

    for (const model of models) {
      const support = catalogByModel.get(model)?.featureSupport?.[capability] || 'unknown'
      if (buckets[support]) buckets[support].push(model)
      else buckets.unknown.push(model)
    }

    lines.push(`| ${capability} | ${requiredByTasks.join(', ') || 'n/a'} | ${buckets.supported.join(', ') || '-'} | ${buckets.limited.join(', ') || '-'} | ${buckets.unsupported.join(', ') || '-'} | ${buckets.unknown.join(', ') || '-'} |`)
  }

  if (!capabilities.length) {
    lines.push('| No required capabilities declared | - | - | - | - | - |')
  }

  return lines.join('\n')
}

function renderTaskRequirementTable(run) {
  const lines = [
    '| Task | Difficulty | Timeout (s) | Required Capabilities |',
    '| --- | --- | --- | --- |'
  ]

  for (const task of run.taskCatalog || []) {
    lines.push(`| ${task.id} | ${task.difficulty || 'medium'} | ${task.timeoutSeconds ?? 'n/a'} | ${(task.requiredCapabilities || []).join(', ') || 'none'} |`)
  }

  if (!(run.taskCatalog || []).length) {
    lines.push('| No tasks recorded | - | - | - |')
  }

  return lines.join('\n')
}

function renderIncludedTasks(run) {
  const tasks = run.taskCatalog || []
  if (!tasks.length) return '1. No tasks recorded'

  return tasks
    .map((task, index) => `${index + 1}. ${task.name} (${task.id}, ${task.difficulty || 'medium'})`)
    .join('\n')
}

function renderReadme(run) {
  const totals = {
    models: new Set((run.results || []).map((entry) => entry.model)).size,
    tasks: new Set((run.results || []).map((entry) => entry.taskId)).size,
    runs: run.results?.length || 0,
    successes: run.results?.filter((entry) => entry.success).length || 0
  }
  const includedTasksList = renderIncludedTasks(run)
  const valueScoreWeights = run.scoring?.valueScoreWeights || { orpt: 0.45, cost: 0.35, time: 0.2 }
  const compositeWeights = run.scoring?.compositeScoreWeights || { score: 0.7, valueScore: 0.3 }
  const tasksByDifficulty = (run.taskCatalog || []).reduce((acc, task) => {
    const difficulty = task.difficulty || 'medium'
    acc[difficulty] = (acc[difficulty] || 0) + 1
    return acc
  }, {})
  const difficultySummary = ['control', 'medium', 'high', 'expert']
    .filter((difficulty) => tasksByDifficulty[difficulty])
    .map((difficulty) => `${difficulty}=${tasksByDifficulty[difficulty]}`)
    .join(', ') || 'none declared'
  const pagesUrl = 'https://rosspeoples.github.io/orpt-bench/'

  return `# ORPT-Bench

OpenCode Agentic Efficiency Benchmark measures how many OpenCode requests a model consumes per successful task on reproducible DevOps and light-coding fixtures.

The suite is intended for senior-level platform and infrastructure repair work. One control task provides a basic sanity check, while the scored benchmark should otherwise skew toward medium/high difficulty and reward models that can sustain real multi-step investigation loops.

Model pricing in this repo is generated for benchmark use during \`sync-models\`. The normalized catalog keeps both the actual listed blended price and, when useful, a clearly labeled reference blended price for free variants derived from a paid sibling or nearby family model.

## Live Results

- Live benchmark site: <${pagesUrl}>
- Latest raw results: \`results/latest.json\`
- Historical raw results: \`results/history/*.json\`

The GitHub Pages publication is the canonical place for dynamic benchmark output:

- chart-first summaries for composite score, success rate, and ORPT
- sortable comparison tables that default to composite score
- links to raw JSON artifacts, the result schema, and deeper docs
- historical snapshot links when archived runs are available

## Scoring

- \`Score\` remains binary correctness: pass = \`1\`, fail = \`0\`
- \`Value Score\` is a secondary efficiency metric computed only from successful comparable runs
- \`Value Score\` combines normalized ORPT, actual observed cost, and wall time using a weighted geometric mean
- Current value weights: ORPT \`${Number(valueScoreWeights.orpt).toFixed(2)}\`, cost \`${Number(valueScoreWeights.cost).toFixed(2)}\`, time \`${Number(valueScoreWeights.time).toFixed(2)}\`
- Failed or non-comparable runs receive \`0.000\`
- \`Composite Score = ${Number(compositeWeights.score).toFixed(2)} * Score + ${Number(compositeWeights.valueScore).toFixed(2)} * Value Score\`
- Comparable rankings sort by \`Composite Score\`, with ORPT used as a tie-breaker

## Benchmark Shape

- The task set is intentionally weighted toward real repair-oriented DevOps work rather than toy prompts
- Capability gating matters: models with benchmark-affecting limitations can be surfaced, but excluded from the primary comparable cohort when appropriate
- Tasks live under \`tasks/*\`, each with its own fixture, prompt, and verifier

Included task areas:

- Kubernetes and GitOps repair
- Terraform and Ansible completion or fixup
- Docker Compose observability repair
- Shell scripting and workspace bundle repair
- Bootstrap sequencing and platform validation

## Included Tasks

- Difficulty mix: ${difficultySummary}

${includedTasksList}

## Quickstart

\`\`\`bash
cp .env.benchmark.example .env.benchmark
# add OPENCODE_API_KEY=... to .env
docker compose build
docker compose run --rm runner sync-models
docker compose run --rm runner validate
docker compose run --rm runner benchmark
\`\`\`

For cheaper development runs, use the generated \`dev\` or \`cheap_headless\` matrix from \`models/MATRICES.md\`.
Use \`docker compose run --rm runner use-matrix dev\` for the smallest proven headless dev cohort, or \`docker compose run --rm runner use-matrix cheap_headless\` when you want a low-cost comparable cohort.

Environment variables:

- \`BENCHMARK_MODELS\`: comma-separated model matrix
- \`BENCHMARK_REPEATS\`: repeat count per task/model
- \`BENCHMARK_TASK_GLOB\`: task subset filter
- \`BENCHMARK_PROCESS_TIMEOUT_SECONDS\`: hard timeout for the benchmark process during development; keep \`0\` for full real benchmark runs
- \`BENCHMARK_WRITE_README\`: write generated README and charts

## Model Inventory

Refresh the available-model list and enrichment data:

\`\`\`bash
docker compose run --rm runner sync-models
\`\`\`

Generated artifacts:

- \`models/catalog.json\`: normalized model inventory with enrichment
- \`models/catalog.openrouter.raw.json\`: raw OpenRouter pricing snapshot used for automatic cost enrichment
- \`models/catalog.latest.raw.json\`: raw OpenCode inventory snapshot
- \`models/catalog.index.json\`: compact matrix-selection and pricing provenance view
- \`models/excluded.json\`: denylist for models that should stay in inventory but out of generated benchmark matrices
- \`models/README.md\`: human-readable model table
- \`models/matrices.json\`: recommended benchmark matrices
- \`models/MATRICES.md\`: human-readable recommended matrices

Manual enrichment inputs:

- \`data/model-benchmarks.manual.json\`: checked-in intelligence, speed, and selected benchmark metadata
- \`data/model-stability.manual.json\`: checked-in stability and capability annotations

The current enrichment path combines checked-in manual benchmark/stability data with automatic pricing enrichment and can be extended with stable benchmark adapters as reliable machine-readable sources become available.

You can print a recommended matrix directly:

\`\`\`bash
docker compose run --rm runner select-matrix dev
docker compose run --rm runner select-matrix release
\`\`\`

Or apply one to \.env.benchmark automatically:

\`\`\`bash
docker compose run --rm runner use-matrix dev
\`\`\`

Useful smoke-test example:

\`\`\`bash
BENCHMARK_MODELS=opencode/gpt-5.4-mini BENCHMARK_TASK_GLOB=05* docker compose run --rm runner benchmark
\`\`\`

Generated benchmark artifacts are written to \`results/\` locally. Use the live Pages site for published rankings, tables, and history rather than checking volatile result tables into the root README.

## Design

See [DESIGN.md](DESIGN.md) for benchmark architecture, telemetry rules, and CI behavior.
See [docs/result-schema.json](docs/result-schema.json) for the benchmark result contract.
See <${pagesUrl}> for the live published leaderboard, charts, and history.
`
}

export async function generateReports(runtime, runOverride = null) {
  const run = runOverride || (await readJson(path.join(runtime.rootDir, runtime.baseConfig.results.latestFile)))
  const chartsDir = path.join(runtime.rootDir, runtime.baseConfig.results.chartsDir)
  await ensureDir(chartsDir)

  run.modelCatalog = await readJson(path.join(runtime.rootDir, 'models/catalog.json')).catch(() => run.modelCatalog || { models: [] })
  const fullTaskCatalog = await loadFullTaskCatalog(runtime.rootDir)
  if (fullTaskCatalog.length) {
    run.taskCatalog = fullTaskCatalog
  } else if (!run.taskCatalog) {
    run.taskCatalog = []
  }

  aggregateRun(run, runtime.baseConfig.runner.requestExtractors)
  await writeJson(path.join(runtime.rootDir, runtime.baseConfig.results.latestFile), run)

  const catalogByModel = new Map((run.modelCatalog?.models || []).map((entry) => [entry.model, entry]))
  const taskCatalogById = new Map((run.taskCatalog || []).map((entry) => [entry.id, entry]))
  const leaderboard = run.modelSummary || []
  const eligible = leaderboard.filter((entry) => getComparabilityDetails(entry, catalogByModel, taskCatalogById).comparable && entry.eligible && entry.orpt != null)

  const orptData = [
    {
      type: 'bar',
      x: eligible.map((entry) => entry.model),
      y: eligible.map((entry) => entry.orpt),
      marker: { color: '#2563eb' },
      name: 'ORPT'
    }
  ]
  const successData = [
    {
      type: 'bar',
      x: leaderboard.map((entry) => entry.model),
      y: leaderboard.map((entry) => Number((entry.successRate * 100).toFixed(2))),
      marker: { color: '#16a34a' },
      name: 'Success Rate %'
    }
  ]
  const compositeData = [
    {
      type: 'bar',
      x: leaderboard.map((entry) => entry.model),
      y: leaderboard.map((entry) => Number(((entry.compositeScore ?? 0) * 100).toFixed(2))),
      marker: { color: '#7c3aed' },
      name: 'Composite Score %'
    }
  ]

  await writeText(
    path.join(runtime.rootDir, runtime.baseConfig.results.leaderboardFile),
    `# Model Summary\n\n${renderModelSummaryTable((run.modelSummary || []).filter((entry) => getComparabilityDetails(entry, catalogByModel, taskCatalogById).comparable), catalogByModel, taskCatalogById)}\n\n# Limited Comparability\n\n${renderModelSummaryTable((run.modelSummary || []).filter((entry) => !getComparabilityDetails(entry, catalogByModel, taskCatalogById).comparable), catalogByModel, taskCatalogById)}\n\n# Task Detail\n\n${renderTaskSummaryTable((run.taskSummary || []).filter((entry) => getComparabilityDetails(entry, catalogByModel, taskCatalogById).comparable), catalogByModel, taskCatalogById)}\n\n# Task Detail: Limited Comparability\n\n${renderTaskSummaryTable((run.taskSummary || []).filter((entry) => !getComparabilityDetails(entry, catalogByModel, taskCatalogById).comparable), catalogByModel, taskCatalogById)}\n\n# Scoring\n\n- \`Score\` is binary correctness.\n- \`Value Score\` is the secondary efficiency metric based on ORPT, actual observed cost, and wall time.\n- \`Composite Score = ${Number((run.scoring?.compositeScoreWeights?.score ?? 0.7)).toFixed(2)} * Score + ${Number((run.scoring?.compositeScoreWeights?.valueScore ?? 0.3)).toFixed(2)} * Value Score\`.\n- Comparable model rankings are sorted by \`Composite Score\`, with ORPT as a tie-breaker.\n\n# Value Score Components\n\n${renderValueScoreComponentsTable(run)}\n\n# Pricing Provenance\n\n${renderPricingProvenanceTable(run, catalogByModel)}\n\n${buildCapabilityCoverage(run, catalogByModel, taskCatalogById)}\n\n## Capability Matrix\n\n${renderCapabilityCoverageTable(run, catalogByModel)}\n`
  )

  await writeText(path.join(chartsDir, 'orpt.html'), renderChartHtml({
    title: 'ORPT Leaderboard',
    data: orptData,
    layout: { title: 'Average OpenCode Requests Per Successful Task', xaxis: { automargin: true }, yaxis: { title: 'Requests' } }
  }))
  await writeText(path.join(chartsDir, 'success-rate.html'), renderChartHtml({
    title: 'Success Rate',
    data: successData,
    layout: { title: 'Task Success Rate by Model', xaxis: { automargin: true }, yaxis: { title: 'Success Rate %', range: [0, 100] } }
  }))
  await writeText(path.join(chartsDir, 'composite-score.html'), renderChartHtml({
    title: 'Composite Score',
    data: compositeData,
    layout: { title: 'Composite Score by Model', xaxis: { automargin: true }, yaxis: { title: 'Composite Score %', range: [0, 100] } }
  }))

  await writeJson(path.join(chartsDir, 'orpt.json'), orptData)
  await writeJson(path.join(chartsDir, 'success-rate.json'), successData)
  await writeJson(path.join(chartsDir, 'composite-score.json'), compositeData)
  await writeText(path.join(runtime.rootDir, 'README.md'), renderReadme(run))
}
