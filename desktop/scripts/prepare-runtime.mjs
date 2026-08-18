import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const desktopDir = dirname(scriptDir)
const pluginDir = join(desktopDir, 'codex-llm-plugin')
const runtimeDir = join(desktopDir, 'runtime')
const dshDir = join(runtimeDir, 'dsh')
const npmCli = process.env.npm_execpath
const pluginPackage = JSON.parse(readFileSync(join(pluginDir, 'package.json'), 'utf8'))
const tarball = `local-dsh-llm-codex-chatgpt-${pluginPackage.version}.tgz`

if (npmCli === undefined || npmCli.length === 0) {
  throw new Error('prepare-runtime must be started through npm run prepare:runtime')
}

function runNpm(args, cwd) {
  execFileSync(process.execPath, [npmCli, ...args], {
    cwd,
    stdio: 'inherit',
  })
}

mkdirSync(dshDir, { recursive: true })

runNpm(['pack', '--pack-destination', runtimeDir], pluginDir)

const runtimePackage = {
  name: 'deepseek-harness-gpt-runtime',
  private: true,
  dependencies: {
    '@deepseek-ai/dsh': '0.1.0-rc.7',
    '@local/dsh-llm-codex-chatgpt': `file:../${tarball}`,
    sharp: '^0.35.3',
  },
}

writeFileSync(
  join(dshDir, 'package.json'),
  `${JSON.stringify(runtimePackage, null, 2)}\n`,
  'utf8',
)

runNpm(['install', '--no-audit', '--no-fund'], dshDir)

for (const packagePath of [
  '@deepseek-ai/dsh/package.json',
  '@local/dsh-llm-codex-chatgpt/package.json',
  '@openai/codex-sdk/package.json',
  '@openai/codex/package.json',
]) {
  const fullPath = join(dshDir, 'node_modules', ...packagePath.split('/'))
  const pkg = JSON.parse(readFileSync(fullPath, 'utf8'))
  console.log(`${pkg.name}@${pkg.version}`)
}

console.log(`Runtime ready at ${relative(desktopDir, dshDir)}`)
