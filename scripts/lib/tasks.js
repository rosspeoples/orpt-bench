import path from 'node:path'

import { readJson } from './fs.js'

export async function loadTasks(runtime) {
  const tasks = []

  for (const taskDir of runtime.taskDirs) {
    const task = await readJson(path.join(taskDir, 'task.json'))
    if (!Number.isFinite(task.timeoutSeconds) || task.timeoutSeconds <= 0) {
      throw new Error(`Task ${task.id || taskDir} must declare a positive timeoutSeconds value`)
    }
    tasks.push({
      ...task,
      requiredCapabilities: Array.isArray(task.requiredCapabilities) ? task.requiredCapabilities : [],
      difficulty: task.difficulty || 'medium',
      timeoutSeconds: task.timeoutSeconds,
      taskDir,
      workspaceDir: path.join(taskDir, 'workspace')
    })
  }

  return tasks
}

export function parseModel(model) {
  const [provider, ...rest] = model.split('/')
  if (!provider || !rest.length) {
    throw new Error(`Model must use provider/model format, received: ${model}`)
  }
  return {
    providerID: provider,
    modelID: rest.join('/')
  }
}
