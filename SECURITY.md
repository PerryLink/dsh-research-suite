# Security

## Scope

`@perrylink/dsh-research-suite` is a bundle plus one read-only tool. It declares
the twelve research plugins as dependencies and mounts `research_doctor`; it
re-implements no tool.

- **Read-only doctor.** `research_doctor` reads the configured REP root, the
  mounted services, the journal files and the latest sealed record. It writes
  nothing and deletes nothing.
- **No network.** The package opens no sockets and reads no environment
  secrets.
- **Bounded scanning.** Journal and record reads are capped (`maxBytes` /
  scan limits), and a malformed journal is reported as an error instead of being
  silently counted.
- **The tools stay in their own packages.** `cite_verify`, `claim_check`,
  `lit_search`, `repro_audit`, `dmp`, … are provided by the dependency packages
  and documented in their own SECURITY files. This package grants no additional
  capability.

## Supported versions

The latest published `0.1.x` release receives security fixes.

## Reporting a vulnerability

Please use GitHub's private vulnerability reporting (Security → Advisories) on
<https://github.com/PerryLink/dsh-research-suite>, or open a minimal issue
asking for a private channel if advisories are unavailable. Do not include
credentials, personal data or unpublished manuscripts in a public issue.
