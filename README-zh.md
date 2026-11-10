# @perrylink/dsh-research-suite

**一条命令装好科研插件族 —— 再加一个体检工具，告诉你证据库是否健康。**

*把证据、核验、系统综述与报告插件作为一个 bundle 层安装，并挂载 `research_doctor`：只读检查 REP 根、已挂载的服务、每个 journal，以及最新一条密封记录。*

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%5E22.19%20%7C%7C%20%3E%3D24.9-brightgreen.svg)]()
[![DSH plugin](https://img.shields.io/badge/dsh--plugin-✅-green)](https://github.com/topics/dsh-plugin)

[English](README.md) · 简体中文

---

## 为什么要 bundle

科研族是刻意拆开的独立包：`dsh-research-core`、`dsh-doc-anchor`、`dsh-cite-verify`、`dsh-claim-check`、`dsh-statcheck`、`dsh-retraction-watch`、`dsh-repro-audit`、`dsh-sr-ledger`、`dsh-meta-analysis`、`dsh-manuscript-check`、`dsh-research-report` 与 `dsh-library`。这对组合有利，对上手不利：新 profile 要装十二次，而且装完不知道行有没有真的挂上。

这个包就是那套东西的 **bundle**：一棵依赖树、一个 `cordis.patch.yml`、一行 `research_doctor`。它不重新实现任何工具。

## 安装

```sh
dsh plugin --profile <name> add @perrylink/dsh-research-suite
dsh --profile <name> --dump-config | grep -E 'research|cite-verify|doc-anchor|statcheck|claim-check|sr-ledger|meta-analysis|manuscript|retraction|repro-audit|library'
```

然后对 agent 说：

```text
Run research_doctor.
```

健康的 profile 会报告 `research_doctor: ok`、两个服务都 `on`，最新记录带 `(sealed)`。

## `research_doctor` 检查什么

| 检查 | 含义 |
|---|---|
| `services.researchEvidence` | `ctx.researchEvidence` 已挂载（core 生效） |
| `services.researchReport` | `ctx.researchReport` 已挂载（`dsh-research-report` 生效） |
| `journals[]` | `snapshots/evidence/evidence-checks/claims/verdicts/audits.jsonl`：是否存在、字节数、行数、坏行数 |
| `records` | 密封的 `records/*.rep.json` 数量、坏文件数、最新记录的 id/createdAt/evidence/claims/sealed |
| `hints[]` | 下一步该修什么（没有根、没有记录、记录未密封、journal 坏行、服务缺失） |

它是**只读**的：不修复、不删除、不改写、不创建记录。journal 有坏行时状态是 `error`，因为由它推导出的每个计数都不可信；根不存在只是 `warn`（新 profile 本来就没有记录）。

## 兼容性

| | |
|---|---|
| DeepSeek Harness | `dsh-v0.2.1-rc.5`（本机实测）—— peer 区间 `>=0.2.1-0 <0.3.0 \|\| >=0.2.2-0 <0.3.0` |
| Node | `^22.19.0 \|\| >=24.9.0`（实测 `24.22.1`），仅 ESM |
| Peers | `@deepseek-ai/cordis ^4.0.5-alpha.1`、`@deepseek-ai/dsh-tools`、`@deepseek-ai/schemastery ^3.18.5-alpha.1` |
| 运行时依赖 | 十二个科研插件（固定版本） |
| 存储 | `.research-rep`（与 `dsh-research-core` 默认一致） |

## 配置

| 键 | 默认 | 含义 |
|---|---|---|
| `enabled` | `true` | `false` 不挂载 doctor 工具（其他行不变） |
| `root` | `.research-rep` | doctor 读取的 REP 根，相对 harness 工作目录解析 |
| `maxScanBytes` | `16777216` | 单文件扫描上限；更大的文件只计数、不解析 |

doctor 也接受单次调用的 `root` 覆盖。

## 它不做什么

- **除了 doctor 没有自己的工具。** 证据、核验、报告工具都属于各自的插件。
- **不自动修复。** journal 坏了只报告，不重写。
- **不联网、不埋点。** doctor 只读本地文件与 `ctx.get`。
- **不偷偷安装。** bundle 就是普通的包依赖树，按普通插件卸载即可。

## 开发

```sh
pnpm install
pnpm typecheck
pnpm test
pnpm build
pnpm verify:package
```

## 许可

Apache-2.0，见 [LICENSE](LICENSE)。
