/**
 * `@perrylink/dsh-research-suite` — one bundle layer for the research family,
 * plus `research_doctor`.
 *
 * The bundle patch installs the evidence, verification, systematic-review and
 * report plugins; this module only adds the doctor tool. It is a function
 * plugin, no default export.
 *
 * @module dsh-research-suite
 */

import type { Context } from '@deepseek-ai/cordis'
import { Config, resolveConfig, type Config as ConfigShape } from './config.ts'
import { inspectRep } from './doctor.ts'
import { makeDoctorTool } from './tools/doctor.ts'
import { VERSION } from './version.ts'

/** Cordis plugin name. */
export const name = 'research-suite'

/** The tool registry is required. */
export const inject = ['tools']

export { Config, resolveConfig, inspectRep, makeDoctorTool, VERSION }
export type { ConfigShape }
export type { ResolvedConfig } from './config.ts'
export type { JournalReport, RecordReport, RepReport } from './doctor.ts'
export type { DoctorFailure, DoctorValue } from './tools/doctor.ts'

/**
 * Mount `research_doctor`.
 * @param ctx - the plugin context (host).
 * @param config - raw plugin config.
 */
export function apply(ctx: Context, config: ConfigShape): void {
  const resolved = resolveConfig(config)
  const logger = ctx.logger('research-suite')
  if (!resolved.enabled) {
    logger.info('disabled: enabled is false — research_doctor is not mounted')
    return
  }
  ctx.effect(() => ctx.tools.register(makeDoctorTool(ctx, resolved)), 'research-suite: research_doctor tool')
}
