import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'

function runNode(commandArgs, { cwd, env }) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, commandArgs, {
      cwd,
      env,
      stdio: 'pipe'
    })

    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString()
    })
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
    })
    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) resolve({ stdout, stderr })
      else reject(new Error(`build-github-pages failed with code ${code}\n${stderr || stdout}`))
    })
  })
}

test('pages build publishes provider-limited smoke evidence with raw failure details', async () => {
  const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), 'orpt-bench-pages-'))
  const outputDir = path.join(rootDir, 'site')

  try {
    await fs.mkdir(path.join(rootDir, 'results', 'history'), { recursive: true })
    await fs.mkdir(path.join(rootDir, 'models'), { recursive: true })
    await fs.mkdir(path.join(rootDir, 'docs'), { recursive: true })

    const fullRun = {
      run: {
        id: 'full-run-1',
        startedAt: '2026-04-08T00:00:00.000Z',
        completedAt: '2026-04-08T00:10:00.000Z',
        benchmarkCycle: 'weekly',
        models: ['opencode/gpt-5.4-mini'],
        taskCount: 1,
        taskPatterns: ['*'],
        repeats: 1,
      },
      results: [
        {
          taskId: '01-sample-task',
          taskName: 'Sample task',
          category: 'scripting',
          model: 'opencode/gpt-5.4-mini',
          provider: 'opencode',
          success: true,
          score: 1,
          durationMs: 1200,
          requestUnits: 2,
          requestCount: 2,
          requestAccountingSource: 'proxy-call-count',
          costUsd: 0.01,
          steps: 2,
          tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } }
        }
      ],
      modelCatalog: {
        models: [
          {
            model: 'opencode/gpt-5.4-mini',
            family: 'openai',
            devTier: 'dev-cheap',
            priceTier: 'low',
            recommendedUse: 'dev-general',
            benchmark: { blendedPricePer1mTokensUsd: 1.68 },
            stability: { headlessFriendly: true, notes: null },
            featureSupport: { unattendedBenchmarkRuns: 'supported', knownLimitations: [] }
          },
          {
            model: 'opencode/nemotron-3-super-free',
            family: 'nvidia',
            devTier: 'dev-cheap',
            priceTier: 'free',
            recommendedUse: 'dev-smoke',
            benchmark: { blendedPricePer1mTokensUsd: 0 },
            stability: { headlessFriendly: false, notes: 'Provider-limited smoke evidence.' },
            featureSupport: { unattendedBenchmarkRuns: 'limited', knownLimitations: ['Provider rate limits may block control smoke.'] }
          }
        ]
      },
      taskCatalog: [
        {
          id: '01-sample-task',
          name: 'Sample task',
          difficulty: 'control',
          requiredCapabilities: []
        }
      ],
      scoring: {
        valueScoreWeights: { orpt: 0.45, cost: 0.35, time: 0.2 },
        compositeScoreWeights: { score: 0.7, valueScore: 0.3 }
      }
    }

    const smokeRun = {
      run: {
        id: 'smoke-429',
        startedAt: '2026-04-08T06:34:02.018Z',
        completedAt: '2026-04-08T06:35:04.599Z',
        benchmarkCycle: 'candidate_smoke',
        models: ['opencode/nemotron-3-super-free'],
        taskCount: 3,
        taskPatterns: ['16-event-status-shell', '17-log-level-rollup', '05*'],
        repeats: 1,
        taskTimeoutSeconds: 75,
        processTimeoutSeconds: 210,
        derivedRunTimeoutSeconds: 210
      },
      results: [
        {
          runId: 'smoke-429',
          repeat: 1,
          taskId: '05-log-audit-script',
          taskName: 'Log audit shell script',
          category: 'scripting',
          model: 'opencode/nemotron-3-super-free',
          provider: 'opencode',
          success: false,
          score: 0,
          durationMs: 59686,
          steps: 1,
          requestCount: 1,
          tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
          costUsd: 0,
          toolInvocations: {},
          filesChanged: 0,
          diff: [],
          requestUnits: 1,
          requestAccountingSource: 'proxy-call-count',
          dnf: true,
          dnfReason: 'task-timeout',
          proxyRecords: [
            {
              providerID: 'opencode',
              status: 429,
              responseHeaders: {
                'retry-after': '62757'
              }
            }
          ],
          verifier: {
            command: 'python3 verify.py',
            code: 124,
            stdout: '',
            stderr: 'Task exceeded 60s hard timeout'
          },
          error: {
            message: 'Timed out after 59539ms'
          }
        }
      ],
      modelCatalog: fullRun.modelCatalog,
      taskCatalog: [
        {
          id: '16-event-status-shell',
          name: 'Event status shell summary',
          difficulty: 'control',
          timeoutSeconds: 45,
          requiredCapabilities: ['unattendedBenchmarkRuns']
        },
        {
          id: '17-log-level-rollup',
          name: 'Log level rollup shell script',
          difficulty: 'control',
          timeoutSeconds: 60,
          requiredCapabilities: ['unattendedBenchmarkRuns']
        },
        {
          id: '05-log-audit-script',
          name: 'Log audit shell script',
          difficulty: 'control',
          timeoutSeconds: 75,
          requiredCapabilities: ['unattendedBenchmarkRuns']
        }
      ],
      scoring: fullRun.scoring
    }

    await fs.writeFile(path.join(rootDir, 'results', 'latest.json'), `${JSON.stringify(smokeRun, null, 2)}\n`, 'utf8')
    await fs.writeFile(path.join(rootDir, 'results', 'history', 'full-run-1.json'), `${JSON.stringify(fullRun, null, 2)}\n`, 'utf8')
    await fs.writeFile(path.join(rootDir, 'results', 'history', 'smoke-429.json'), `${JSON.stringify(smokeRun, null, 2)}\n`, 'utf8')
    await fs.writeFile(path.join(rootDir, 'results', 'leaderboard.md'), '# fixture\n', 'utf8')
    await fs.writeFile(path.join(rootDir, 'models', 'README.md'), '# models\n', 'utf8')
    await fs.writeFile(path.join(rootDir, 'docs', 'result-schema.json'), '{}\n', 'utf8')
    await fs.writeFile(path.join(rootDir, 'DESIGN.md'), '# design\n', 'utf8')

    await runNode(['./scripts/lib/build-github-pages.js'], {
      cwd: '/var/home/rpeoples/Code/orpt-bench',
      env: {
        ...process.env,
        PUBLISH_PAGES_OUTPUT_DIR: outputDir,
        PUBLISH_GITHUB_REPOSITORY: 'https://github.com/example/orpt-bench',
        NODE_PATH: process.env.NODE_PATH || '',
        INIT_CWD: rootDir,
        PWD: rootDir,
      }
    })

    const previousCwd = process.cwd()
    process.chdir(rootDir)
    try {
      await runNode(['/var/home/rpeoples/Code/orpt-bench/scripts/lib/build-github-pages.js'], {
        cwd: rootDir,
        env: {
          ...process.env,
          PUBLISH_PAGES_OUTPUT_DIR: outputDir,
          PUBLISH_GITHUB_REPOSITORY: 'https://github.com/example/orpt-bench'
        }
      })
    } finally {
      process.chdir(previousCwd)
    }

    const siteData = JSON.parse(await fs.readFile(path.join(outputDir, 'site-data.json'), 'utf8'))
    const html = await fs.readFile(path.join(outputDir, 'index.html'), 'utf8')

    assert.equal(siteData.smokeRuns[0].models[0].providerLimited, true)
    assert.equal(siteData.smokeRuns[0].models[0].failureSummary.proxyStatus, 429)
    assert.equal(siteData.smokeRuns[0].models[0].failureSummary.retryAfter, '62757')
    assert.match(html, /provider-limited smoke/)
    assert.match(html, /provider_http=429/)
    assert.match(html, /retry_after=62757/)
    assert.match(html, /Task exceeded 60s hard timeout/)
  } finally {
    await fs.rm(rootDir, { recursive: true, force: true })
  }
})

