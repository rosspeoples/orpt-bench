import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { loadTasks } from '../scripts/lib/tasks.js'
import { validateWorkspace } from '../scripts/lib/benchmark.js'

test('loadTasks requires timeoutSeconds on every selected task', async () => {
  const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), 'orpt-bench-tasks-'))
  const taskDir = path.join(rootDir, 'tasks', '01-bad-task')
  await fs.mkdir(taskDir, { recursive: true })
  await fs.writeFile(path.join(taskDir, 'task.json'), JSON.stringify({
    id: '01-bad-task',
    name: 'Bad Task',
    difficulty: 'control',
    prompt: 'broken',
    verifier: 'python3 verify.py'
  }), 'utf8')

  await assert.rejects(
    () => loadTasks({ taskDirs: [taskDir] }),
    /must declare a positive timeoutSeconds value/
  )

  await fs.rm(rootDir, { recursive: true, force: true })
})

test('validateWorkspace rejects verifier dependency failures', async () => {
  const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), 'orpt-bench-validate-'))
  const taskDir = path.join(rootDir, 'tasks', '01-bad-verifier')
  await fs.mkdir(path.join(taskDir, 'workspace'), { recursive: true })
  await fs.mkdir(path.join(rootDir, '.tmp'), { recursive: true })

  await fs.writeFile(path.join(taskDir, 'task.json'), JSON.stringify({
    id: '01-bad-verifier',
    name: 'Bad Verifier',
    category: 'test',
    difficulty: 'medium',
    prompt: 'broken',
    verifier: 'python3 verify.py',
    timeoutSeconds: 30
  }), 'utf8')
  await fs.writeFile(path.join(taskDir, 'verify.py'), 'import does_not_exist\n', 'utf8')
  await fs.writeFile(path.join(rootDir, 'benchmark.config.json'), JSON.stringify({
    results: { historyDir: 'results/history', latestFile: 'results/latest.json', leaderboardFile: 'results/leaderboard.md', chartsDir: 'results/charts' },
    runner: {
      server: { hostname: '127.0.0.1', port: 4096, startupTimeoutMs: 15000 },
      taskTimeoutMs: 600000,
      agent: 'build',
      requestExtractors: { headerCandidates: [], logRegexes: [] }
    },
    proxy: { enabled: false, listenPort: 18080, routes: {} },
    models: [],
    tasksDir: 'tasks'
  }), 'utf8')
  await fs.mkdir(path.join(rootDir, 'docs'), { recursive: true })
  await fs.writeFile(path.join(rootDir, 'docs', 'result-schema.json'), JSON.stringify({ type: 'object' }), 'utf8')

  const previousCwd = process.cwd()
  try {
    process.chdir(rootDir)
    const { loadRuntimeConfig } = await import('../scripts/lib/config.js')
    const runtime = await loadRuntimeConfig()
    await assert.rejects(
      () => validateWorkspace(runtime),
      /verifier failed due to missing dependency or setup error/
    )
  } finally {
    process.chdir(previousCwd)
    await fs.rm(rootDir, { recursive: true, force: true })
  }
})
