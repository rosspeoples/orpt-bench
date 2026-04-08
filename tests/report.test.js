import test from 'node:test'
import assert from 'node:assert/strict'

import { renderReadme } from '../scripts/lib/report.js'
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

test('renderReadme tolerates unknown aggregate cost values', () => {
  const markdown = renderReadme({
    results: [
      {
        taskId: '05-log-audit-script',
        model: 'opencode/glm-5',
        success: false
      }
    ],
    scoring: {
      valueScoreWeights: { orpt: 0.45, cost: 0.35, time: 0.2 },
      compositeScoreWeights: { score: 0.7, valueScore: 0.3 }
    },
    taskCatalog: [
      {
        id: '05-log-audit-script',
        name: 'Log audit shell script',
        difficulty: 'control',
        timeoutSeconds: 60,
        requiredCapabilities: ['unattendedBenchmarkRuns']
      }
    ],
    modelSummary: [
      {
        model: 'opencode/glm-5',
        score: 0,
        valueScore: 0,
        compositeScore: 0,
        successRate: 0,
        dnfTasks: 1,
        totalRequestCount: 20,
        orpt: null,
        totalWallTimeMs: 300019,
        totalCostUsd: null,
        eligible: false,
        comparable: true,
        comparabilityNote: null
      }
    ],
    taskSummary: [
      {
        taskId: '05-log-audit-script',
        model: 'opencode/glm-5',
        score: 0,
        valueScore: 0,
        compositeScore: 0,
        successRate: 0,
        dnfs: 1,
        totalRequestCount: 20,
        averageRequestUnits: 20,
        totalWallTimeMs: 300019,
        totalCostUsd: null,
        averageSteps: 20,
        comparable: true,
        comparabilityNote: null
      }
    ]
  })

  assert.match(markdown, /n\/a/)
})