test('pages build keeps older full-run models visible while marking prior task sets limited', async () => {
  const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), 'orpt-bench-pages-'))
  const outputDir = path.join(rootDir, 'site')

  try {
    await fs.mkdir(path.join(rootDir, 'results', 'history'), { recursive: true })
    await fs.mkdir(path.join(rootDir, 'models'), { recursive: true })
    await fs.mkdir(path.join(rootDir, 'docs'), { recursive: true })

    const olderFullRun = {
      run: {
        id: 'weekly-15',
        startedAt: '2026-04-07T23:00:00.000Z',
        completedAt: '2026-04-07T23:14:03.414Z',
        benchmarkCycle: 'weekly',
        models: ['opencode/gpt-5.4', 'opencode/gpt-5.4-mini'],
        taskCount: 15,
        taskPatterns: ['*'],
        repeats: 1,
      },
      results: [
        { taskId: '01-task', taskName: 'Task 1', category: 'infra', model: 'opencode/gpt-5.4', provider: 'opencode', success: true, score: 1, durationMs: 1000, requestUnits: 5, requestCount: 5, requestAccountingSource: 'proxy-call-count', costUsd: 0.1, steps: 5, tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } } },
        { taskId: '01-task', taskName: 'Task 1', category: 'infra', model: 'opencode/gpt-5.4-mini', provider: 'opencode', success: true, score: 1, durationMs: 1200, requestUnits: 4, requestCount: 4, requestAccountingSource: 'proxy-call-count', costUsd: 0.05, steps: 4, tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } } }
      ],
      modelCatalog: {
        models: [
          { model: 'opencode/gpt-5.4', family: 'openai', devTier: 'standard', priceTier: 'high', recommendedUse: 'flagship', benchmark: { blendedPricePer1mTokensUsd: 10 }, stability: { headlessFriendly: true, notes: null }, featureSupport: { unattendedBenchmarkRuns: 'supported', knownLimitations: [] } },
          { model: 'opencode/gpt-5.4-mini', family: 'openai', devTier: 'dev-cheap', priceTier: 'low', recommendedUse: 'dev-general', benchmark: { blendedPricePer1mTokensUsd: 1.68 }, stability: { headlessFriendly: true, notes: null }, featureSupport: { unattendedBenchmarkRuns: 'supported', knownLimitations: [] } },
          { model: 'opencode/glm-5.1', family: 'zhipu', devTier: 'standard', priceTier: 'low', recommendedUse: 'general', benchmark: { blendedPricePer1mTokensUsd: 1 }, stability: { headlessFriendly: true, notes: null }, featureSupport: { unattendedBenchmarkRuns: 'supported', knownLimitations: [] } }
        ]
      },
      taskCatalog: [{ id: '01-task', name: 'Task 1', difficulty: 'medium', timeoutSeconds: 300, requiredCapabilities: [] }],
      scoring: {
        valueScoreWeights: { orpt: 0.45, cost: 0.35, time: 0.2 },
        compositeScoreWeights: { score: 0.7, valueScore: 0.3 }
      }
    }

    const newerFullRun = {
      run: {
        id: 'candidate-17',
        startedAt: '2026-04-08T22:00:00.000Z',
        completedAt: '2026-04-08T22:13:41.723Z',
        benchmarkCycle: 'candidate_full',
        models: ['opencode/glm-5.1'],
        taskCount: 17,
        taskPatterns: ['*'],
        repeats: 1,
      },
      results: [
        { taskId: '01-task', taskName: 'Task 1', category: 'infra', model: 'opencode/glm-5.1', provider: 'opencode', success: true, score: 1, durationMs: 900, requestUnits: 3, requestCount: 3, requestAccountingSource: 'proxy-call-count', costUsd: 0.02, steps: 3, tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } } },
        { taskId: '02-task', taskName: 'Task 2', category: 'infra', model: 'opencode/glm-5.1', provider: 'opencode', success: true, score: 1, durationMs: 900, requestUnits: 3, requestCount: 3, requestAccountingSource: 'proxy-call-count', costUsd: 0.02, steps: 3, tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } } }
      ],
      modelCatalog: olderFullRun.modelCatalog,
      taskCatalog: [
        { id: '01-task', name: 'Task 1', difficulty: 'medium', timeoutSeconds: 300, requiredCapabilities: [] },
        { id: '02-task', name: 'Task 2', difficulty: 'medium', timeoutSeconds: 300, requiredCapabilities: [] }
      ],
      scoring: olderFullRun.scoring
    }

    await fs.writeFile(path.join(rootDir, 'results', 'latest.json'), `${JSON.stringify(newerFullRun, null, 2)}\n`, 'utf8')
    await fs.writeFile(path.join(rootDir, 'results', 'history', 'weekly-15.json'), `${JSON.stringify(olderFullRun, null, 2)}\n`, 'utf8')
    await fs.writeFile(path.join(rootDir, 'results', 'history', 'candidate-17.json'), `${JSON.stringify(newerFullRun, null, 2)}\n`, 'utf8')
    await fs.writeFile(path.join(rootDir, 'results', 'leaderboard.md'), '# fixture\n', 'utf8')
    await fs.writeFile(path.join(rootDir, 'models', 'README.md'), '# models\n', 'utf8')
    await fs.writeFile(path.join(rootDir, 'docs', 'result-schema.json'), '{}\n', 'utf8')
    await fs.writeFile(path.join(rootDir, 'DESIGN.md'), '# design\n', 'utf8')

    const previousCwd = process.cwd()
    process.chdir(rootDir)
    try {
      await runNode(['/var/home/rpeoples/Code/orpt-bench/scripts/lib/build-github-pages.js'], {
        cwd: rootDir,
        env: {
          ...process.env,
          PUBLISH_PAGES_OUTPUT_DIR: outputDir,
          PUBLISH_GITHUB_REPOSITORY: 'https://github.com/example/orpt-bench'
        }
      })
    } finally {
      process.chdir(previousCwd)
    }

    const siteData = JSON.parse(await fs.readFile(path.join(outputDir, 'site-data.json'), 'utf8'))
    const modelNames = siteData.modelSummary.map((entry) => entry.model)
    const gptMini = siteData.modelSummary.find((entry) => entry.model === 'opencode/gpt-5.4-mini')

    assert.match(modelNames.join(','), /opencode\/gpt-5\.4/)
    assert.match(modelNames.join(','), /opencode\/gpt-5\.4-mini/)
    assert.equal(gptMini.comparable, false)
    assert.match(gptMini.comparabilityNote, /earlier task set/) 
  } finally {
    await fs.rm(rootDir, { recursive: true, force: true })
  }
})

