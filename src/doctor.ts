/**
 * Read-only REP store inspection for `research_doctor`.
 *
 * The doctor never repairs: it counts journal lines, parses what fits inside
 * the scan cap, reports malformed lines, and finds the latest sealed record.
 * A malformed journal is an error because every count derived from it would be
 * a lie; a missing store is only a warning (a fresh profile has no records yet).
 *
 * @module dsh-research-suite/doctor
 */

import { readFile, readdir, stat } from 'node:fs/promises'
import path from 'node:path'

/** Journal files written by `@perrylink/dsh-research-core`. */
export const JOURNALS = [
  'snapshots.jsonl',
  'evidence.jsonl',
  'evidence-checks.jsonl',
  'claims.jsonl',
  'verdicts.jsonl',
  'audits.jsonl',
] as const

/** One journal's health. */
export interface JournalReport {
  readonly name: string
  readonly exists: boolean
  readonly bytes: number
  readonly lines: number
  readonly malformed: number
  /** False when the file exceeded `maxScanBytes` and was counted but not parsed. */
  readonly scanned: boolean
}

/** One `records/*.rep.json` summary. */
export interface RecordReport {
  readonly file: string
  readonly bytes: number
  readonly recordId?: string
  readonly createdAt?: string
  readonly evidence?: number
  readonly claims?: number
  readonly sealed: boolean
}

/** The full read-only inspection. */
export interface RepReport {
  readonly root: string
  readonly exists: boolean
  readonly journals: readonly JournalReport[]
  readonly records: {
    readonly count: number
    readonly malformed: number
    readonly latest?: RecordReport
  }
  readonly status: 'ok' | 'warn' | 'error'
  readonly hints: readonly string[]
}

interface TextFile {
  readonly exists: boolean
  readonly bytes: number
  readonly text?: string
}

async function readText(file: string, maxBytes: number): Promise<TextFile> {
  try {
    const info = await stat(file)
    if (!info.isFile()) return { exists: false, bytes: 0 }
    if (info.size > maxBytes) return { exists: true, bytes: info.size }
    return { exists: true, bytes: info.size, text: await readFile(file, 'utf8') }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return { exists: false, bytes: 0 }
    throw error
  }
}

function countJournal(name: string, file: TextFile): JournalReport {
  let lines = 0
  let malformed = 0
  if (file.text !== undefined) {
    for (const line of file.text.split('\n')) {
      if (line.trim() === '') continue
      lines += 1
      try {
        JSON.parse(line)
      } catch {
        malformed += 1
      }
    }
  }
  return { name, exists: file.exists, bytes: file.bytes, lines, malformed, scanned: file.text !== undefined }
}

function numberField(value: unknown): number | undefined {
  return Array.isArray(value) ? value.length : undefined
}

function stringField(value: unknown): string | undefined {
  return typeof value === 'string' && value !== '' ? value : undefined
}

async function readRecord(file: string, maxBytes: number): Promise<{ report?: RecordReport; malformed: boolean }> {
  const info = await stat(file)
  if (info.size > maxBytes) return { malformed: false }
  const text = await readFile(file, 'utf8')
  try {
    const raw = JSON.parse(text) as Record<string, unknown>
    const recordId = stringField(raw.recordId)
    const createdAt = stringField(raw.createdAt)
    const evidence = numberField(raw.evidence)
    const claims = numberField(raw.claims)
    const sealed = raw.manifest !== undefined && raw.manifest !== null
    return {
      malformed: false,
      report: {
        file: path.basename(file),
        bytes: info.size,
        ...(recordId === undefined ? {} : { recordId }),
        ...(createdAt === undefined ? {} : { createdAt }),
        ...(evidence === undefined ? {} : { evidence }),
        ...(claims === undefined ? {} : { claims }),
        sealed,
      },
    }
  } catch {
    return { malformed: true }
  }
}

/**
 * Inspect a REP root without modifying it.
 * @param options - root directory and per-file scan cap.
 * @returns the report, including hints for the model.
 */
export async function inspectRep(options: { root: string; maxScanBytes: number }): Promise<RepReport> {
  const { root, maxScanBytes } = options
  let rootInfo
  try {
    rootInfo = await stat(root)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }
  if (rootInfo === undefined || !rootInfo.isDirectory()) {
    return {
      root,
      exists: false,
      journals: JOURNALS.map(name => ({ name, exists: false, bytes: 0, lines: 0, malformed: 0, scanned: false })),
      records: { count: 0, malformed: 0 },
      status: 'warn',
      hints: [
        `REP root ${root} does not exist yet. Run a research tool (for example research_report) or the demo in examples/.`,
      ],
    }
  }

  const journals: JournalReport[] = []
  for (const name of JOURNALS) {
    journals.push(countJournal(name, await readText(path.join(root, name), maxScanBytes)))
  }

  let recordFiles: string[] = []
  try {
    recordFiles = (await readdir(path.join(root, 'records'))).filter(name => name.endsWith('.rep.json'))
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }
  let recordMalformed = 0
  const records: RecordReport[] = []
  const mtimes = new Map<string, number>()
  for (const file of recordFiles) {
    const full = path.join(root, 'records', file)
    const result = await readRecord(full, maxScanBytes)
    if (result.malformed) recordMalformed += 1
    if (result.report !== undefined) {
      records.push(result.report)
      mtimes.set(result.report.file, (await stat(full)).mtimeMs)
    }
  }
  records.sort((left, right) => (mtimes.get(right.file) ?? 0) - (mtimes.get(left.file) ?? 0))
  const latest = records[0]

  const malformed = journals.reduce((sum, journal) => sum + journal.malformed, 0) + recordMalformed
  const hints: string[] = []
  if (malformed > 0) {
    hints.push(`${malformed} malformed record line(s)/file(s): counts below are not trustworthy until those are fixed by hand.`)
  }
  if (records.length === 0) {
    hints.push('No sealed record yet: use research_report with at least one evidence item, then run research_doctor again.')
  } else if (latest !== undefined && !latest.sealed) {
    hints.push(`Latest record ${latest.file} has no manifest: seal it before treating it as a report.`)
  }
  if (journals.every(journal => !journal.exists)) {
    hints.push('No REP journal exists yet: the store has not recorded any evidence or claim.')
  }

  const status: RepReport['status'] = malformed > 0 ? 'error' : records.length === 0 ? 'warn' : 'ok'
  return {
    root,
    exists: true,
    journals,
    records: {
      count: records.length,
      malformed: recordMalformed,
      ...(latest === undefined ? {} : { latest }),
    },
    status,
    hints,
  }
}
