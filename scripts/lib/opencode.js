import fs from 'node:fs/promises'
import path from 'node:path'
import { spawn } from 'node:child_process'
import net from 'node:net'

import { ensureDir } from './fs.js'

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

export async function startOpenCodeServer({ runtime, model, proxy }) {
  const { providerID } = model
  const logDir = path.join(runtime.tmpDir, 'logs')
  await ensureDir(logDir)
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
    default_agent: runtime.agent,
    model: `${model.providerID}/${model.modelID}`,
    small_model: `${model.providerID}/${model.modelID}`,
    provider: providerConfig,
    permission: {
      edit: 'allow',
      bash: 'allow',
      webfetch: 'allow',
      task: 'allow'
    },
    agent: {
      build: {
        permission: {
          edit: 'allow',
          bash: { '*': 'allow' },
          webfetch: 'allow',
          task: { '*': 'allow' }
        }
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