test('pages build classifies provider model-not-found and provider http smoke failures explicitly', async () => {
  const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), 'orpt-bench-pages-'))
  const outputDir = path.join(rootDir, 'site')

  try {
    await fs.mkdir(path.join(rootDir, 'results', 'history'), { recursive: true })
    await fs.mkdir(path.join(rootDir, 'models'), { recursive: true })
    await fs.mkdir(path.join(rootDir, 'docs'), { recursive: true })

    const fullRun = {
      run: {
        id: 'full-run-1',
        startedAt: '2026-04-08T00:00:00.000Z',
        completedAt: '2026-04-08T00:10:00.000Z',
        benchmarkCycle: 'weekly',
        models: ['opencode/gpt-5.4-mini'],
        taskCount: 1,
        taskPatterns: ['*'],
        repeats: 1,
      },
      results: [
        {
          taskId: '01-sample-task',
          taskName: 'Sample task',
          category: 'scripting',
          model: 'opencode/gpt-5.4-mini',
          provider: 'opencode',
          success: true,
          score: 1,
          durationMs: 1200,
          requestUnits: 2,
          requestCount: 2,
          requestAccountingSource: 'proxy-call-count',
          costUsd: 0.01,
          steps: 2,
          tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } }
        }
      ],
      modelCatalog: {
        models: [
          {
            model: 'opencode/gpt-5.4-mini',
            family: 'openai',
            devTier: 'dev-cheap',
            priceTier: 'low',
            recommendedUse: 'dev-general',
            benchmark: { blendedPricePer1mTokensUsd: 1.68 },
            stability: { headlessFriendly: true, notes: null },
            featureSupport: { unattendedBenchmarkRuns: 'supported', knownLimitations: [] }
          },
          {
            model: 'opencode/gemini-3-pro',
            family: 'google',
            devTier: 'dev-cheap',
            priceTier: 'low',
            recommendedUse: 'dev-smoke',
            benchmark: { blendedPricePer1mTokensUsd: 0 },
            stability: { headlessFriendly: false, notes: null },
            featureSupport: { unattendedBenchmarkRuns: 'unknown', knownLimitations: [] }
          },
          {
            model: 'opencode/claude-3-5-haiku',
            family: 'anthropic',
            devTier: 'dev-cheap',
            priceTier: 'low',
            recommendedUse: 'dev-smoke',
            benchmark: { blendedPricePer1mTokensUsd: 0 },
            stability: { headlessFriendly: false, notes: null },
            featureSupport: { unattendedBenchmarkRuns: 'unknown', knownLimitations: [] }
          }
        ]
      },
      taskCatalog: [
        {
          id: '01-sample-task',
          name: 'Sample task',
          difficulty: 'control',
          requiredCapabilities: []
        }
      ],
      scoring: {
        valueScoreWeights: { orpt: 0.45, cost: 0.35, time: 0.2 },
        compositeScoreWeights: { score: 0.7, valueScore: 0.3 }
      }
    }

    const modelNotFoundSmokeRun = {
      run: {
        id: 'smoke-model-not-found',
        startedAt: '2026-04-08T07:49:58.687Z',
        completedAt: '2026-04-08T07:50:00.000Z',
        benchmarkCycle: 'candidate_smoke',
        models: ['opencode/gemini-3-pro'],
        taskCount: 3,
        taskPatterns: ['16-event-status-shell', '17-log-level-rollup', '05*'],
        repeats: 1,
        taskTimeoutSeconds: 75,
        processTimeoutSeconds: 210,
        derivedRunTimeoutSeconds: 210
      },
      results: [
        {
          runId: 'smoke-model-not-found',
          repeat: 1,
          taskId: '05-log-audit-script',
          taskName: 'Log audit shell script',
          category: 'scripting',
          model: 'opencode/gemini-3-pro',
          provider: 'opencode',
          success: false,
          score: 0,
          durationMs: 1000,
          steps: 1,
          requestCount: 0,
          requestUnits: 0,
          requestAccountingSource: 'proxy-call-count',
          costUsd: null,
          tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
          dnf: false,
          dnfReason: null,
          providerLimited: false,
          proxyRecords: [],
          logExcerpt: [
            'ProviderModelNotFoundError: ProviderModelNotFoundError',
            'ERROR share subscriber failed {"name":"ProviderModelNotFoundError","data":{"providerID":"opencode","modelID":"gemini-3-pro","suggestions":["gemini-3.1-pro"]}}'
          ],
          verifier: {
            command: 'python3 verify.py',
            code: 1,
            stdout: '',
            stderr: ''
          },
          error: {
            message: 'ProviderModelNotFoundError'
          }
        }
      ],
      modelCatalog: fullRun.modelCatalog,
      taskCatalog: [
        {
          id: '16-event-status-shell',
          name: 'Event status shell summary',
          difficulty: 'control',
          timeoutSeconds: 45,
          requiredCapabilities: ['unattendedBenchmarkRuns']
        },
        {
          id: '17-log-level-rollup',
          name: 'Log level rollup shell script',
          difficulty: 'control',
          timeoutSeconds: 60,
          requiredCapabilities: ['unattendedBenchmarkRuns']
        },
        {
          id: '05-log-audit-script',
          name: 'Log audit shell script',
          difficulty: 'control',
          timeoutSeconds: 75,
          requiredCapabilities: ['unattendedBenchmarkRuns']
        }
      ],
      scoring: fullRun.scoring
    }

    const providerHttpSmokeRun = {
      run: {
        id: 'smoke-provider-http',
        startedAt: '2026-04-08T07:54:34.702Z',
        completedAt: '2026-04-08T07:54:36.000Z',
        benchmarkCycle: 'candidate_smoke',
        models: ['opencode/claude-3-5-haiku'],
        taskCount: 3,
        taskPatterns: ['16-event-status-shell', '17-log-level-rollup', '05*'],
        repeats: 1,
        taskTimeoutSeconds: 75,
        processTimeoutSeconds: 210,
        derivedRunTimeoutSeconds: 210
      },
      results: [
        {
          runId: 'smoke-provider-http',
          repeat: 1,
          taskId: '05-log-audit-script',
          taskName: 'Log audit shell script',
          category: 'scripting',
          model: 'opencode/claude-3-5-haiku',
          provider: 'opencode',
          success: false,
          score: 0,
          durationMs: 1500,
          steps: 1,
          requestCount: 1,
          requestUnits: 1,
          requestAccountingSource: 'proxy-call-count',
          costUsd: 0,
          tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
          dnf: false,
          dnfReason: null,
          providerLimited: false,
          proxyRecords: [
            {
              providerID: 'opencode',
              path: '/zen/v1/messages',
              upstreamUrl: 'https://opencode.ai/zen/v1/messages',
              status: 400,
              responseHeaders: {}
            }
          ],
          logExcerpt: [
            'ERROR service=session.processor error=model: claude-3-5-haiku-20241022 stack=AI_APICallError: model: claude-3-5-haiku-20241022'
          ],
          verifier: {
            command: 'python3 verify.py',
            code: 1,
            stdout: '',
            stderr: 'AI_APICallError: model: claude-3-5-haiku-20241022'
          },
          error: {
            message: 'AI_APICallError: model: claude-3-5-haiku-20241022'
          }
        }
      ],
      modelCatalog: fullRun.modelCatalog,
      taskCatalog: [
        {
          id: '16-event-status-shell',
          name: 'Event status shell summary',
          difficulty: 'control',
          timeoutSeconds: 45,
          requiredCapabilities: ['unattendedBenchmarkRuns']
        },
        {
          id: '17-log-level-rollup',
          name: 'Log level rollup shell script',
          difficulty: 'control',
          timeoutSeconds: 60,
          requiredCapabilities: ['unattendedBenchmarkRuns']
        },
        {
          id: '05-log-audit-script',
          name: 'Log audit shell script',
          difficulty: 'control',
          timeoutSeconds: 75,
          requiredCapabilities: ['unattendedBenchmarkRuns']
        }
      ],
      scoring: fullRun.scoring
    }

    await fs.writeFile(path.join(rootDir, 'results', 'latest.json'), `${JSON.stringify(providerHttpSmokeRun, null, 2)}\n`, 'utf8')
    await fs.writeFile(path.join(rootDir, 'results', 'history', 'full-run-1.json'), `${JSON.stringify(fullRun, null, 2)}\n`, 'utf8')
    await fs.writeFile(path.join(rootDir, 'results', 'history', 'smoke-model-not-found.json'), `${JSON.stringify(modelNotFoundSmokeRun, null, 2)}\n`, 'utf8')
    await fs.writeFile(path.join(rootDir, 'results', 'history', 'smoke-provider-http.json'), `${JSON.stringify(providerHttpSmokeRun, null, 2)}\n`, 'utf8')
    await fs.writeFile(path.join(rootDir, 'results', 'leaderboard.md'), '# fixture\n', 'utf8')
    await fs.writeFile(path.join(rootDir, 'models', 'README.md'), '# models\n', 'utf8')
    await fs.writeFile(path.join(rootDir, 'docs', 'result-schema.json'), '{}\n', 'utf8')
    await fs.writeFile(path.join(rootDir, 'DESIGN.md'), '# design\n', 'utf8')

    const previousCwd = process.cwd()
    process.chdir(rootDir)
    try {
      await runNode(['/var/home/rpeoples/Code/orpt-bench/scripts/lib/build-github-pages.js'], {
        cwd: rootDir,
        env: {
          ...process.env,
          PUBLISH_PAGES_OUTPUT_DIR: outputDir,
          PUBLISH_GITHUB_REPOSITORY: 'https://github.com/example/orpt-bench'
        }
      })
    } finally {
      process.chdir(previousCwd)
    }

    const siteData = JSON.parse(await fs.readFile(path.join(outputDir, 'site-data.json'), 'utf8'))
    const html = await fs.readFile(path.join(outputDir, 'index.html'), 'utf8')

    const smokeByModel = new Map(siteData.smokeRuns.flatMap((run) => run.models.map((model) => [model.model, model])))

    assert.equal(smokeByModel.get('opencode/gemini-3-pro').failureSummary.outcomeLabel, 'provider-model-not-found')
    assert.equal(smokeByModel.get('opencode/gemini-3-pro').failureSummary.suggestedModel, 'gemini-3.1-pro')
    assert.equal(smokeByModel.get('opencode/claude-3-5-haiku').failureSummary.outcomeLabel, 'provider-http-error')
    assert.equal(smokeByModel.get('opencode/claude-3-5-haiku').failureSummary.proxyStatus, 400)

    assert.match(html, /Decision support/)
    assert.match(html, /Recommendation/)
    assert.match(html, /wait for provider/)

    assert.match(html, /provider-model-not-found smoke/)
    assert.match(html, /suggested_model=gemini-3.1-pro/)
    assert.match(html, /provider-http-error smoke/)
    assert.match(html, /provider_http=400/)
  } finally {
    await fs.rm(rootDir, { recursive: true, force: true })
  }
})

