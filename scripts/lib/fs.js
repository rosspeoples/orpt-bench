import fs from 'node:fs/promises'
import path from 'node:path'

export async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true })
}

export async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, 'utf8'))
}

export async function writeJson(filePath, value) {
  await ensureDir(path.dirname(filePath))
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

export async function writeText(filePath, value) {
  await ensureDir(path.dirname(filePath))
  await fs.writeFile(filePath, value, 'utf8')
}

export async function copyDir(source, destination) {
  await fs.rm(destination, { recursive: true, force: true })
  await ensureDir(path.dirname(destination))
  await fs.cp(source, destination, { recursive: true })
}

export function slugify(value) {
  return value.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase()
}

export function nowIso() {
  return new Date().toISOString()
}

export function median(values) {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) return (sorted[middle - 1] + sorted[middle]) / 2
  return sorted[middle]
}

export function average(values) {
  if (!values.length) return null
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

export function sum(values) {
  return values.reduce((total, value) => total + value, 0)
}

export function parseJsonEnv(name, fallback) {
  if (!process.env[name]) return fallback
  return JSON.parse(process.env[name])
}

export async function exists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}
