#!/usr/bin/env node
/**
 * Copy entities.example.json → entities.json when the local file is missing.
 * entities.json is gitignored and holds your real Home Assistant entity IDs.
 */

import { copyFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const configDir = join(__dirname, '../src/lib/config')
const target = join(configDir, 'entities.json')
const example = join(configDir, 'entities.example.json')

if (!existsSync(target)) {
  copyFileSync(example, target)
  console.log('Created src/lib/config/entities.json from entities.example.json')
  console.log('Edit it with your Home Assistant entity IDs before running the app.')
}