test('pages build surfaces executive leaderboard and pre-rendered comparison tables', async () => {
  const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), 'orpt-bench-pages-'))
  const outputDir = path.join(rootDir, 'site')

  try {
    await fs.mkdir(path.join(rootDir, 'results', 'history'), { recursive: true })
    await fs.mkdir(path.join(rootDir, 'models'), { recursive: true })
    await fs.mkdir(path.join(rootDir, 'docs'), { recursive: true })

    const fullRun = {
      run: {
        id: 'full-run-1',
        startedAt: '2026-04-08T00:00:00.000Z',
        completedAt: '2026-04-08T00:10:00.000Z',
        benchmarkCycle: 'weekly',
        models: ['opencode/gpt-5.4-mini', 'opencode/glm-5'],
        taskCount: 2,
        taskPatterns: ['*'],
        repeats: 1,
      },
      results: [
        {
          taskId: '01-sample-task',
          taskName: 'Sample task',
          category: 'scripting',
          model: 'opencode/gpt-5.4-mini',
          provider: 'opencode',
          success: true,
          score: 1,
          durationMs: 1200,
          requestUnits: 2,
          requestCount: 2,
          requestAccountingSource: 'proxy-call-count',
          costUsd: 0.01,
          steps: 2,
          tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } }
        },
        {
          taskId: '02-sample-task',
          taskName: 'Another sample task',
          category: 'gitops',
          model: 'opencode/glm-5',
          provider: 'opencode',
          success: true,
          score: 1,
          durationMs: 1800,
          requestUnits: 3,
          requestCount: 3,
          requestAccountingSource: 'proxy-call-count',
          costUsd: 0.02,
          steps: 3,
          tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } }
        }
      ],
      modelCatalog: {
        models: [
          {
            model: 'opencode/gpt-5.4-mini',
            family: 'openai',
            devTier: 'dev-cheap',
            priceTier: 'low',
            recommendedUse: 'dev-general',
            benchmark: { blendedPricePer1mTokensUsd: 1.68 },
            stability: { headlessFriendly: true, notes: null },
            featureSupport: { unattendedBenchmarkRuns: 'supported', knownLimitations: [] }
          },
          {
            model: 'opencode/glm-5',
            family: 'z-ai',
            devTier: 'balanced-general',
            priceTier: 'low',
            recommendedUse: 'standard',
            benchmark: { blendedPricePer1mTokensUsd: 1.11 },
            stability: { headlessFriendly: true, notes: null },
            featureSupport: { unattendedBenchmarkRuns: 'supported', knownLimitations: [] }
          }
        ]
      },
      taskCatalog: [
        {
          id: '01-sample-task',
          name: 'Sample task',
          difficulty: 'control',
          timeoutSeconds: 60,
          requiredCapabilities: []
        },
        {
          id: '02-sample-task',
          name: 'Another sample task',
          difficulty: 'medium',
          timeoutSeconds: 60,
          requiredCapabilities: []
        }
      ],
      scoring: {
        valueScoreWeights: { orpt: 0.45, cost: 0.35, time: 0.2 },
        compositeScoreWeights: { score: 0.7, valueScore: 0.3 }
      }
    }

    await fs.writeFile(path.join(rootDir, 'results', 'latest.json'), `${JSON.stringify(fullRun, null, 2)}\n`, 'utf8')
    await fs.writeFile(path.join(rootDir, 'results', 'history', 'full-run-1.json'), `${JSON.stringify(fullRun, null, 2)}\n`, 'utf8')
    await fs.writeFile(path.join(rootDir, 'results', 'leaderboard.md'), '# fixture\n', 'utf8')
    await fs.writeFile(path.join(rootDir, 'models', 'README.md'), '# models\n', 'utf8')
    await fs.writeFile(path.join(rootDir, 'docs', 'result-schema.json'), '{}\n', 'utf8')
    await fs.writeFile(path.join(rootDir, 'DESIGN.md'), '# design\n', 'utf8')

    await runNode(['/var/home/rpeoples/Code/orpt-bench/scripts/lib/build-github-pages.js'], {
      cwd: rootDir,
      env: {
        ...process.env,
        PUBLISH_PAGES_OUTPUT_DIR: outputDir,
        PUBLISH_GITHUB_REPOSITORY: 'https://github.com/example/orpt-bench'
      }
    })

    const html = await fs.readFile(path.join(outputDir, 'index.html'), 'utf8')
    assert.match(html, /Top 10 models/)
    assert.match(html, /id="top-model-table">\s*<div class="table-wrap"><table>/)
    assert.match(html, /id="model-summary-table">\s*<div class="table-wrap"><table>/)
    assert.match(html, /Task insights/)
    assert.match(html, /Field read/)
    assert.match(html, /id="task-summary-table">\s*<div class="table-wrap"><table>/)
    assert.match(html, /Model detail page/)
    assert.match(html, /Completion score/)
    assert.match(html, /Completion vs benchmark cost/)

    const modelPage = await fs.readFile(path.join(outputDir, 'models', 'opencode-gpt-5-4-mini.html'), 'utf8')
    assert.match(modelPage, /Direct matchups/)
    assert.match(modelPage, /How the field moves relative to/)
    assert.match(modelPage, /Field comparison against the baseline/)
  } finally {
    await fs.rm(rootDir, { recursive: true, force: true })
  }
})

