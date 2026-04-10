import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

function read(filePath) {
  return fs.readFileSync(new URL(filePath, import.meta.url), 'utf8')
}

test('gitea benchmark workflows use the provisioned runner and durable persistence script', () => {
  const benchmarkWorkflow = read('../.gitea/workflows/benchmark.yml')
  const manageModelsWorkflow = read('../.gitea/workflows/manage-models.yml')

  assert.match(benchmarkWorkflow, /runs-on:\s+benchmarks-orpt-bench/)
  assert.match(manageModelsWorkflow, /runs-on:\s+benchmarks-orpt-bench/)
  assert.match(benchmarkWorkflow, /scripts\/persist-benchmark-results\.sh/)
  assert.match(manageModelsWorkflow, /scripts\/persist-benchmark-results\.sh/)
})

test('workflow files do not reference the deprecated commit-results helper', () => {
  const workflowFiles = [
    '../.gitea/workflows/benchmark.yml',
    '../.gitea/workflows/manage-models.yml',
    '../.gitea/workflows/github-publication.yml',
    '../.github/workflows/benchmark.yml',
    '../.github/workflows/manage-models.yml',
  ]

  for (const filePath of workflowFiles) {
    const content = read(filePath)
    assert.doesNotMatch(content, /ci\/commit-results\.sh/)
  }
})

test('benchmark workflows upload raw child-run and log evidence', () => {
  const workflowFiles = [
    '../.github/workflows/benchmark.yml',
    '../.gitea/workflows/benchmark.yml',
    '../.github/workflows/manage-models.yml',
    '../.gitea/workflows/manage-models.yml'
  ]

  for (const filePath of workflowFiles) {
    const content = read(filePath)
    assert.match(content, /\.tmp\/child-runs/)
    assert.match(content, /\.tmp\/logs/)
    assert.match(content, /results/)
  }
})
