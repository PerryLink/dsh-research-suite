// Post-build package gate for the suite bundle.
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'))
const fail = message => {
  console.error(`verify-package: ${message}`)
  process.exit(1)
}

for (const file of ['lib/index.js', 'lib/index.d.ts', 'cordis.patch.yml', 'README.md', 'README-zh.md', 'CHANGELOG.md', 'LICENSE']) {
  if (!existsSync(path.join(root, file))) fail(`missing ${file} (run pnpm run build)`)
}
for (const entry of ['lib', 'cordis.patch.yml']) {
  if (!(pkg.files ?? []).includes(entry)) fail(`package.json#files does not publish ${entry}`)
}
if (pkg.dsh?.bundle?.patch !== './cordis.patch.yml') fail('package.json#dsh.bundle.patch must point at cordis.patch.yml')
const dependencies = Object.keys(pkg.dependencies ?? {})
if (dependencies.length < 10) fail('the suite must depend on at least 10 research plugins')
if ((pkg.peerDependencies ?? {})['@deepseek-ai/dsh-tools'] === undefined) fail('the tool registry must be declared as a peer')
const patch = readFileSync(path.join(root, 'cordis.patch.yml'), 'utf8')
const names = [...patch.matchAll(/^\s+name:\s*'?([^'\n]+)'?\s*$/gmu)].map(match => match[1] ?? '')
for (const dependency of dependencies) {
  if (!names.includes(dependency)) fail(`cordis.patch.yml has no row for ${dependency}`)
}
console.log(`verify-package: ok (${dependencies.length} dependency rows, bundle patch and entries present)`)
