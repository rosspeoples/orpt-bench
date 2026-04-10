import test from 'node:test'
import assert from 'node:assert/strict'

import { extractRequestUnits, summarizeLogLines, summarizeParts, summarizeSessionMessages } from '../scripts/lib/extract.js'

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

test('summarizeSessionMessages sums all assistant message costs tokens and tool calls', () => {
  const summary = summarizeSessionMessages([
    {
      info: {
        role: 'user'
      },
      parts: [{ type: 'text', text: 'fix it' }]
    },
    {
      info: {
        role: 'assistant',
        cost: 0.01,
        tokens: {
          input: 100,
          output: 20,
          reasoning: 5,
          cache: { read: 10, write: 3 }
        }
      },
      parts: [
        { type: 'tool', tool: 'read' },
        { type: 'step-finish', cost: 0.01, tokens: { input: 100, output: 20, reasoning: 5, cache: { read: 10, write: 3 } } }
      ]
    },
    {
      info: {
        role: 'assistant',
        cost: 0.02,
        tokens: {
          input: 50,
          output: 10,
          reasoning: 1,
          cache: { read: 7, write: 0 }
        }
      },
      parts: [
        { type: 'tool', tool: 'read' },
        { type: 'tool', tool: 'apply_patch' },
        { type: 'step-finish', cost: 0.02, tokens: { input: 50, output: 10, reasoning: 1, cache: { read: 7, write: 0 } } }
      ]
    }
  ], ['INFO service=session.prompt step=0', 'INFO service=session.prompt step=1'])

  assert.equal(summary.steps, 2)
  assert.equal(summary.costUsd, 0.03)
  assert.deepEqual(summary.tokens, {
    input: 150,
    output: 30,
    reasoning: 6,
    cache: { read: 17, write: 3 }
  })
  assert.deepEqual(summary.toolInvocations, { read: 2, apply_patch: 1 })
})

test('summarizeSessionMessages sums assistant ledger rows that only expose info cost and tokens', () => {
  const summary = summarizeSessionMessages([
    {
      info: {
        role: 'user'
      },
      parts: []
    },
    {
      info: {
        role: 'assistant',
        cost: 0.00213322,
        tokens: {
          input: 7925,
          output: 361,
          reasoning: 53,
          cache: { read: 1536, write: 0 }
        }
      },
      parts: []
    },
    {
      info: {
        role: 'assistant',
        cost: 0.00069746,
        tokens: {
          input: 302,
          output: 309,
          reasoning: 45,
          cache: { read: 9728, write: 0 }
        }
      },
      parts: []
    }
  ])

  assert.equal(summary.costUsd, 0.00283068)
  assert.deepEqual(summary.tokens, {
    input: 8227,
    output: 670,
    reasoning: 98,
    cache: { read: 11264, write: 0 }
  })
})

test('summarizeSessionMessages clamps signed token deltas and marks negative ledger data', () => {
  const summary = summarizeSessionMessages([
    {
      info: {
        role: 'assistant',
        cost: 0.0119434,
        tokens: {
          input: 10833,
          output: 337,
          reasoning: 0,
          cache: { read: 160, write: 0 }
        }
      },
      parts: []
    },
    {
      info: {
        role: 'assistant',
        cost: -0.005497,
        tokens: {
          input: -10569,
          output: 207,
          reasoning: 0,
          cache: { read: 22048, write: 0 }
        }
      },
      parts: []
    }
  ])

  assert.equal(summary.hasNegativeCostData, true)
  assert.equal(summary.hasNegativeTokenData, true)
  assert.deepEqual(summary.tokens, {
    input: 10833,
    output: 544,
    reasoning: 0,
    cache: { read: 22208, write: 0 }
  })
})
