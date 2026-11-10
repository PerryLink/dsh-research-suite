/**
 * REP inspection: counts, malformed lines, latest record, status.
 * @module test/doctor.spec
 */

import { mkdtemp, mkdir, rm, utimes, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { inspectRep } from '../src/doctor.ts'

let root: string

beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'research-suite-doctor-'))
})

afterEach(async () => {
  if (root.startsWith(tmpdir())) await rm(root, { recursive: true, force: true })
})

async function writeJournal(name: string, lines: readonly string[]): Promise<void> {
  await writeFile(path.join(root, name), lines.join('\n') + '\n', 'utf8')
}

describe('inspectRep', () => {
  it('reports a missing store as a warning, not an error', async () => {
    const report = await inspectRep({ root: path.join(root, 'nope'), maxScanBytes: 1024 * 1024 })
    expect(report.exists).toBe(false)
    expect(report.status).toBe('warn')
    expect(report.records.count).toBe(0)
    expect(report.hints[0]).toContain('does not exist')
  })

  it('counts lines, flags malformed journals and finds the latest record', async () => {
    await mkdir(path.join(root, 'records'), { recursive: true })
    await writeJournal('snapshots.jsonl', ['{"id":"s1"}', '{"id":"s2"}'])
    await writeJournal('evidence.jsonl', ['{"id":"e1"}', 'not json'])
    await writeJournal('claims.jsonl', ['{"id":"c1"}'])
    const older = path.join(root, 'records', 'a.rep.json')
    const newer = path.join(root, 'records', 'b.rep.json')
    await writeFile(older, JSON.stringify({ recordId: 'a', createdAt: '2026-11-01T00:00:00Z', evidence: [{}], claims: [{}, {}], manifest: { hash: 'x' } }), 'utf8')
    await writeFile(newer, JSON.stringify({ recordId: 'b', createdAt: '2026-11-02T00:00:00Z', evidence: [{}], claims: [] }), 'utf8')
    await writeFile(path.join(root, 'records', 'c.rep.json'), '{broken', 'utf8')
    await utimes(older, new Date('2026-11-01T00:00:00Z'), new Date('2026-11-01T00:00:00Z'))
    await utimes(newer, new Date('2026-11-02T00:00:00Z'), new Date('2026-11-02T00:00:00Z'))

    const report = await inspectRep({ root, maxScanBytes: 1024 * 1024 })
    expect(report.exists).toBe(true)
    expect(report.status).toBe('error')
    expect(report.journals.find(journal => journal.name === 'snapshots.jsonl')?.lines).toBe(2)
    expect(report.journals.find(journal => journal.name === 'evidence.jsonl')?.malformed).toBe(1)
    expect(report.records.count).toBe(2)
    expect(report.records.malformed).toBe(1)
    expect(report.records.latest?.recordId).toBe('b')
    expect(report.records.latest?.sealed).toBe(false)
    expect(report.hints.join(' ')).toContain('malformed')
    expect(report.hints.join(' ')).toContain('no manifest')
  })

  it('is ok when journals are valid and the latest record is sealed', async () => {
    await mkdir(path.join(root, 'records'), { recursive: true })
    await writeJournal('evidence.jsonl', ['{"id":"e1"}'])
    await writeFile(
      path.join(root, 'records', 'ok.rep.json'),
      JSON.stringify({ recordId: 'ok', createdAt: '2026-11-10T00:00:00Z', evidence: [{}], claims: [{}], manifest: { hash: 'x' } }),
      'utf8',
    )
    const report = await inspectRep({ root, maxScanBytes: 1024 * 1024 })
    expect(report.status).toBe('ok')
    expect(report.records.latest?.sealed).toBe(true)
    expect(report.hints).toEqual([])
  })
})
