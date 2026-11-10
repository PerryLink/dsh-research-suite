/**
 * Mount contract and the doctor tool surface.
 * @module test/mount.spec
 */

import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { resolveConfig } from '../src/config.ts'
import { apply } from '../src/index.ts'
import { makeDoctorTool } from '../src/tools/doctor.ts'
import type { DoctorValue } from '../src/tools/doctor.ts'

let root: string

beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'research-suite-mount-'))
})

afterEach(async () => {
  if (root.startsWith(tmpdir())) await rm(root, { recursive: true, force: true })
})

function makeCtx(services: Record<string, unknown> = {}): { ctx: never; names: string[] } {
  const names: string[] = []
  const ctx = {
    logger: () => ({ info: () => {} }),
    tools: {
      register: (tool: { name: string }) => {
        names.push(tool.name)
      },
    },
    effect: (fn: () => unknown) => {
      fn()
    },
    get: (name: string) => services[name],
  } as never
  return { ctx, names }
}

describe('mount', () => {
  it('honours enabled and registers exactly one tool', () => {
    const disabled = makeCtx()
    apply(disabled.ctx, { enabled: false })
    expect(disabled.names).toEqual([])

    const enabled = makeCtx()
    apply(enabled.ctx, { enabled: true })
    expect(enabled.names).toEqual(['research_doctor'])
  })
})

describe('research_doctor', () => {
  it('reports mounted services, counts and a sealed latest record', async () => {
    await mkdir(path.join(root, 'records'), { recursive: true })
    await writeFile(path.join(root, 'evidence.jsonl'), '{"id":"e1"}\n', 'utf8')
    await writeFile(
      path.join(root, 'records', 'ok.rep.json'),
      JSON.stringify({ recordId: 'ok', createdAt: '2026-11-10T00:00:00Z', evidence: [{}], claims: [{}], manifest: { hash: 'x' } }),
      'utf8',
    )
    const { ctx } = makeCtx({ researchEvidence: {}, researchReport: {} })
    const tool = makeDoctorTool(ctx, resolveConfig({ root }))
    const value = (await tool.execute({}, {} as never)) as DoctorValue
    expect(value.ok).toBe(true)
    if (!value.ok) throw new Error('expected success')
    expect(value.status).toBe('ok')
    expect(value.services).toEqual({ researchEvidence: true, researchReport: true })
    expect(value.records.count).toBe(1)
    expect(value.records.latest?.sealed).toBe(true)
    const text = (tool.output.render({}, value as never) as Array<{ text: string }>)[0]?.text ?? ''
    expect(text).toContain('research_doctor: ok')
    expect(text).toContain('researchEvidence=on')
    expect(text).toContain('latest ok.rep.json (sealed)')
  })

  it('warns when the evidence service is missing', async () => {
    const { ctx } = makeCtx({})
    const tool = makeDoctorTool(ctx, resolveConfig({ root }))
    const value = (await tool.execute({}, {} as never)) as DoctorValue
    expect(value.ok).toBe(true)
    if (!value.ok) throw new Error('expected success')
    expect(value.status).toBe('warn')
    expect(value.services.researchEvidence).toBe(false)
    expect(value.hints.join(' ')).toContain('dsh-research-core')
  })
})
