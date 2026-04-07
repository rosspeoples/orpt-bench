import path from 'node:path'

import { readJson } from './fs.js'

export async function loadTasks(runtime) {
  const tasks = []

  for (const taskDir of runtime.taskDirs) {
    const task = await readJson(path.join(taskDir, 'task.json'))
    tasks.push({
      ...task,
      requiredCapabilities: Array.isArray(task.requiredCapabilities) ? task.requiredCapabilities : [],
      difficulty: task.difficulty || 'medium',
      taskDir,
      workspaceDir: path.join(taskDir, 'workspace')
    })
  }

  return tasks.sort((a, b) => a.id.localeCompare(b.id))
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
