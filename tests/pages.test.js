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
        taskCount: 1,
        taskPatterns: ['05*'],
        repeats: 1,
        taskTimeoutSeconds: 60,
        processTimeoutSeconds: 61,
        derivedRunTimeoutSeconds: 61
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
          id: '05-log-audit-script',
          name: 'Log audit shell script',
          difficulty: 'control',
          timeoutSeconds: 60,
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
