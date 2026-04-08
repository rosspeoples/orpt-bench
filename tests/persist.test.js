import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env,
      stdio: ['ignore', 'pipe', 'pipe']
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
    child.on('exit', (code) => resolve({ code, stdout, stderr }))
  })
}

test('persist script stages benchmark paths without scooping unrelated files', async () => {
  const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), 'orpt-bench-persist-'))
  const remoteDir = await fs.mkdtemp(path.join(os.tmpdir(), 'orpt-bench-persist-remote-'))

  try {
    await fs.mkdir(path.join(rootDir, 'results'), { recursive: true })
    await fs.mkdir(path.join(rootDir, 'scripts'), { recursive: true })
    await fs.mkdir(path.join(rootDir, 'notes'), { recursive: true })

    await fs.copyFile(
      '/var/home/rpeoples/Code/orpt-bench/scripts/persist-benchmark-results.sh',
      path.join(rootDir, 'scripts', 'persist-benchmark-results.sh')
    )

    await fs.writeFile(path.join(rootDir, 'README.md'), '# fixture\n', 'utf8')
    await fs.writeFile(path.join(rootDir, 'results', 'latest.json'), '{"ok":true}\n', 'utf8')
    await fs.writeFile(path.join(rootDir, 'notes', 'scratch.txt'), 'leave me unstaged\n', 'utf8')

    let outcome = await run('git', ['init'], { cwd: rootDir, env: process.env })
    assert.equal(outcome.code, 0)

    outcome = await run('git', ['init', '--bare'], { cwd: remoteDir, env: process.env })
    assert.equal(outcome.code, 0)

    outcome = await run('git', ['remote', 'add', 'origin', remoteDir], { cwd: rootDir, env: process.env })
    assert.equal(outcome.code, 0)

    outcome = await run('git', ['add', '.'], { cwd: rootDir, env: process.env })
    assert.equal(outcome.code, 0)

    outcome = await run('git', ['commit', '-m', 'fixture'], {
      cwd: rootDir,
      env: {
        ...process.env,
        GIT_AUTHOR_NAME: 'Test',
        GIT_AUTHOR_EMAIL: 'test@example.com',
        GIT_COMMITTER_NAME: 'Test',
        GIT_COMMITTER_EMAIL: 'test@example.com'
      }
    })
    assert.equal(outcome.code, 0)

    outcome = await run('git', ['push', '-u', 'origin', 'HEAD:main'], {
      cwd: rootDir,
      env: process.env
    })
    assert.equal(outcome.code, 0)

    await fs.writeFile(path.join(rootDir, 'results', 'latest.json'), '{"ok":false}\n', 'utf8')
    await fs.writeFile(path.join(rootDir, 'notes', 'scratch.txt'), 'still unrelated\n', 'utf8')

    outcome = await run('bash', ['scripts/persist-benchmark-results.sh', 'main', 'checkpoint'], {
      cwd: rootDir,
      env: {
        ...process.env,
        GIT_AUTHOR_NAME: 'Test',
        GIT_AUTHOR_EMAIL: 'test@example.com',
        GIT_COMMITTER_NAME: 'Test',
        GIT_COMMITTER_EMAIL: 'test@example.com',
        PATH: process.env.PATH
      }
    })

    assert.equal(outcome.code, 0)

    const lastMessage = await run('git', ['log', '-1', '--format=%s'], { cwd: rootDir, env: process.env })
    assert.equal(lastMessage.code, 0)
    assert.equal(lastMessage.stdout.trim(), 'checkpoint')

    const lastCommit = await run('git', ['show', '--name-only', '--format=', 'HEAD'], { cwd: rootDir, env: process.env })
    assert.equal(lastCommit.code, 0)
    assert.deepEqual(lastCommit.stdout.trim().split('\n').filter(Boolean), ['results/latest.json'])

    const branchState = await run('git', ['status', '--short'], { cwd: rootDir, env: process.env })
    assert.equal(branchState.code, 0)
    assert.match(branchState.stdout, /^ M notes\/scratch.txt$/m)

    const unstaged = await run('git', ['diff', '--name-only'], { cwd: rootDir, env: process.env })
    assert.equal(unstaged.code, 0)
    assert.match(unstaged.stdout, /notes\/scratch.txt/)
  } finally {
    await fs.rm(rootDir, { recursive: true, force: true })
    await fs.rm(remoteDir, { recursive: true, force: true })
  }
})
