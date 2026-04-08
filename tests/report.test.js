import test from 'node:test'
import assert from 'node:assert/strict'

import { extractRequestUnits, summarizeLogLines, summarizeParts } from '../scripts/lib/extract.js'

test('extractRequestUnits sums matching proxy header values', () => {
  const summary = extractRequestUnits({
    proxyRecords: [
      { responseHeaders: { 'x-opencode-requests-used': '2' } },
      { responseHeaders: { 'x-opencode-requests-used': '3' } }
    ],
    logLines: [],
    extractors: { headerCandidates: ['x-opencode-requests-used'], logRegexes: [] }
  })

  assert.equal(summary.requestUnits, 5)
  assert.equal(summary.source, 'proxy-header:x-opencode-requests-used')
})

test('summarizeParts counts step-finish and tool parts', () => {
  const summary = summarizeParts([
    { type: 'step-finish' },
    { type: 'tool', tool: 'bash' },
    { type: 'tool', tool: 'bash' },
    { type: 'tool', tool: 'read' }
  ])

  assert.equal(summary.steps, 1)
  assert.deepEqual(summary.toolInvocations, { bash: 2, read: 1 })
})

test('summarizeLogLines counts internal prompt loops and tool starts', () => {
  const summary = summarizeLogLines([
    'INFO service=session.prompt step=0 sessionID=abc loop',
    'INFO service=session.prompt step=1 sessionID=abc loop',
    'INFO service=tool.registry status=started bash'
  ])

  assert.equal(summary.steps, 2)
  assert.deepEqual(summary.toolInvocations, {})
})

test('summarizeMessage returns null cost when provider cost is unavailable', async () => {
  const { summarizeMessage } = await import('../scripts/lib/extract.js')
  const summary = summarizeMessage({}, [], [])
  assert.equal(summary.costUsd, null)
})
