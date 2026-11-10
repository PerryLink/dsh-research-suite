/**
 * `research_doctor` — read-only REP store and service check.
 * @module dsh-research-suite/tools/doctor
 */

import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import path from 'node:path'
import type { ResolvedConfig } from '../config.ts'
import { inspectRep, type JournalReport, type RecordReport } from '../doctor.ts'

/** The canonical success value. */
export interface DoctorValue {
  readonly ok: true
  readonly status: 'ok' | 'warn' | 'error'
  readonly root: string
  readonly services: { readonly researchEvidence: boolean; readonly researchReport: boolean }
  readonly journals: readonly JournalReport[]
  readonly records: {
    readonly count: number
    readonly malformed: number
    readonly latest?: RecordReport
  }
  readonly hints: readonly string[]
}

/** The canonical failure value. */
export interface DoctorFailure {
  readonly ok: false
  readonly error: { readonly code: string; readonly message: string }
}

const JOURNAL_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    name: { type: 'string', required: true },
    exists: { type: 'boolean', required: true },
    bytes: { type: 'integer', required: true },
    lines: { type: 'integer', required: true },
    malformed: { type: 'integer', required: true },
    scanned: { type: 'boolean', required: true },
  },
} as const

const RECORD_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    file: { type: 'string', required: true },
    bytes: { type: 'integer', required: true },
    recordId: { type: 'string' },
    createdAt: { type: 'string' },
    evidence: { type: 'integer' },
    claims: { type: 'integer' },
    sealed: { type: 'boolean', required: true },
  },
} as const

const OUTPUT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    ok: { type: 'boolean', required: true },
    status: { type: 'string' },
    root: { type: 'string' },
    services: {
      type: 'object',
      additionalProperties: false,
      properties: {
        researchEvidence: { type: 'boolean', required: true },
        researchReport: { type: 'boolean', required: true },
      },
    },
    journals: { type: 'array', items: JOURNAL_SCHEMA },
    records: {
      type: 'object',
      additionalProperties: false,
      properties: {
        count: { type: 'integer', required: true },
        malformed: { type: 'integer', required: true },
        latest: RECORD_SCHEMA,
      },
    },
    hints: { type: 'array', items: { type: 'string' } },
    error: {
      type: 'object',
      additionalProperties: false,
      properties: {
        code: { type: 'string', required: true },
        message: { type: 'string', required: true },
      },
    },
  },
} as const

/**
 * Build the `research_doctor` tool.
 * @param ctx - the plugin context (used to probe optional services).
 * @param config - resolved suite config.
 * @returns the tool definition.
 */
export function makeDoctorTool(ctx: Context, config: ResolvedConfig) {
  return defineTool({
    name: 'research_doctor',
    description: [
      'Check the local research evidence store and the mounted research services (dsh-research-suite).',
      '',
      'Reports the REP root, whether ctx.researchEvidence and ctx.researchReport are mounted, per-journal line/malformed counts, the number of sealed records and the latest one. Read-only: it never repairs, deletes or writes. A malformed journal is reported as an error because every count derived from it would be unreliable.',
    ].join('\n'),
    parameters: {
      root: { type: 'string', description: 'Override the REP root (defaults to the suite config root).' },
    },
    output: {
      schema: OUTPUT_SCHEMA,
      render: (_args, value) => {
        const result = value as DoctorValue | DoctorFailure
        if (!result.ok) return [{ type: 'text', text: `research_doctor failed (${result.error.code}): ${result.error.message}` }]
        const lines = [`research_doctor: ${result.status} (${result.root})`]
        lines.push(`services: researchEvidence=${result.services.researchEvidence ? 'on' : 'off'} researchReport=${result.services.researchReport ? 'on' : 'off'}`)
        for (const journal of result.journals) {
          lines.push(`  ${journal.name}: ${journal.exists ? `${journal.lines} line(s), ${journal.malformed} malformed, ${journal.bytes} B${journal.scanned ? '' : ' (not scanned)'}` : 'missing'}`)
        }
        const latest = result.records.latest
        lines.push(`records: ${result.records.count}${result.records.malformed > 0 ? `, ${result.records.malformed} malformed` : ''}${latest === undefined ? '' : `; latest ${latest.file}${latest.sealed ? ' (sealed)' : ' (unsealed)'}`}`)
        for (const hint of result.hints) lines.push(`  hint: ${hint}`)
        return [{ type: 'text', text: lines.join('\n') }]
      },
    },
    async execute(input: unknown) {
      const args = (input ?? {}) as { root?: string }
      try {
        const root = args.root === undefined ? config.root : path.resolve(args.root)
        const rep = await inspectRep({ root, maxScanBytes: config.maxScanBytes })
        const services = {
          researchEvidence: ctx.get('researchEvidence') !== undefined,
          researchReport: ctx.get('researchReport') !== undefined,
        }
        const hints = [...rep.hints]
        if (!services.researchEvidence) {
          hints.push('ctx.researchEvidence is not mounted: install @perrylink/dsh-research-core or enable its row; the suite depends on it.')
        }
        if (!services.researchReport) {
          hints.push('ctx.researchReport is not mounted: dsh-research-report is not active, so sealed reports cannot be produced.')
        }
        const status: DoctorValue['status'] = rep.status === 'error' ? 'error' : !services.researchEvidence ? 'warn' : rep.status
        return {
          ok: true as const,
          status,
          root,
          services,
          journals: rep.journals.map(journal => ({ ...journal })),
          records: {
            count: rep.records.count,
            malformed: rep.records.malformed,
            ...(rep.records.latest === undefined ? {} : { latest: { ...rep.records.latest } }),
          },
          hints: [...hints],
        }
      } catch (error) {
        return {
          ok: false as const,
          error: { code: 'IO', message: error instanceof Error ? error.message : String(error) },
        }
      }
    },
  })
}
