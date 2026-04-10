import path from 'node:path'

import { readJson, writeJson } from './lib/fs.js'

const LOW_CONFIDENCE_SOURCE = 'historical-low-confidence'
const LOW_CONFIDENCE_NOTE = 'Historical OpenCode cost row predates billing-integrity fixes and does not have trustworthy provenance. Treat this as low-confidence pricing evidence and do not compare VALUE or spend directly against billing-accurate runs without explicit repair.'
const RUN_NOTE = 'This historical artifact contains OpenCode cost rows that predate billing-integrity fixes. Rows marked historical-low-confidence should not be treated as billing-accurate pricing evidence.'

async function markFile(filePath) {
  const run = await readJson(filePath)
  let changed = 0

  for (const result of run.results || []) {
    if (result.provider !== 'opencode') continue
    if (result.costAccountingSource != null) continue

    result.costAccountingSource = LOW_CONFIDENCE_SOURCE
    result.costAccountingNotes = LOW_CONFIDENCE_NOTE
    result.costAccountingUrl = null
    changed += 1
  }

  if (!changed) return { filePath, changed: 0 }

  run.run.costRepairAppliedAt = new Date().toISOString()
  run.run.costRepairStrategy = LOW_CONFIDENCE_SOURCE
  run.run.costRepairNotes = RUN_NOTE
  await writeJson(filePath, run)
  return { filePath, changed }
}

async function main() {
  const rootDir = process.cwd()
  const targets = process.argv.slice(2)
  const files = targets.length
    ? targets.map((target) => path.resolve(rootDir, target))
    : []

  const results = []
  for (const filePath of files) {
    results.push(await markFile(filePath))
  }

  for (const result of results) {
    console.log(`${result.changed ? 'marked' : 'skipped'} ${path.relative(rootDir, result.filePath)} (${result.changed} rows)`) // eslint-disable-line no-console
  }
}

main().catch((error) => {
  console.error(error.stack || error.message || String(error)) // eslint-disable-line no-console
  process.exitCode = 1
})
