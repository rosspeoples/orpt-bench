import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import path from 'node:path'

import { readJson } from './lib/fs.js'

const execFileAsync = promisify(execFile)

async function ghJson(args) {
  const { stdout } = await execFileAsync('gh', args, { cwd: process.cwd(), maxBuffer: 1024 * 1024 * 10 })
  return stdout ? JSON.parse(stdout) : null
}

async function ghRun(args) {
  await execFileAsync('gh', args, { cwd: process.cwd(), maxBuffer: 1024 * 1024 * 10 })
}

function hasLifecycleMarker(body = '', model, kind) {
  return body.includes(`<!-- orpt-model:${model} -->`) && body.includes(`<!-- orpt-kind:${kind} -->`)
}

async function listOpenIssues() {
  return await ghJson(['issue', 'list', '--state', 'open', '--limit', '200', '--json', 'number,title,body'])
}

async function syncIssues() {
  const issuesPath = path.join(process.cwd(), 'models/issues.json')
  const plan = await readJson(issuesPath)
  const existing = await listOpenIssues()

  for (const item of plan.items || []) {
    const markerBody = `${item.body}\n\n<!-- orpt-model:${item.model} -->\n<!-- orpt-kind:${item.kind} -->\n<!-- orpt-issue-id:${item.id} -->\n`
    const match = (existing || []).find((issue) => hasLifecycleMarker(issue.body || '', item.model, item.kind))
    if (match) {
      await ghRun(['issue', 'edit', String(match.number), '--title', item.title, '--body', markerBody, '--add-label', item.labels.join(',')])
    } else {
      await ghRun(['issue', 'create', '--title', item.title, '--body', markerBody, '--label', item.labels.join(',')])
    }
  }
}

syncIssues().catch((error) => {
  console.error(error)
  process.exit(1)
})
