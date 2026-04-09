import fs from 'node:fs/promises'
import path from 'node:path'
import { spawn } from 'node:child_process'
import net from 'node:net'

import { ensureDir } from './fs.js'

export function permissionRules(runtime) {
  const sandboxPattern = `${runtime.sandboxDir.replace(/\\/g, '/')}/**`
  const toolOutputPattern = '/root/.local/share/opencode/tool-output/**'

  return {
    question: 'deny',
    plan_enter: 'deny',
    plan_exit: 'deny',
    read: {
      [sandboxPattern]: 'allow',
      [toolOutputPattern]: 'allow',
      '*.env': 'ask',
      '*.env.*': 'ask',
      '*.env.example': 'allow'
    },
    edit: {
      [sandboxPattern]: 'allow'
    },
    bash: {
      [sandboxPattern]: 'allow'
    },
    webfetch: 'allow',
    task: { '*': 'allow' },
    external_directory: {
      '*': 'deny',
      [toolOutputPattern]: 'allow',
      [sandboxPattern]: 'allow'
    }
  }
}

async function requestJson({ baseUrl, pathname, method = 'GET', query = {}, body, timeoutMs = 120000 }) {
  const url = new URL(pathname, baseUrl)
  for (const [key, value] of Object.entries(query)) {
    if (value != null) url.searchParams.set(key, String(value))
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(new Error(`Timed out after ${timeoutMs}ms`)), timeoutMs)

  try {
    const response = await fetch(url, {
      method,
      headers: body ? { 'content-type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal
    })

    const text = await response.text()
    let parsed = null
    if (text) {
      try {
        parsed = JSON.parse(text)
      } catch {
        parsed = { raw: text }
      }
    }

    if (!response.ok) {
      const message = typeof parsed === 'object' ? JSON.stringify(parsed) : text
      throw new Error(`OpenCode API ${method} ${url.pathname} failed with ${response.status}: ${message}`)
    }

    return {
      data: parsed,
      headers: Object.fromEntries(response.headers.entries())
    }
  } finally {
    clearTimeout(timer)
  }
}

async function runOpenCodeJson(args, { cwd = process.cwd(), timeoutMs = 120000 } = {}) {
  return await new Promise((resolve, reject) => {
    const child = spawn('opencode', args, {
      cwd,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe']
    })

    let stdout = ''
    let stderr = ''
    const timer = setTimeout(() => {
      child.kill('SIGTERM')
      setTimeout(() => {
        if (child.exitCode == null) child.kill('SIGKILL')
      }, 3000)
    }, timeoutMs)

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString()
    })
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
    })
    child.once('error', (error) => {
      clearTimeout(timer)
      reject(error)
    })
    child.once('exit', (code) => {
      clearTimeout(timer)
      if (code !== 0) {
        reject(new Error(`opencode ${args.join(' ')} failed with code ${code}: ${(stderr || stdout).trim()}`))
        return
      }

      try {
        resolve(JSON.parse(stdout))
      } catch (error) {
        reject(new Error(`Failed to parse opencode ${args.join(' ')} JSON output: ${error.message}`))
      }
    })
  })
}

async function exportSessionJson(sessionID, { cwd, timeoutMs = 120000, retries = 5, retryDelayMs = 250 } = {}) {
  let lastError = null

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      return await runOpenCodeJson(['export', sessionID, '--pure'], { cwd, timeoutMs })
    } catch (error) {
      lastError = error
      if (attempt === retries) break
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs))
    }
  }

  throw lastError
}

