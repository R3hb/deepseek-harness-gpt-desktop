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
    '@deepseek-ai/dsh': '0.1.0-rc.8',
    '@deepseek-ai/cordis-plugin-group': '1.0.1',
    '@deepseek-ai/dsh-anonymous-user-id': '0.1.0-rc.8',
    '@deepseek-ai/dsh-atomic-write': '0.1.0-rc.8',
    '@deepseek-ai/dsh-bash-local': '0.1.0-rc.8',
    '@deepseek-ai/dsh-code-runtime': '0.1.0-rc.8',
    '@deepseek-ai/dsh-compaction': '0.1.0-rc.8',
    '@deepseek-ai/dsh-fs': '0.1.0-rc.8',
    '@deepseek-ai/dsh-invariants': '0.1.0-rc.8',
    '@deepseek-ai/dsh-output-retention': '0.1.0-rc.8',
    '@deepseek-ai/dsh-sandbox': '0.1.0-rc.8',
    '@deepseek-ai/dsh-scope': '0.1.0-rc.8',
    '@deepseek-ai/dsh-session-telemetry': '0.1.0-rc.8',
    '@deepseek-ai/dsh-session-title-llm': '0.1.0-rc.8',
    '@deepseek-ai/dsh-shell': '0.1.0-rc.8',
    '@deepseek-ai/dsh-spill': '0.1.0-rc.8',
    '@deepseek-ai/dsh-subagent-in-process-driver': '0.1.0-rc.8',
    '@deepseek-ai/dsh-timeout': '0.1.0-rc.8',
    '@deepseek-ai/dsh-workflow': '0.1.0-rc.8',
    '@local/dsh-llm-codex-chatgpt': `file:../${tarball}`,
    sharp: '^0.35.3',
  },
}

writeFileSync(
  join(dshDir, 'package.json'),
  `${JSON.stringify(runtimePackage, null, 2)}\n`,
  'utf8',
)

// rc.8's bundle graph contains a wide peer-dependency mesh. npm 11's default
// peer solver can consume gigabytes while repeatedly resolving equivalent
// official package peers, so keep the runtime's exact pins and skip that pass.
runNpm(['install', '--legacy-peer-deps', '--no-audit', '--no-fund'], dshDir)

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
