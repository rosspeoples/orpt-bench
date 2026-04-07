import test from 'node:test'
import assert from 'node:assert/strict'

import { extractRequestUnits, summarizeParts } from '../scripts/lib/extract.js'

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
