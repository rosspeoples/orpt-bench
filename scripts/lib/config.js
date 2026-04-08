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
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => matchPattern(name, taskPatterns))
    .sort()
}

export async function loadRuntimeConfig() {
  const rootDir = process.cwd()
  const baseConfig = await readJson(path.join(rootDir, 'benchmark.config.json'))
  const models = parseList(process.env.BENCHMARK_MODELS).length
    ? parseList(process.env.BENCHMARK_MODELS)
    : baseConfig.models

  const taskPatterns = parseList(process.env.BENCHMARK_TASK_GLOB || '*')
  const taskNames = await discoverTaskDirs(rootDir, taskPatterns)
  const taskDirs = taskNames.map((name) => path.join(rootDir, 'tasks', name))
  const repeats = parseInteger(process.env.BENCHMARK_REPEATS, 1)
  const taskTimeoutMs = parseInteger(process.env.BENCHMARK_TIMEOUT_SECONDS, Math.round(baseConfig.runner.taskTimeoutMs / 1000)) * 1000
  const processTimeoutMs = parseInteger(process.env.BENCHMARK_PROCESS_TIMEOUT_SECONDS, 0) * 1000
  const modelConcurrency = Math.max(1, parseInteger(process.env.BENCHMARK_MODEL_CONCURRENCY, 1))
  const providerOverrides = process.env.BENCHMARK_PROVIDER_OVERRIDES_JSON
    ? JSON.parse(process.env.BENCHMARK_PROVIDER_OVERRIDES_JSON)
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
  if (process.env.BENCHMARK_PROXY_LISTEN_PORT) {
    proxy.listenPort = parseInteger(process.env.BENCHMARK_PROXY_LISTEN_PORT, proxy.listenPort || 18080)
  }

  const writeReadme = parseBoolean(process.env.BENCHMARK_WRITE_README, true)

  return {
    rootDir,
    baseConfig,
    benchmarkCycle: process.env.BENCHMARK_CYCLE || null,
    models,
    taskPatterns,
    taskDirs,
    repeats,
    taskTimeoutMs,
    processTimeoutMs,
    modelConcurrency,
    writeReadme,
    resultsDir: resolvePath(rootDir, process.env.ORPT_RESULTS_DIR || 'results'),
    tmpDir: resolvePath(rootDir, process.env.ORPT_TMP_DIR || '.tmp'),
    sandboxDir: process.env.ORPT_SANDBOX_DIR
      ? resolvePath(rootDir, process.env.ORPT_SANDBOX_DIR)
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
    agent: process.env.BENCHMARK_AGENT || baseConfig.runner.agent || 'build'
  }
}
