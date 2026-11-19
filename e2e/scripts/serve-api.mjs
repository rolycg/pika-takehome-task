// webServer entry for the main e2e suite: fresh data dir, real backend on the e2e port.
import { spawn } from 'node:child_process'
import { existsSync, rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const e2eDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const backendDir = path.resolve(e2eDir, '..', 'backend')
const dataDir = path.join(e2eDir, '.data', 'suite')
rmSync(dataDir, { recursive: true, force: true })

const python = process.platform === 'win32'
  ? path.join(backendDir, '.venv', 'Scripts', 'python.exe')
  : path.join(backendDir, '.venv', 'bin', 'python')
if (!existsSync(python)) {
  console.error(`Backend venv missing at ${python}. Run \`npm run setup\` first.`)
  process.exit(1)
}

const child = spawn(
  python,
  ['-m', 'uvicorn', '--factory', 'app.main:create_app', '--host', '127.0.0.1', '--port', process.env.API_PORT ?? '8100', '--timeout-graceful-shutdown', '1'],
  { cwd: backendDir, stdio: 'inherit', env: { ...process.env, DATA_DIR: dataDir } },
)
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => child.kill(sig))
child.on('exit', (code) => process.exit(code ?? 0))
