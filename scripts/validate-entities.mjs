#!/usr/bin/env node
/**
 * Validates entities.json against the Home Assistant REST API.
 * Usage: HA_URL=... HA_TOKEN=... node scripts/validate-entities.mjs
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const configPath = join(__dirname, '../src/lib/config/entities.json')

const haUrl = (process.env.HA_URL ?? process.env.VITE_HA_URL ?? '').replace(/\/$/, '')
const haToken = process.env.HA_TOKEN ?? process.env.VITE_HA_TOKEN ?? ''

if (!haUrl || !haToken) {
  console.error('Set HA_URL and HA_TOKEN (or VITE_HA_URL / VITE_HA_TOKEN)')
  process.exit(1)
}

const config = JSON.parse(readFileSync(configPath, 'utf8'))

function collectIds(obj) {
  const ids = new Set()
  if (typeof obj === 'string' && obj.includes('.')) {
    ids.add(obj)
  } else if (Array.isArray(obj)) {
    for (const item of obj) ids.add(item)
  } else if (obj && typeof obj === 'object') {
    for (const value of Object.values(obj)) {
      for (const id of collectIds(value)) ids.add(id)
    }
  }
  return ids
}

const configured = [...collectIds(config)]
console.log(`Checking ${configured.length} entities against ${haUrl}...`)

const res = await fetch(`${haUrl}/api/states`, {
  headers: { Authorization: `Bearer ${haToken}` },
})

if (!res.ok) {
  console.error(`HA API error: ${res.status} ${res.statusText}`)
  process.exit(1)
}

const states = await res.json()
const existing = new Set(states.map((s) => s.entity_id))
const missing = configured.filter((id) => !existing.has(id))

if (missing.length > 0) {
  console.error('Missing entities:')
  for (const id of missing) console.error(`  - ${id}`)
  process.exit(1)
}

console.log('All configured entities exist in Home Assistant.')
