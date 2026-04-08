import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { loadTasks } from '../scripts/lib/tasks.js'

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
