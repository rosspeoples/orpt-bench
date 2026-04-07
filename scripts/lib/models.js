import fs from 'node:fs/promises'
import path from 'node:path'

import { nowIso, readJson, writeJson, writeText } from './fs.js'

const OPENROUTER_MODELS_URL = 'https://openrouter.ai/api/v1/models'

const CURATED_MATRIX_INCLUSIONS = {
  balanced: ['opencode/grok-4.20'],
  frontier: ['opencode/claude-sonnet-4-6']
}

function normalizeOpenRouterResponse(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  return []
}

function parsePriceNumber(value) {
  if (value == null || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function computeBlendedPriceFromOpenRouter(pricing) {
  const prompt = parsePriceNumber(pricing?.prompt)
  const completion = parsePriceNumber(pricing?.completion)
  if (prompt == null || completion == null) return null
  return Number((((prompt * 3) + completion) / 4 * 1_000_000).toFixed(6))
}

function canonicalizeVariantName(modelId) {
  return modelId.replace(/[:/-]?free$/i, '').replace(/-preview$/i, '').replace(/-thinking$/i, '')
}

function tokenizeModelId(modelId) {
  return canonicalizeVariantName(modelId)
    .split(/[^a-zA-Z0-9]+/)
    .map((part) => part.toLowerCase())
    .filter(Boolean)
}

function buildOpenRouterIndex(entries) {
  const byId = new Map()
  const byCanonical = new Map()

  for (const entry of entries) {
    byId.set(entry.id, entry)
    const shortId = entry.id.split('/').pop() || entry.id
    const canonical = canonicalizeVariantName(shortId)
    if (!byCanonical.has(canonical)) byCanonical.set(canonical, [])
    byCanonical.get(canonical).push(entry)
  }

  return { byId, byCanonical }
}

function mapOpenCodeModelToOpenRouterCandidates(modelId, index) {
  const directCandidates = []
  for (const entry of index.byId.values()) {
    const shortId = entry.id.split('/').pop() || entry.id
    if (shortId === modelId || shortId === modelId.replace(/-/g, '_')) {
      directCandidates.push(entry)
    }
  }
  if (directCandidates.length) return directCandidates

  const canonical = canonicalizeVariantName(modelId)
  const canonicalMatches = index.byCanonical.get(canonical) || []
  if (canonicalMatches.length) return canonicalMatches

  const modelTokens = tokenizeModelId(modelId)
  return [...index.byId.values()].filter((entry) => {
    const shortId = entry.id.split('/').pop() || entry.id
    const entryTokens = tokenizeModelId(shortId)
    const overlap = modelTokens.filter((token) => entryTokens.includes(token))
    return overlap.length >= Math.min(2, modelTokens.length) && overlap.includes(modelTokens[0])
  })
}

function pickOpenRouterPricing(candidates, modelId) {
  if (!candidates.length) return { primary: null, reference: null }

  const exact = candidates.find((entry) => (entry.id.split('/').pop() || entry.id) === modelId)
  const freeVariant = candidates.find((entry) => /:free$/i.test(entry.id))
  const paidVariant = candidates.find((entry) => !/:free$/i.test(entry.id))
  const sameFamilyPaidVariant = candidates.find((entry) => {
    if (/:free$/i.test(entry.id)) return false
    const shortId = entry.id.split('/').pop() || entry.id
    const overlap = tokenizeModelId(modelId).filter((token) => tokenizeModelId(shortId).includes(token))
    return overlap.length >= 2
  })

  if (modelId.endsWith('-free')) {
    return {
      primary: freeVariant || exact || candidates[0],
      reference: sameFamilyPaidVariant || paidVariant || null
    }
  }

  return {
    primary: exact || paidVariant || candidates[0],
    reference: null
  }
}

function mergeAutomaticPricing({ modelId, benchmark, openRouterPrimary, openRouterReference }) {
  const primaryBlend = computeBlendedPriceFromOpenRouter(openRouterPrimary?.pricing)
  const referenceBlend = computeBlendedPriceFromOpenRouter(openRouterReference?.pricing)
  const hasPrimaryPrice = benchmark.blendedPricePer1mTokensUsd != null

  const next = { ...benchmark }
  if (!next.pricingSourceType && hasPrimaryPrice && benchmark.source) {
    next.pricingSourceType = benchmark.referenceBlendedPricePer1mTokensUsd != null || primaryBlend != null
      ? 'manual-primary-with-openrouter-reference'
      : 'manual-primary'
  }
  if (!next.pricingConfidence && hasPrimaryPrice) {
    next.pricingConfidence = benchmark.confidence === 'manual' ? 'high' : 'medium'
  }
  if (!hasPrimaryPrice && primaryBlend != null) {
    next.blendedPricePer1mTokensUsd = primaryBlend
    next.source = 'openrouter'
    next.sourceUrl = OPENROUTER_MODELS_URL
    next.confidence = 'automatic'
    next.pricingSourceType = 'automatic-openrouter-primary'
    next.pricingConfidence = 'medium'
  }
  if (referenceBlend != null) {
    next.referenceBlendedPricePer1mTokensUsd = referenceBlend
    if (!next.pricingSourceType || next.pricingSourceType === 'manual-primary') next.pricingSourceType = hasPrimaryPrice ? 'manual-primary-with-openrouter-reference' : 'automatic-openrouter-reference'
    if (!next.pricingConfidence) next.pricingConfidence = 'medium'
  }
  if (primaryBlend != null || referenceBlend != null) {
    const noteParts = []
    if (!hasPrimaryPrice && primaryBlend != null) {
      noteParts.push(`Primary blended price derived automatically from OpenRouter listing ${openRouterPrimary.id} using a 3:1 input:output blend.`)
    } else if (hasPrimaryPrice && primaryBlend != null) {
      noteParts.push(`OpenRouter reference blend for ${openRouterPrimary.id} is ${primaryBlend} USD per 1M tokens using a 3:1 input:output mix.`)
    }
    if (referenceBlend != null) {
      noteParts.push(`Reference price uses ${openRouterReference.id} at ${referenceBlend} USD per 1M tokens from the same OpenRouter family.`)
    }
    next.pricingNotes = noteParts.join(' ')
  }
  if (next.referenceBlendedPricePer1mTokensUsd == null && benchmark.referenceBlendedPricePer1mTokensUsd != null) {
    next.referenceBlendedPricePer1mTokensUsd = benchmark.referenceBlendedPricePer1mTokensUsd
  }
  if (!next.pricingSourceType && benchmark.pricingSourceType) {
    next.pricingSourceType = benchmark.pricingSourceType
  }
  if (!next.pricingConfidence && benchmark.pricingConfidence) {
    next.pricingConfidence = benchmark.pricingConfidence
  }
  if (!next.pricingNotes && benchmark.pricingNotes) {
    next.pricingNotes = benchmark.pricingNotes
  }
  return next
}

async function loadTaskCapabilitySet(rootDir) {
  const tasksDir = path.join(rootDir, 'tasks')
  let entries = []
  try {
    entries = await fs.readdir(tasksDir, { withFileTypes: true })
  } catch {
    return { taskIds: [], requiredCapabilities: [] }
  }

  const tasks = []
  for (const entry of entries.filter((item) => item.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    try {
      const task = await readJson(path.join(tasksDir, entry.name, 'task.json'))
      tasks.push(task)
    } catch {
      continue
    }
  }

  return {
    taskIds: tasks.map((task) => task.id).filter(Boolean),
    requiredCapabilities: [...new Set(tasks.flatMap((task) => Array.isArray(task.requiredCapabilities) ? task.requiredCapabilities : []))]
  }
}

function supportsCapabilities(model, requiredCapabilities) {
  return requiredCapabilities.every((capability) => {
    const support = model.featureSupport?.[capability] || 'unknown'
    return support === 'supported'
  })
}

function normalizeOpenCodeResponse(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  return []
}

function inferFamily(modelID) {
  if (modelID.startsWith('gpt-')) return 'openai'
  if (modelID.startsWith('claude-')) return 'anthropic'
  if (modelID.startsWith('gemini-')) return 'google'
  if (modelID.startsWith('minimax-')) return 'minimax'
  if (modelID.startsWith('glm-')) return 'z-ai'
  if (modelID.startsWith('kimi-')) return 'moonshot'
  if (modelID.includes('nemotron')) return 'nvidia'
  return 'unknown'
}

function inferDevTier(modelID) {
  if (modelID.includes('free')) return 'dev-cheap'
  if (modelID.includes('mini') || modelID.includes('flash') || modelID.includes('haiku')) return 'dev-cheap'
  if (modelID.includes('nano')) return 'dev-cheap'
  if (modelID.includes('opus') || modelID.includes('pro')) return 'expensive'
  return 'standard'
}

function inferPriceTier(price) {
  if (price === 0) return 'free'
  if (price != null && price <= 2) return 'low'
  if (price != null && price <= 6) return 'medium'
  if (price != null) return 'high'
  return 'unknown'
}

function inferRecommendedUse(modelID, benchmark) {
  const price = benchmark.blendedPricePer1mTokensUsd
  if (price === 0 || modelID.includes('free')) return 'dev-smoke'
  if (modelID.includes('mini') || modelID.includes('flash') || modelID.includes('haiku')) return 'dev-general'
  if ((benchmark.intelligenceScore ?? 0) >= 55) return 'release-frontier'
  if ((benchmark.intelligenceScore ?? 0) >= 45) return 'balanced-general'
  return 'standard'
}

function composeManualSources(benchmarksManual, stabilityManual) {
  return {
    sources: benchmarksManual.sources || [],
    models: Object.fromEntries(
      [...new Set([...Object.keys(benchmarksManual.models || {}), ...Object.keys(stabilityManual.models || {})])].map((key) => [
        key,
        {
          ...(benchmarksManual.models?.[key] || {}),
          ...(stabilityManual.models?.[key] || {})
        }
      ])
    )
  }
}

function createBaseBenchmark() {
  return {
    intelligenceScore: null,
    agenticScore: null,
    speedTokensPerSecond: null,
    blendedPricePer1mTokensUsd: null,
    referenceBlendedPricePer1mTokensUsd: null,
    source: null,
    sourceUrl: null,
    confidence: 'none',
    pricingSourceType: null,
    pricingConfidence: null,
    pricingNotes: null
  }
}

function applyManualBenchmarkEnrichment(model, manualModel) {
  return {
    ...model,
    benchmark: {
      ...createBaseBenchmark(),
      ...(manualModel?.benchmark || {})
    }
  }
}

function applyManualStabilityEnrichment(model, manualModel) {
  return {
    ...model,
    stability: manualModel?.stability || {
      headlessFriendly: null,
      notes: null
    },
    featureSupport: manualModel?.featureSupport || {
      unattendedBenchmarkRuns: 'unknown',
      knownLimitations: []
    }
  }
}

function applyOpenRouterPricingEnrichment(model, openRouterIndex) {
  const openRouterCandidates = openRouterIndex ? mapOpenCodeModelToOpenRouterCandidates(model.modelId, openRouterIndex) : []
  const openRouterPricing = pickOpenRouterPricing(openRouterCandidates, model.modelId)
  return {
    ...model,
    benchmark: mergeAutomaticPricing({
      modelId: model.modelId,
      benchmark: model.benchmark,
      openRouterPrimary: openRouterPricing.primary,
      openRouterReference: openRouterPricing.reference
    })
  }
}

function applyArtificialAnalysisBenchmarkEnrichment(model) {
  return model
}

function applyDenylist(models, excluded) {
  const denied = new Set((excluded?.models || []).map((entry) => entry.id))
  return models.map((model) => ({
    ...model,
    excludedFromMatrices: denied.has(model.model)
  }))
}

function enrichModel(entry, manual, openRouterIndex) {
  const key = `opencode/${entry.id}`
  const manualModel = manual.models[key] || null
  const baseModel = {
    model: key,
    modelId: entry.id,
    object: entry.object || 'model',
    created: entry.created || null,
    ownedBy: entry.owned_by || 'opencode',
    family: inferFamily(entry.id),
    devTier: inferDevTier(entry.id),
    benchmark: createBaseBenchmark()
  }

  const withManualBenchmarks = applyManualBenchmarkEnrichment(baseModel, manualModel)
  const withManualStability = applyManualStabilityEnrichment(withManualBenchmarks, manualModel)
  const withArtificialAnalysis = applyArtificialAnalysisBenchmarkEnrichment(withManualStability)
  const withOpenRouterPricing = applyOpenRouterPricingEnrichment(withArtificialAnalysis, openRouterIndex)

  return {
    ...withOpenRouterPricing,
    priceTier: inferPriceTier(withOpenRouterPricing.benchmark.blendedPricePer1mTokensUsd),
    recommendedUse: inferRecommendedUse(entry.id, withOpenRouterPricing.benchmark)
  }
}

function sortCatalog(models) {
  return [...models].sort((a, b) => {
    const aScore = a.benchmark.intelligenceScore ?? -1
    const bScore = b.benchmark.intelligenceScore ?? -1
    if (a.devTier !== b.devTier) return a.devTier.localeCompare(b.devTier)
    if (aScore !== bScore) return bScore - aScore
    return a.model.localeCompare(b.model)
  })
}

function renderModelCatalogMarkdown(catalog) {
    const lines = [
      '# Model Catalog',
      '',
      '| Model | Dev Tier | Family | Headless | Unattended Runs | Intelligence | Agentic | Speed tok/s | Blended $/1M | Reference $/1M | Source | Price Type | Price Confidence | Pricing Notes | Summary | Limitations |',
      '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |'
    ]

  for (const model of catalog.models) {
    const headless = model.stability.headlessFriendly === true ? 'yes' : model.stability.headlessFriendly === false ? 'no' : 'unknown'
    const summary = model.stability.notes || ''
    const limitations = (model.featureSupport.knownLimitations || []).filter(Boolean).join('; ')
    lines.push(
      `| ${model.model} | ${model.devTier}/${model.priceTier} | ${model.family} | ${headless} | ${model.featureSupport.unattendedBenchmarkRuns || 'unknown'} | ${model.benchmark.intelligenceScore ?? 'n/a'} | ${model.benchmark.agenticScore ?? 'n/a'} | ${model.benchmark.speedTokensPerSecond ?? 'n/a'} | ${model.benchmark.blendedPricePer1mTokensUsd ?? 'n/a'} | ${model.benchmark.referenceBlendedPricePer1mTokensUsd ?? 'n/a'} | ${model.benchmark.source ?? 'n/a'} | ${model.benchmark.pricingSourceType ?? 'n/a'} | ${model.benchmark.pricingConfidence ?? 'n/a'} | ${model.benchmark.pricingNotes ?? ''} | ${summary} | ${limitations} |`
    )
  }

  if (!catalog.models.length) {
    lines.push('| No models found | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |')
  }

  lines.push('', 'Notes:', '`Headless` reflects observed suitability for unattended local benchmark runs.', '`,agentic` is optional and only populated when a stable reputable source is available.', 'OpenCode inventory is fetched live; benchmark metrics are enriched from checked-in source-backed data.')
  return lines.join('\n')
}

function scoreModelForSelection(model) {
  const intelligence = model.benchmark.intelligenceScore ?? 0
  const agentic = model.benchmark.agenticScore ?? 0
  const speed = model.benchmark.speedTokensPerSecond ?? 0
  const price = model.benchmark.blendedPricePer1mTokensUsd
  const pricePenalty = price == null ? 0 : Math.min(price, 20)
  const cheapBonus = price === 0 ? 20 : price != null && price <= 2 ? 10 : 0
  const headlessBonus = model.stability.headlessFriendly === true ? 20 : 0
  const headlessPenalty = model.stability.headlessFriendly === false ? 40 : 0

  return {
    dev: intelligence * 1.25 + agentic * 1.5 + speed / 12 - pricePenalty * 6 + cheapBonus + headlessBonus - headlessPenalty,
    cheap: intelligence * 1.5 + speed / 8 - pricePenalty * 5 + cheapBonus,
    balanced: intelligence * 2 + agentic * 2 + speed / 8 - pricePenalty * 2,
    frontier: intelligence * 3 + agentic * 3 + speed / 10 + pricePenalty,
    release: intelligence * 3 + agentic * 3 + speed / 12 - pricePenalty
  }
}

function chooseModels(catalog, mode) {
  const models = catalog.models.filter((model) => model.excludedFromMatrices !== true).map((model) => ({
    ...model,
    selectionScore: scoreModelForSelection(model)[mode]
  }))

  let filtered = models
  if (mode === 'dev') {
    const devCandidates = models.filter((model) => model.devTier === 'dev-cheap' && model.stability.headlessFriendly !== false && ((model.benchmark.blendedPricePer1mTokensUsd ?? 999) <= 2 || model.benchmark.blendedPricePer1mTokensUsd == null))
    const observedHeadless = devCandidates.filter((model) => model.stability.headlessFriendly === true)
    filtered = observedHeadless.length ? observedHeadless : devCandidates
  }
  if (mode === 'cheap') filtered = models.filter((model) => model.devTier === 'dev-cheap' || (model.benchmark.blendedPricePer1mTokensUsd ?? Infinity) <= 2)
  if (mode === 'frontier') filtered = models.filter((model) => (model.benchmark.intelligenceScore != null || model.devTier === 'expensive') && (model.devTier === 'expensive' || (model.benchmark.blendedPricePer1mTokensUsd ?? -1) >= 5))
  if (mode === 'release') filtered = models.filter((model) => model.benchmark.intelligenceScore != null || model.devTier !== 'dev-cheap')

  const sorted = filtered.sort((a, b) => b.selectionScore - a.selectionScore || a.model.localeCompare(b.model))

  if (mode === 'dev') return sorted.slice(0, 4)
  if (mode === 'cheap') return sorted.slice(0, 5)
  if (mode === 'frontier') return sorted.slice(0, 4)
  if (mode === 'balanced') return sorted.slice(0, 6)
  return sorted.slice(0, 5)
}

function withCuratedMatrixInclusions(models, mode) {
  const inclusions = CURATED_MATRIX_INCLUSIONS[mode] || []
  if (!inclusions.length) return models

  const merged = [...models]
  for (const model of inclusions) {
    if (!merged.includes(model)) merged.push(model)
  }

  return merged
}

function buildMatrices(catalog, taskCapabilitySet = { taskIds: [], requiredCapabilities: [] }) {
  const dev = chooseModels(catalog, 'dev')
  const cheapHeadless = chooseModels({
    ...catalog,
    models: catalog.models.filter((model) => model.stability.headlessFriendly === true && (model.devTier === 'dev-cheap' || (model.benchmark.blendedPricePer1mTokensUsd ?? Infinity) <= 2))
  }, 'cheap')
  const taskComparable = catalog.models.filter((model) => supportsCapabilities(model, taskCapabilitySet.requiredCapabilities))
  const cheapComparable = chooseModels({ ...catalog, models: taskComparable }, 'cheap')
  const balancedComparable = chooseModels({ ...catalog, models: taskComparable }, 'balanced')
  const cheap = chooseModels(catalog, 'cheap')
  const frontier = withCuratedMatrixInclusions(chooseModels(catalog, 'frontier').map((item) => item.model), 'frontier')
  const balanced = withCuratedMatrixInclusions(chooseModels(catalog, 'balanced').map((item) => item.model), 'balanced')
  const release = chooseModels(catalog, 'release')

  return {
    updatedAt: nowIso(),
    taskSet: taskCapabilitySet,
    matrices: {
      dev: {
        description: 'Fastest cheap matrix for local development and harness debugging',
        models: dev.map((item) => item.model)
      },
      cheap_headless: {
        description: 'Lowest-cost matrix limited to observed headless-friendly models',
        models: cheapHeadless.map((item) => item.model)
      },
      cheap: {
        description: 'Lowest-cost generally capable matrix',
        models: cheap.map((item) => item.model)
      },
      current_task_cheap_comparable: {
        description: 'Lowest-cost models fully comparable for the current checked-in task set',
        models: cheapComparable.map((item) => item.model)
      },
      balanced: {
        description: 'Broader comparison set balancing price, speed, and intelligence, including expensive frontier models that should usually run less often than cheap matrices',
        models: balanced
      },
      frontier: {
        description: 'Expensive frontier models for occasional high-signal comparison runs',
        models: frontier
      },
      current_task_balanced_comparable: {
        description: 'Broader models fully comparable for the current checked-in task set',
        models: balancedComparable.map((item) => item.model)
      },
      release: {
        description: 'Recommended higher-signal leaderboard matrix for less frequent full runs, including expensive models like gpt-5.4 and claude-opus-4-6',
        models: release.map((item) => item.model)
      }
    }
  }
}

function renderMatricesMarkdown(matrices) {
  const lines = ['# Suggested Matrices', '']

  for (const [name, matrix] of Object.entries(matrices.matrices)) {
    lines.push(`## ${name}`)
    lines.push('')
    lines.push(matrix.description)
    lines.push('')
    for (const model of matrix.models) {
      lines.push(`- ${model}`)
    }
    lines.push('')
  }

  return lines.join('\n')
}

export async function syncModelCatalog(runtime) {
  const apiKey = process.env.OPENCODE_API_KEY
  if (!apiKey) {
    throw new Error('OPENCODE_API_KEY is required to sync model catalog')
  }

  const response = await fetch('https://opencode.ai/zen/v1/models', {
    headers: {
      authorization: `Bearer ${apiKey}`
    }
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch model catalog: ${response.status} ${await response.text()}`)
  }

  const payload = await response.json()
  const openRouterResponse = await fetch(OPENROUTER_MODELS_URL)
  if (!openRouterResponse.ok) {
    throw new Error(`Failed to fetch OpenRouter pricing catalog: ${openRouterResponse.status} ${await openRouterResponse.text()}`)
  }
  const openRouterPayload = await openRouterResponse.json()
  const openRouterIndex = buildOpenRouterIndex(normalizeOpenRouterResponse(openRouterPayload))
  const benchmarksManual = await readJson(path.join(runtime.rootDir, 'data/model-benchmarks.manual.json'))
  const stabilityManual = await readJson(path.join(runtime.rootDir, 'data/model-stability.manual.json'))
  const excluded = await readJson(path.join(runtime.rootDir, 'models/excluded.json')).catch(() => ({ models: [] }))
  const manual = composeManualSources(benchmarksManual, stabilityManual)
  const models = sortCatalog(applyDenylist(normalizeOpenCodeResponse(payload).map((entry) => enrichModel(entry, manual, openRouterIndex)), excluded))

  const catalog = {
    updatedAt: nowIso(),
    source: {
      provider: 'opencode',
      inventoryUrl: 'https://opencode.ai/zen/v1/models',
      enrichmentSources: manual.sources
    },
    models
  }
  const taskCapabilitySet = await loadTaskCapabilitySet(runtime.rootDir)
  const matrices = buildMatrices(catalog, taskCapabilitySet)

  await writeJson(path.join(runtime.rootDir, 'models/catalog.json'), catalog)
  await writeJson(path.join(runtime.rootDir, 'models/catalog.latest.raw.json'), payload)
  await writeJson(path.join(runtime.rootDir, 'models/catalog.openrouter.raw.json'), openRouterPayload)
  await writeJson(path.join(runtime.rootDir, 'models/matrices.json'), matrices)
  await writeJson(path.join(runtime.rootDir, 'models/catalog.index.json'), {
    updatedAt: catalog.updatedAt,
    models: catalog.models.map((model) => ({
      model: model.model,
      devTier: model.devTier,
      intelligenceScore: model.benchmark.intelligenceScore,
      agenticScore: model.benchmark.agenticScore,
      blendedPricePer1mTokensUsd: model.benchmark.blendedPricePer1mTokensUsd,
      referenceBlendedPricePer1mTokensUsd: model.benchmark.referenceBlendedPricePer1mTokensUsd ?? null,
      pricingSource: model.benchmark.source ?? null,
      pricingSourceUrl: model.benchmark.sourceUrl ?? null,
      pricingSourceType: model.benchmark.pricingSourceType ?? null,
      pricingConfidence: model.benchmark.pricingConfidence ?? null,
      pricingNotes: model.benchmark.pricingNotes ?? null,
      unattendedBenchmarkRuns: model.featureSupport?.unattendedBenchmarkRuns ?? 'unknown'
    }))
  })

  return {
    catalog,
    markdown: renderModelCatalogMarkdown(catalog),
    matrices,
    matricesMarkdown: renderMatricesMarkdown(matrices)
  }
}

export async function selectModelMatrix(runtime, mode) {
  const catalog = await readJson(path.join(runtime.rootDir, 'models/catalog.json'))
  const taskCapabilitySet = await loadTaskCapabilitySet(runtime.rootDir)
  const matrices = buildMatrices(catalog, taskCapabilitySet)
  const selected = matrices.matrices[mode]

  if (!selected) {
    throw new Error(`Unknown matrix mode: ${mode}`)
  }

  await writeJson(path.join(runtime.rootDir, 'models/matrices.json'), matrices)
  await writeText(path.join(runtime.rootDir, 'models/MATRICES.md'), renderMatricesMarkdown(matrices))

  return {
    mode,
    models: selected.models,
    csv: selected.models.join(','),
    description: selected.description,
    matrices
  }
}

export async function useModelMatrix(runtime, mode) {
  const result = await selectModelMatrix(runtime, mode)
  const envPath = path.join(runtime.rootDir, '.env.benchmark')

  let envText = ''
  try {
    envText = await fs.readFile(envPath, 'utf8')
  } catch {
    envText = ''
  }

  const line = `BENCHMARK_MODELS=${result.csv}`
  if (/^BENCHMARK_MODELS=.*$/m.test(envText)) {
    envText = envText.replace(/^BENCHMARK_MODELS=.*$/m, line)
  } else {
    envText = `${line}\n${envText}`
  }

  await writeText(envPath, envText)
  return result
}

export {
  applyDenylist,
  applyArtificialAnalysisBenchmarkEnrichment,
  applyManualBenchmarkEnrichment,
  applyManualStabilityEnrichment,
  applyOpenRouterPricingEnrichment,
  buildMatrices,
  buildOpenRouterIndex,
  canonicalizeVariantName,
  chooseModels,
  computeBlendedPriceFromOpenRouter,
  mapOpenCodeModelToOpenRouterCandidates,
  mergeAutomaticPricing,
  pickOpenRouterPricing,
  tokenizeModelId
}
