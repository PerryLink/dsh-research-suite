# @perrylink/dsh-research-suite

**One command for the research family — plus a doctor that tells you whether the evidence store is healthy.**

*Installs the evidence, verification, systematic-review and report plugins as one bundle layer, and mounts `research_doctor`: a read-only check of the REP root, the mounted services, every journal and the latest sealed record.*

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%5E22.19%20%7C%7C%20%3E%3D24.9-brightgreen.svg)]()
[![DSH plugin](https://img.shields.io/badge/dsh--plugin-✅-green)](https://github.com/topics/dsh-plugin)

English · [简体中文](README-zh.md)

---

## Why a bundle

The research family is deliberately separate packages: `dsh-research-core`, `dsh-doc-anchor`, `dsh-cite-verify`, `dsh-claim-check`, `dsh-statcheck`, `dsh-retraction-watch`, `dsh-repro-audit`, `dsh-sr-ledger`, `dsh-meta-analysis`, `dsh-manuscript-check`, `dsh-research-report` and `dsh-library`. That is good for composition and bad for onboarding: a new profile needs twelve installs and a way to tell whether the rows actually mounted.

This package is the **bundle** for that set. One dependency tree, one `cordis.patch.yml`, one `research_doctor` row. It does not re-implement any tool.

## Install

```sh
dsh plugin --profile <name> add @perrylink/dsh-research-suite
dsh --profile <name> --dump-config | grep -E 'research|cite-verify|doc-anchor|statcheck|claim-check|sr-ledger|meta-analysis|manuscript|retraction|repro-audit|library'
```

Then ask the agent:

```text
Run research_doctor.
```

A healthy profile reports `research_doctor: ok`, both services `on`, and the latest record as `(sealed)`.

## What `research_doctor` checks

| Check | Meaning |
|---|---|
| `services.researchEvidence` | `ctx.researchEvidence` is mounted (core active) |
| `services.researchReport` | `ctx.researchReport` is mounted (`dsh-research-report` active) |
| `journals[]` | `snapshots/evidence/evidence-checks/claims/verdicts/audits.jsonl`: exists, bytes, lines, malformed |
| `records` | sealed `records/*.rep.json` count, malformed files, latest record id/createdAt/evidence/claims/sealed |
| `hints[]` | what to fix next (missing root, no record, unsealed record, malformed journal, missing service) |

It is **read-only**. It never repairs, deletes, edits or creates a record. A malformed journal makes the status `error` because every count derived from it would be unreliable; a missing store is only `warn` (a fresh profile has no records yet).

## Compatibility

| | |
|---|---|
| DeepSeek Harness | `dsh-v0.2.1-rc.5` (verified on this machine) — peer line `>=0.2.1-0 <0.3.0 \|\| >=0.2.2-0 <0.3.0` |
| Node | `^22.19.0 \|\| >=24.9.0` (tested on `24.22.1`), ESM only |
| Peers | `@deepseek-ai/cordis ^4.0.5-alpha.1`, `@deepseek-ai/dsh-tools`, `@deepseek-ai/schemastery ^3.18.5-alpha.1` |
| Runtime dependencies | the twelve research plugins (pinned) |
| Store | `.research-rep` (same default as `dsh-research-core`) |

## Configuration

| Key | Default | Meaning |
|---|---|---|
| `enabled` | `true` | `false` mounts no doctor tool (the other rows stay) |
| `root` | `.research-rep` | REP root the doctor reads, resolved against the harness working directory |
| `maxScanBytes` | `16777216` | per-journal/file scan cap; larger files are counted but not parsed |

The doctor also accepts a per-call `root` override.

## What this package does not do

- **No tools of its own beyond the doctor.** All evidence/verification/report tools belong to their plugins.
- **No automatic repair.** A malformed journal is reported, never rewritten.
- **No telemetry, no network.** The doctor reads local files and `ctx.get`.
- **No hidden install.** The bundle is a normal package dependency tree; uninstall it like any other plugin.

## Development

```sh
pnpm install
pnpm typecheck
pnpm test
pnpm build
pnpm verify:package
```

## License

Apache-2.0. See [LICENSE](LICENSE).
