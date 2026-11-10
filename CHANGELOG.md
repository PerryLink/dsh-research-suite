# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-11-10

### Added

- `@perrylink/dsh-research-suite`: one bundle layer for `dsh-research-core`,
  `dsh-doc-anchor`, `dsh-cite-verify`, `dsh-claim-check`, `dsh-statcheck`,
  `dsh-retraction-watch`, `dsh-repro-audit`, `dsh-sr-ledger`,
  `dsh-meta-analysis`, `dsh-manuscript-check`, `dsh-research-report` and
  `dsh-library`.
- `research_doctor`: read-only REP inspection (root, mounted services, journal
  line/malformed counts, sealed-record count and latest record, actionable
  hints). It never repairs or writes.
