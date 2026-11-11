# Third-party notices

## Runtime code

This package bundles no third-party source code. It is a bundle: its runtime
dependencies are twelve PerryLink research plugins, all Apache-2.0 and all
published from the same family:

`@perrylink/dsh-claim-check`, `@perrylink/dsh-research-core`,
`dsh-cite-verify`, `dsh-doc-anchor`, `dsh-library`, `dsh-manuscript-check`,
`dsh-meta-analysis`, `dsh-repro-audit`, `dsh-research-report`,
`dsh-retraction-watch`, `dsh-sr-ledger`, `dsh-statcheck`.

Their only third-party runtime dependency is [`zod`](https://github.com/colinhacks/zod)
`4.4.3` (MIT), reached transitively through `dsh-library`. The rest of the
family declares no runtime dependencies.

`@deepseek-ai/cordis`, `@deepseek-ai/dsh-tools` and `@deepseek-ai/schemastery`
are peer dependencies provided by the host runtime; they are not bundled in
this package's tarball.

## Development-only tooling

TypeScript, Vitest and `@types/node` are development dependencies. They are not
bundled and are not part of the published tarball.

## License

`@perrylink/dsh-research-suite` is licensed under Apache-2.0. See
[LICENSE](LICENSE).