test('pages build ranks equal composite scores by lower ORPT first', async () => {
  const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), 'orpt-bench-pages-'))
  const outputDir = path.join(rootDir, 'site')

  try {
    await fs.mkdir(path.join(rootDir, 'results', 'history'), { recursive: true })
    await fs.mkdir(path.join(rootDir, 'models'), { recursive: true })
    await fs.mkdir(path.join(rootDir, 'docs'), { recursive: true })

    const fullRun = {
      run: {
        id: 'full-run-orpt-order',
        startedAt: '2026-04-08T00:00:00.000Z',
        completedAt: '2026-04-08T00:10:00.000Z',
        benchmarkCycle: 'weekly',
        models: ['opencode/fast-low-orpt', 'opencode/slow-high-orpt'],
        taskCount: 2,
        taskPatterns: ['*'],
        repeats: 1,
      },
      results: [
        {
          taskId: '01-a',
          taskName: 'Task A',
          category: 'scripting',
          model: 'opencode/fast-low-orpt',
          provider: 'opencode',
          success: true,
          score: 1,
          durationMs: 1000,
          requestUnits: 5,
          requestCount: 5,
          requestAccountingSource: 'proxy-call-count',
          costUsd: 0.01,
          steps: 5,
          tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } }
        },
        {
          taskId: '02-b',
          taskName: 'Task B',
          category: 'scripting',
          model: 'opencode/fast-low-orpt',
          provider: 'opencode',
          success: true,
          score: 1,
          durationMs: 1000,
          requestUnits: 5,
          requestCount: 5,
          requestAccountingSource: 'proxy-call-count',
          costUsd: 0.01,
          steps: 5,
          tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } }
        },
        {
          taskId: '01-a',
          taskName: 'Task A',
          category: 'scripting',
          model: 'opencode/slow-high-orpt',
          provider: 'opencode',
          success: true,
          score: 1,
          durationMs: 1000,
          requestUnits: 10,
          requestCount: 10,
          requestAccountingSource: 'proxy-call-count',
          costUsd: 0.01,
          steps: 10,
          tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } }
        },
        {
          taskId: '02-b',
          taskName: 'Task B',
          category: 'scripting',
          model: 'opencode/slow-high-orpt',
          provider: 'opencode',
          success: true,
          score: 1,
          durationMs: 1000,
          requestUnits: 10,
          requestCount: 10,
          requestAccountingSource: 'proxy-call-count',
          costUsd: 0.01,
          steps: 10,
          tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } }
        }
      ],
      modelCatalog: {
        models: [
          {
            model: 'opencode/fast-low-orpt',
            benchmark: { blendedPricePer1mTokensUsd: 1 },
            featureSupport: { unattendedBenchmarkRuns: 'supported', knownLimitations: [] }
          },
          {
            model: 'opencode/slow-high-orpt',
            benchmark: { blendedPricePer1mTokensUsd: 1 },
            featureSupport: { unattendedBenchmarkRuns: 'supported', knownLimitations: [] }
          }
        ]
      },
      taskCatalog: [
        { id: '01-a', name: 'Task A', difficulty: 'medium', timeoutSeconds: 60, requiredCapabilities: [] },
        { id: '02-b', name: 'Task B', difficulty: 'medium', timeoutSeconds: 60, requiredCapabilities: [] }
      ],
      scoring: {
        valueScoreWeights: { orpt: 0.45, cost: 0.35, time: 0.2 },
        compositeScoreWeights: { score: 0.7, valueScore: 0.3 }
      }
    }

    await fs.writeFile(path.join(rootDir, 'results', 'latest.json'), `${JSON.stringify(fullRun, null, 2)}\n`, 'utf8')
    await fs.writeFile(path.join(rootDir, 'results', 'history', 'full-run-orpt-order.json'), `${JSON.stringify(fullRun, null, 2)}\n`, 'utf8')
    await fs.writeFile(path.join(rootDir, 'results', 'leaderboard.md'), '# fixture\n', 'utf8')
    await fs.writeFile(path.join(rootDir, 'models', 'README.md'), '# models\n', 'utf8')
    await fs.writeFile(path.join(rootDir, 'docs', 'result-schema.json'), '{}\n', 'utf8')

    await runNode(['/var/home/rpeoples/Code/orpt-bench/scripts/lib/build-github-pages.js'], {
      cwd: rootDir,
      env: {
        ...process.env,
        PUBLISH_PAGES_OUTPUT_DIR: outputDir,
        PUBLISH_GITHUB_REPOSITORY: 'https://github.com/example/orpt-bench',
      }
    })

    const html = await fs.readFile(path.join(outputDir, 'index.html'), 'utf8')
    const firstIndex = html.indexOf('opencode/fast-low-orpt')
    const secondIndex = html.indexOf('opencode/slow-high-orpt')
    assert.ok(firstIndex >= 0 && secondIndex >= 0)
    assert.ok(firstIndex < secondIndex, 'lower ORPT model should appear first when composite scores tie')

    const orptChart = JSON.parse(await fs.readFile(path.join(outputDir, 'results', 'charts', 'orpt.json'), 'utf8'))
    assert.equal(orptChart.data[0].y[0], 'opencode/fast-low-orpt')
    assert.equal(orptChart.data[0].y[1], 'opencode/slow-high-orpt')
  } finally {
    await fs.rm(rootDir, { recursive: true, force: true })
  }
})

