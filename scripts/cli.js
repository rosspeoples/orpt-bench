import { runBenchmark, runBenchmarkSingle, validateWorkspace } from './lib/benchmark.js'
import { selectBenchmarkCycle, syncAutomationArtifacts, useBenchmarkCycle } from './lib/automation.js'
import { loadRuntimeConfig } from './lib/config.js'
import { selectModelMatrix, syncModelCatalog, useModelMatrix } from './lib/models.js'
import { generateReports } from './lib/report.js'

export function ensureExpectedRunnerEnvironment(command, runtime) {
  if (command !== 'benchmark' && command !== 'benchmark-single') return

  const expected = process.env.ORPT_EXPECTED_RUNNER || ''
  if (expected === 'container') return

  const isFullTaskRun = runtime.taskPatterns.length === 1 && runtime.taskPatterns[0] === '*'
  const guidance = 'Run benchmarks through the containerized runner, e.g. `docker compose run --rm runner benchmark`.'
  if (command === 'benchmark' || isFullTaskRun) {
    throw new Error(`Refusing benchmark execution outside the expected container runner environment. ${guidance}`)
  }

  throw new Error(`Refusing benchmark-single execution outside the expected container runner environment. ${guidance}`)
}

function ensureSafeFullBenchmarkRuntime(runtime) {
  const configuredProcessTimeoutSeconds = Number.parseInt(process.env.BENCHMARK_PROCESS_TIMEOUT_SECONDS || '0', 10)
  const isFullTaskRun = runtime.taskPatterns.length === 1 && runtime.taskPatterns[0] === '*'
  if (isFullTaskRun && Number.isFinite(configuredProcessTimeoutSeconds) && configuredProcessTimeoutSeconds > 0) {
    throw new Error(`Refusing full benchmark run with explicit BENCHMARK_PROCESS_TIMEOUT_SECONDS=${configuredProcessTimeoutSeconds}. Full runs derive their outer timeout from selected task budgets.`)
  }
}

export async function main() {
  const command = process.argv[2] || 'benchmark'
  const runtime = await loadRuntimeConfig()

  if (command === 'benchmark') {
    ensureExpectedRunnerEnvironment(command, runtime)
    ensureSafeFullBenchmarkRuntime(runtime)
    const result = await runBenchmark(runtime)
    if (runtime.writeReadme) {
      await generateReports(runtime, result)
    }
    return
  }

  if (command === 'benchmark-single') {
    ensureExpectedRunnerEnvironment(command, runtime)
    const result = await runBenchmarkSingle(
      runtime,
      runtime.models,
      process.env.BENCHMARK_PARENT_RUN_ID || null,
      false
    )
    if (process.env.BENCHMARK_CHILD_OUTPUT_FILE) {
      await import('./lib/fs.js').then(({ writeJson }) => writeJson(process.env.BENCHMARK_CHILD_OUTPUT_FILE, result))
    }
    return
  }

  if (command === 'report') {
    await generateReports(runtime)
    return
  }

  if (command === 'validate') {
    await validateWorkspace(runtime)
    return
  }

  if (command === 'sync-models') {
    const result = await syncModelCatalog(runtime)
    await import('./lib/fs.js').then(({ writeText }) => Promise.all([
      writeText(`${runtime.rootDir}/models/README.md`, result.markdown),
      writeText(`${runtime.rootDir}/models/MATRICES.md`, result.matricesMarkdown)
    ]))
    return
  }

  if (command === 'sync-automation') {
    await syncAutomationArtifacts(runtime)
    return
  }

  if (command === 'select-matrix') {
    const mode = process.argv[3] || 'dev'
    const result = await selectModelMatrix(runtime, mode)
    console.log(result.csv)
    return
  }

  if (command === 'use-matrix') {
    const mode = process.argv[3] || 'dev'
    const result = await useModelMatrix(runtime, mode)
    console.log(`Updated .env.benchmark to ${mode}: ${result.csv}`)
    return
  }

  if (command === 'select-cycle') {
    const cycle = process.argv[3] || 'weekly'
    const result = await selectBenchmarkCycle(runtime, cycle)
    console.log(result.csv)
    return
  }

  if (command === 'use-cycle') {
    const cycle = process.argv[3] || 'weekly'
    const result = await useBenchmarkCycle(runtime, cycle)
    console.log(`Updated .env.benchmark to ${cycle}: ${result.csv}`)
    return
  }

  throw new Error(`Unknown command: ${command}`)
}

const invokedPath = process.argv[1]
const isDirectCliExecution = invokedPath && new URL(import.meta.url).pathname === invokedPath

if (isDirectCliExecution) {
  main().catch((error) => {
    console.error(error.stack || error.message || String(error))
    process.exitCode = 1
  })
}
