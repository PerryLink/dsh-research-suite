/**
 * Config schema and resolution for the research suite.
 *
 * The suite is mostly a bundle: its own row only adds `research_doctor`, which
 * reads the REP store. `root` must match `@perrylink/dsh-research-core`'s root.
 * @module dsh-research-suite/config
 */

import path from 'node:path'
import z from '@deepseek-ai/schemastery'

/** Raw plugin config — every field optional. */
export interface Config {
  /** Master switch. `false` mounts no tools. */
  enabled?: boolean
  /** REP store root, resolved against the harness working directory. */
  root?: string
  /** Per-journal scan cap in bytes; larger journals are counted but not parsed. */
  maxScanBytes?: number
}

/** Fully resolved config. */
export interface ResolvedConfig {
  readonly enabled: boolean
  readonly root: string
  readonly maxScanBytes: number
}

/** Schemastery schema: the loader validates and fills defaults before `apply`. */
export const Config: z<Config> = z.object({
  enabled: z.boolean().default(true),
  root: z.string().default('.research-rep'),
  maxScanBytes: z.number().default(16 * 1024 * 1024),
})

/**
 * Validate raw values and fill explicit defaults.
 * @param config - raw (possibly partial) plugin config.
 * @returns the fully resolved config.
 */
export function resolveConfig(config: Config = {}): ResolvedConfig {
  const root = config.root ?? '.research-rep'
  if (typeof root !== 'string' || root.trim() === '') throw new TypeError('root must be a non-empty path')
  const maxScanBytes = config.maxScanBytes ?? 16 * 1024 * 1024
  if (!Number.isInteger(maxScanBytes) || maxScanBytes <= 0) {
    throw new TypeError('maxScanBytes must be a positive integer')
  }
  return { enabled: config.enabled ?? true, root: path.resolve(root), maxScanBytes }
}