function parseStoredMessagePayload(raw) {
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

async function sessionMessagesFromDb(sessionID, { cwd = process.cwd(), timeoutMs = 120000 } = {}) {
  const rows = await runOpenCodeJson([
    'db',
    `select data from message where session_id = '${sessionID.replace(/'/g, "''")}' order by time_created asc`,
    '--format',
    'json'
  ], { cwd, timeoutMs })

  return (rows || [])
    .map((row) => parseStoredMessagePayload(row?.data))
    .filter(Boolean)
    .map((message) => ({
      info: {
        id: message.id || null,
        role: message.role || null,
        cost: Number.isFinite(message.cost) ? message.cost : null,
        tokens: message.tokens || {}
      },
      parts: []
    }))
}

export async function startOpenCodeServer({ runtime, model, proxy, workingDirectory = null }) {
  const { providerID } = model
  const logDir = path.join(runtime.tmpDir, 'logs')
  await ensureDir(logDir)
  await ensureDir(runtime.sandboxDir)
  const serverCwd = workingDirectory || runtime.sandboxDir
  await ensureDir(serverCwd)
  const logFile = path.join(logDir, `${providerID}-${model.modelID.replace(/[\/]/g, '-')}.log`)
  const lines = []

  const providerConfig = { ...(runtime.providerOverrides || {}) }

  const apiKeyEnv = runtime.inferApiKeyEnv(providerID)
  if (process.env[apiKeyEnv]) {
    providerConfig[providerID] = {
      ...(providerConfig[providerID] || {}),
      options: {
        ...((providerConfig[providerID] || {}).options || {}),
        apiKey: process.env[apiKeyEnv]
      }
    }
  }

  const proxyOrigin = proxy.originForProvider(providerID)
  if (proxyOrigin) {
    providerConfig[providerID] = {
      ...(providerConfig[providerID] || {}),
      options: {
        ...((providerConfig[providerID] || {}).options || {}),
        baseURL: proxyOrigin
      }
    }
  }

  const opencodeConfig = {
    share: 'disabled',
    autoupdate: false,
    lsp: false,
    default_agent: runtime.agent,
    model: `${model.providerID}/${model.modelID}`,
    small_model: `${model.providerID}/${model.modelID}`,
    provider: providerConfig,
    permission: permissionRules(runtime),
    agent: {
      build: {
        permission: permissionRules(runtime)
      }
    },
    watcher: {
      ignore: ['**/.tmp/**', '**/results/**', '**/node_modules/**']
    }
  }

  const args = [
    'serve',
    `--hostname=${runtime.server.hostname}`,
    `--port=${await getFreePort(runtime.server.hostname)}`,
    '--print-logs'
  ]

  const child = spawn('opencode', args, {
    cwd: serverCwd,
    env: {
      ...process.env,
      OPENCODE_CONFIG_CONTENT: JSON.stringify(opencodeConfig)
    },
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe']
  })

  let buffer = ''
  const appendLines = async (chunk) => {
    const text = chunk.toString()
    buffer += text
    const split = buffer.split(/\r?\n/)
    buffer = split.pop() || ''
    for (const line of split) {
      lines.push(line)
      await fs.appendFile(logFile, `${line}\n`, 'utf8')
    }
  }

  child.stdout.on('data', (chunk) => {
    appendLines(chunk)
  })
  child.stderr.on('data', (chunk) => {
    appendLines(chunk)
  })

  const baseUrl = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timed out waiting for opencode server startup')), runtime.server.startupTimeoutMs)

    const onExit = (code) => {
      clearTimeout(timeout)
      reject(new Error(`opencode serve exited early with code ${code}`))
    }

    const poll = setInterval(() => {
      const line = lines.find((value) => value.includes('opencode server listening'))
      if (!line) return
      clearInterval(poll)
      clearTimeout(timeout)
      child.off('exit', onExit)
      const match = line.match(/on\s+(https?:\/\/[^\s]+)/)
      if (!match) {
        reject(new Error(`Failed to parse server URL from: ${line}`))
        return
      }
      resolve(match[1])
    }, 50)

    child.once('exit', onExit)
  })

  return {
    baseUrl,
    lines,
    logFile,
    logCursor() {
      return lines.length
    },
    sliceLogs(fromIndex) {
      return lines.slice(fromIndex)
    },
    async createSession(directory, title) {
      const response = await requestJson({
        baseUrl,
        pathname: '/session',
        method: 'POST',
        query: { directory },
        body: { title },
        timeoutMs: 120000
      })
      return response.data
    },
    async promptSession({ directory, sessionID, prompt, taskTimeoutMs, agent, model }) {
      const response = await requestJson({
        baseUrl,
        pathname: `/session/${sessionID}/message`,
        method: 'POST',
        query: { directory },
        body: {
          agent,
          model,
          parts: [{ type: 'text', text: prompt }]
        },
        timeoutMs: taskTimeoutMs
      })
      return response.data
    },
    async exportSession({ sessionID, timeoutMs = 120000 }) {
      return await exportSessionJson(sessionID, { cwd: serverCwd, timeoutMs })
    },
    async sessionMessagesFromDb({ sessionID, timeoutMs = 120000 }) {
      return await sessionMessagesFromDb(sessionID, { cwd: serverCwd, timeoutMs })
    },
    async sessionDiff({ directory, sessionID }) {
      const response = await requestJson({
        baseUrl,
        pathname: `/session/${sessionID}/diff`,
        query: { directory }
      })
      return response.data
    },
    async close() {
      if (child.exitCode != null || child.killed) return

      try {
        process.kill(-child.pid, 'SIGTERM')
      } catch {
        child.kill('SIGTERM')
      }

      await new Promise((resolve) => {
        const timer = setTimeout(() => {
          if (child.exitCode == null) {
            try {
              process.kill(-child.pid, 'SIGKILL')
            } catch {
              child.kill('SIGKILL')
            }
          }
        }, 3000)
        child.once('exit', () => {
          clearTimeout(timer)
          resolve()
        })
      })
    }
  }
}

async function getFreePort(hostname) {
  return await new Promise((resolve, reject) => {
    const server = net.createServer()
    server.once('error', reject)
    server.listen(0, hostname, () => {
      const address = server.address()
      if (!address || typeof address === 'string') {
        server.close(() => reject(new Error('Failed to allocate free port')))
        return
      }
      const { port } = address
      server.close((error) => {
        if (error) reject(error)
        else resolve(port)
      })
    })
  })
}
