import { sum } from './fs.js'

function parseHeaderNumber(value) {
  if (value == null) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function extractRequestUnits({ proxyRecords, logLines, extractors }) {
  const headerCandidates = extractors.headerCandidates || []
  for (const headerName of headerCandidates) {
    const values = proxyRecords
      .map((record) => parseHeaderNumber(record.responseHeaders[headerName]))
      .filter((value) => value != null)

    if (values.length) {
      return {
        requestUnits: sum(values),
        source: `proxy-header:${headerName}`,
        samples: values
      }
    }
  }

  for (const pattern of extractors.logRegexes || []) {
    const regex = new RegExp(pattern, 'i')
    const values = []
    for (const line of logLines) {
      const match = line.match(regex)
      if (match && match[1]) {
        const parsed = parseHeaderNumber(match[1])
        if (parsed != null) values.push(parsed)
      }
    }
    if (values.length) {
      return {
        requestUnits: sum(values),
        source: `server-log:${pattern}`,
        samples: values
      }
    }
  }

  if (proxyRecords.length) {
    return {
      requestUnits: proxyRecords.length,
      source: 'proxy-call-count',
      samples: [proxyRecords.length]
    }
  }

  return {
    requestUnits: null,
    source: null,
    samples: []
  }
}

export function summarizeParts(parts) {
  const toolInvocations = {}
  let steps = 0

  for (const part of parts) {
    if (part.type === 'step-finish') steps += 1
    if (part.type === 'tool') {
      toolInvocations[part.tool] = (toolInvocations[part.tool] || 0) + 1
    }
  }

  return { steps, toolInvocations }
}

export function summarizeMessage(info, parts) {
  const { steps, toolInvocations } = summarizeParts(parts)
  const stepParts = parts.filter((part) => part.type === 'step-finish')
  const totalTokensFromSteps = stepParts.reduce(
    (acc, part) => {
      acc.input += part.tokens.input
      acc.output += part.tokens.output
      acc.reasoning += part.tokens.reasoning
      acc.cache.read += part.tokens.cache.read
      acc.cache.write += part.tokens.cache.write
      return acc
    },
    {
      input: 0,
      output: 0,
      reasoning: 0,
      cache: { read: 0, write: 0 }
    }
  )

  return {
    steps,
    toolInvocations,
    costUsd: info.cost || stepParts.reduce((total, part) => total + part.cost, 0),
    tokens: info.tokens && Object.keys(info.tokens).length ? info.tokens : totalTokensFromSteps
  }
}
