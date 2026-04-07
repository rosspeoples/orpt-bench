import http from 'node:http'

function normalizeHeaders(headers) {
  const normalized = {}
  for (const [key, value] of headers.entries()) {
    normalized[key.toLowerCase()] = value
  }
  return normalized
}

async function readRequestBody(request) {
  const chunks = []
  for await (const chunk of request) chunks.push(chunk)
  return Buffer.concat(chunks)
}

function matchRoute(routes, pathName) {
  return Object.entries(routes).find(([, route]) => pathName.startsWith(route.listenPathPrefix))
}

export async function startRecordingProxy(proxyConfig) {
  if (!proxyConfig?.enabled) {
    return {
      originForProvider() {
        return null
      },
      reset() {},
      records() {
        return []
      },
      async close() {}
    }
  }

  let requestRecords = []
  const sockets = new Set()

  const server = http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url, `http://${request.headers.host}`)
      const matched = matchRoute(proxyConfig.routes, url.pathname)
      if (!matched) {
        response.statusCode = 502
        response.end(`No proxy route for ${url.pathname}`)
        return
      }

      const [providerID, route] = matched
      const suffix = url.pathname.slice(route.listenPathPrefix.length)
      const upstreamUrl = new URL(`${route.upstreamBaseUrl}${suffix}${url.search}`)
      const body = await readRequestBody(request)
      const headers = { ...request.headers }
      delete headers.host
      delete headers['content-length']

      const upstreamResponse = await fetch(upstreamUrl, {
        method: request.method,
        headers,
        body: ['GET', 'HEAD'].includes(request.method || 'GET') ? undefined : body,
        duplex: 'half'
      })

      const responseBuffer = Buffer.from(await upstreamResponse.arrayBuffer())
      const responseHeaders = normalizeHeaders(upstreamResponse.headers)

      requestRecords.push({
        providerID,
        method: request.method || 'GET',
        path: url.pathname,
        upstreamUrl: upstreamUrl.toString(),
        status: upstreamResponse.status,
        responseHeaders,
        at: new Date().toISOString()
      })

      response.writeHead(upstreamResponse.status, Object.fromEntries(upstreamResponse.headers.entries()))
      response.end(responseBuffer)
    } catch (error) {
      response.statusCode = 502
      response.end(error.message)
    }
  })

  server.on('connection', (socket) => {
    sockets.add(socket)
    socket.on('close', () => {
      sockets.delete(socket)
    })
  })

  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(proxyConfig.listenPort || 18080, '127.0.0.1', resolve)
  })

  return {
    originForProvider(providerID) {
      const route = proxyConfig.routes[providerID]
      if (!route) return null
      return `http://127.0.0.1:${proxyConfig.listenPort || 18080}${route.listenPathPrefix}`
    },
    reset() {
      requestRecords = []
    },
    records() {
      return [...requestRecords]
    },
    async close() {
      for (const socket of sockets) {
        socket.destroy()
      }
      await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
    }
  }
}
