import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { readJson } from './fs.js'

function parseList(value) {
  if (!value) return []
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function parseInteger(value, fallback) {
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

function parseBoolean(value, fallback) {
  if (value == null) return fallback
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase())
}

async function readEnvFile(envFilePath) {
  try {
    const content = await fs.readFile(envFilePath, 'utf8')
    const values = {}
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim()
      if (!line || line.startsWith('#')) continue
      const separatorIndex = line.indexOf('=')
      if (separatorIndex <= 0) continue
      const key = line.slice(0, separatorIndex).trim()
      const value = line.slice(separatorIndex + 1)
      values[key] = value
    }
    return values
  } catch {
    return {}
  }
}

function envValue(processEnv, fileEnv, key) {
  const direct = processEnv[key]
  if (direct != null && direct !== '') return direct
  const fileValue = fileEnv[key]
  if (fileValue != null && fileValue !== '') return fileValue
  return undefined
}

function resolvePath(rootDir, value) {
  if (!value) return rootDir
  return path.isAbsolute(value) ? value : path.join(rootDir, value)
}

function matchPattern(name, patterns) {
  if (!patterns.length) return true
  return patterns.some((pattern) => {
    if (pattern === '*') return true
    if (!pattern.includes('*')) return pattern === name
    const regex = new RegExp(`^${pattern.split('*').map(escapeRegex).join('.*')}$`)
    return regex.test(name)
  })
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function inferApiKeyEnv(providerID) {
  return `${providerID.replace(/[^a-zA-Z0-9]+/g, '_').toUpperCase()}_API_KEY`
}

async function discoverTaskDirs(rootDir, taskPatterns) {
  const entries = await fs.readdir(path.join(rootDir, 'tasks'), { withFileTypes: true })
  const taskNames = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()

  if (!taskPatterns.length || (taskPatterns.length === 1 && taskPatterns[0] === '*')) {
    return taskNames
  }

  const ordered = []
  const seen = new Set()
  for (const pattern of taskPatterns) {
    for (const name of taskNames) {
      if (!matchPattern(name, [pattern]) || seen.has(name)) continue
      seen.add(name)
      ordered.push(name)
    }
  }
  return ordered
}

async function loadTaskBudgetCatalog(rootDir, taskNames) {
  const budgets = []
  for (const name of taskNames) {
    const taskDir = path.join(rootDir, 'tasks', name)
    const task = await readJson(path.join(taskDir, 'task.json'))
    if (!Number.isFinite(task.timeoutSeconds) || task.timeoutSeconds <= 0) {
      throw new Error(`Task ${task.id || name} must declare a positive timeoutSeconds value`)
    }
    budgets.push({
      id: task.id,
      name: task.name,
      difficulty: task.difficulty || 'medium',
      timeoutSeconds: task.timeoutSeconds
    })
  }
  return budgets
}

export async function loadRuntimeConfig() {
  const rootDir = process.cwd()
  const baseConfig = await readJson(path.join(rootDir, 'benchmark.config.json'))
  const fileEnv = await readEnvFile(path.join(rootDir, '.env.benchmark'))
  const benchmarkModels = envValue(process.env, fileEnv, 'BENCHMARK_MODELS')
  const models = parseList(benchmarkModels).length
    ? parseList(benchmarkModels)
    : baseConfig.models

  const taskPatterns = parseList(envValue(process.env, fileEnv, 'BENCHMARK_TASK_GLOB') || '*')
  const taskNames = await discoverTaskDirs(rootDir, taskPatterns)
  const taskBudgetCatalog = await loadTaskBudgetCatalog(rootDir, taskNames)
  const taskDirs = taskNames.map((name) => path.join(rootDir, 'tasks', name))
  const repeats = parseInteger(envValue(process.env, fileEnv, 'BENCHMARK_REPEATS'), 1)
  const maxTaskTimeoutSeconds = taskBudgetCatalog.reduce((max, task) => Math.max(max, task.timeoutSeconds), 0)
  const taskTimeoutSeconds = maxTaskTimeoutSeconds
  const taskTimeoutMs = taskTimeoutSeconds * 1000
  const perTaskSlackSeconds = 10
  const derivedRunTimeoutSeconds = (taskBudgetCatalog.reduce((total, task) => total + task.timeoutSeconds, 0) + (taskBudgetCatalog.length * perTaskSlackSeconds)) * repeats
  const processTimeoutSeconds = derivedRunTimeoutSeconds
  const processTimeoutMs = processTimeoutSeconds * 1000
  const modelConcurrency = Math.max(1, parseInteger(envValue(process.env, fileEnv, 'BENCHMARK_MODEL_CONCURRENCY'), 1))
  const providerOverridesValue = envValue(process.env, fileEnv, 'BENCHMARK_PROVIDER_OVERRIDES_JSON')
  const providerOverrides = providerOverridesValue
    ? JSON.parse(providerOverridesValue)
    : {}

  const proxy = baseConfig.proxy || {
    enabled: true,
    listenPort: 18080,
    routes: {
      opencode: {
        listenPathPrefix: '/zen/v1',
        upstreamBaseUrl: 'https://opencode.ai/zen/v1'
      }
    }
  }
  const proxyListenPort = envValue(process.env, fileEnv, 'BENCHMARK_PROXY_LISTEN_PORT')
  if (proxyListenPort) {
    proxy.listenPort = parseInteger(proxyListenPort, proxy.listenPort || 18080)
  }

  const writeReadme = parseBoolean(envValue(process.env, fileEnv, 'BENCHMARK_WRITE_README'), true)

  return {
    rootDir,
    baseConfig,
    benchmarkCycle: envValue(process.env, fileEnv, 'BENCHMARK_CYCLE') || null,
    models,
    taskPatterns,
    taskDirs,
    repeats,
    taskTimeoutMs,
    taskTimeoutSeconds,
    processTimeoutMs,
    processTimeoutSeconds,
    derivedRunTimeoutSeconds,
    taskBudgetCatalog,
    modelConcurrency,
    writeReadme,
    resultsDir: resolvePath(rootDir, envValue(process.env, fileEnv, 'ORPT_RESULTS_DIR') || 'results'),
    tmpDir: resolvePath(rootDir, envValue(process.env, fileEnv, 'ORPT_TMP_DIR') || '.tmp'),
    sandboxDir: envValue(process.env, fileEnv, 'ORPT_SANDBOX_DIR')
      ? resolvePath(rootDir, envValue(process.env, fileEnv, 'ORPT_SANDBOX_DIR'))
      : path.join(os.tmpdir(), 'orpt-bench-sandbox'),
    providerOverrides,
    proxy,
    inferApiKeyEnv,
    server: {
      ...baseConfig.runner.server,
      startupTimeoutMs: baseConfig.runner.server.startupTimeoutMs || 15000
    },
    scoring: baseConfig.runner.scoring || {
      valueScoreWeights: { orpt: 0.45, cost: 0.35, time: 0.2 },
      compositeScoreWeights: { score: 0.7, valueScore: 0.3 }
    },
    agent: envValue(process.env, fileEnv, 'BENCHMARK_AGENT') || baseConfig.runner.agent || 'build'
  }
}
