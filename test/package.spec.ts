/**
 * Package contract: version, bundle patch and dependency rows stay aligned.
 * @module test/package.spec
 */

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { VERSION } from '../src/version.ts'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

describe('package contract', () => {
  it('single-sources the version', async () => {
    const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8')) as { version: string }
    expect(VERSION).toBe(pkg.version)
  })

  it('declares a bundle patch and publishes it', async () => {
    const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8')) as {
      dsh?: { bundle?: { patch?: string } }
      files?: string[]
      dependencies?: Record<string, string>
    }
    expect(pkg.dsh?.bundle?.patch).toBe('./cordis.patch.yml')
    expect(pkg.files).toContain('cordis.patch.yml')
    expect(pkg.files).toContain('lib')
    expect(Object.keys(pkg.dependencies ?? {}).length).toBeGreaterThanOrEqual(10)
  })

  it('inserts a row for every dependency and no unknown row', async () => {
    const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8')) as {
      dependencies: Record<string, string>
    }
    const patch = await readFile(path.join(root, 'cordis.patch.yml'), 'utf8')
    const names = [...patch.matchAll(/^\s+name:\s*'?([^'\n]+)'?\s*$/gmu)].map(match => match[1] ?? '')
    for (const dependency of Object.keys(pkg.dependencies)) {
      expect(names).toContain(dependency)
    }
    const allowed = new Set([...Object.keys(pkg.dependencies), '@perrylink/dsh-research-suite'])
    for (const name of names) expect(allowed.has(name)).toBe(true)
  })
})
