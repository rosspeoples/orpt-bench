import test from 'node:test'
import assert from 'node:assert/strict'

test('full benchmark safety gate rejects nonzero process timeout', async () => {
  const { spawn } = await import('node:child_process')

  await new Promise((resolve, reject) => {
    const child = spawn('node', ['scripts/cli.js', 'benchmark'], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        BENCHMARK_MODELS: 'opencode/gpt-5.4-mini',
        BENCHMARK_TASK_GLOB: '*',
        BENCHMARK_PROCESS_TIMEOUT_SECONDS: '120',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    let stderr = ''
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
    })

    child.on('exit', (code) => {
      try {
        assert.notEqual(code, 0)
        assert.match(stderr, /Refusing full benchmark run with explicit BENCHMARK_PROCESS_TIMEOUT_SECONDS=120/)
        resolve()
      } catch (error) {
        reject(error)
      }
    })
  })
})