test('pages build keeps lower-is-better charts ranked with the best model at the top', async () => {
  const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), 'orpt-bench-pages-'))
  const outputDir = path.join(rootDir, 'site')

  try {
    await fs.mkdir(path.join(rootDir, 'results', 'history'), { recursive: true })
    await fs.mkdir(path.join(rootDir, 'models'), { recursive: true })
    await fs.mkdir(path.join(rootDir, 'docs'), { recursive: true })

    const fullRun = {
      run: {
        id: 'full-run-lower-better',
        startedAt: '2026-04-08T00:00:00.000Z',
        completedAt: '2026-04-08T00:10:00.000Z',
        benchmarkCycle: 'weekly',
        models: ['opencode/cheap-fast', 'opencode/expensive-slow'],
        taskCount: 2,
        taskPatterns: ['*'],
        repeats: 1,
      },
      results: [
        {
          taskId: '01-a', taskName: 'Task A', category: 'scripting', model: 'opencode/cheap-fast', provider: 'opencode', success: true, score: 1,
          durationMs: 1000, requestUnits: 5, requestCount: 5, requestAccountingSource: 'proxy-call-count', costUsd: 0.01, steps: 5,
          tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } }
        },
        {
          taskId: '02-b', taskName: 'Task B', category: 'scripting', model: 'opencode/cheap-fast', provider: 'opencode', success: true, score: 1,
          durationMs: 1000, requestUnits: 5, requestCount: 5, requestAccountingSource: 'proxy-call-count', costUsd: 0.01, steps: 5,
          tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } }
        },
        {
          taskId: '01-a', taskName: 'Task A', category: 'scripting', model: 'opencode/expensive-slow', provider: 'opencode', success: true, score: 1,
          durationMs: 2000, requestUnits: 10, requestCount: 10, requestAccountingSource: 'proxy-call-count', costUsd: 0.05, steps: 10,
          tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } }
        },
        {
          taskId: '02-b', taskName: 'Task B', category: 'scripting', model: 'opencode/expensive-slow', provider: 'opencode', success: true, score: 1,
          durationMs: 2000, requestUnits: 10, requestCount: 10, requestAccountingSource: 'proxy-call-count', costUsd: 0.05, steps: 10,
          tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } }
        }
      ],
      modelCatalog: {
        models: [
          { model: 'opencode/cheap-fast', benchmark: { blendedPricePer1mTokensUsd: 1 }, featureSupport: { unattendedBenchmarkRuns: 'supported', knownLimitations: [] } },
          { model: 'opencode/expensive-slow', benchmark: { blendedPricePer1mTokensUsd: 1 }, featureSupport: { unattendedBenchmarkRuns: 'supported', knownLimitations: [] } }
        ]
      },
      taskCatalog: [
        { id: '01-a', name: 'Task A', difficulty: 'medium', timeoutSeconds: 60, requiredCapabilities: [] },
        { id: '02-b', name: 'Task B', difficulty: 'medium', timeoutSeconds: 60, requiredCapabilities: [] }
      ],
      scoring: {
        valueScoreWeights: { orpt: 0.45, cost: 0.35, time: 0.2 },
        compositeScoreWeights: { score: 0.7, valueScore: 0.3 }
      }
    }

    await fs.writeFile(path.join(rootDir, 'results', 'latest.json'), `${JSON.stringify(fullRun, null, 2)}\n`, 'utf8')
    await fs.writeFile(path.join(rootDir, 'results', 'history', 'full-run-lower-better.json'), `${JSON.stringify(fullRun, null, 2)}\n`, 'utf8')
    await fs.writeFile(path.join(rootDir, 'results', 'leaderboard.md'), '# fixture\n', 'utf8')
    await fs.writeFile(path.join(rootDir, 'models', 'README.md'), '# models\n', 'utf8')
    await fs.writeFile(path.join(rootDir, 'docs', 'result-schema.json'), '{}\n', 'utf8')
    await fs.writeFile(path.join(rootDir, 'DESIGN.md'), '# design\n', 'utf8')

    await runNode(['/var/home/rpeoples/Code/orpt-bench/scripts/lib/build-github-pages.js'], {
      cwd: rootDir,
      env: {
        ...process.env,
        PUBLISH_PAGES_OUTPUT_DIR: outputDir,
        PUBLISH_GITHUB_REPOSITORY: 'https://github.com/example/orpt-bench',
      }
    })

    const orptChart = JSON.parse(await fs.readFile(path.join(outputDir, 'results', 'charts', 'orpt.json'), 'utf8'))
    const costChart = JSON.parse(await fs.readFile(path.join(outputDir, 'results', 'charts', 'total-cost.json'), 'utf8'))
    const wallTimeChart = JSON.parse(await fs.readFile(path.join(outputDir, 'results', 'charts', 'total-wall-time.json'), 'utf8'))

    assert.equal(orptChart.data[0].y[0], 'opencode/cheap-fast')
    assert.equal(costChart.data[0].y[0], 'opencode/cheap-fast')
    assert.equal(wallTimeChart.data[0].y[0], 'opencode/cheap-fast')
  } finally {
    await fs.rm(rootDir, { recursive: true, force: true })
  }
})
