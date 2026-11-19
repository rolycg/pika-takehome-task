/**
 * Starts a real backend process (uvicorn from backend/.venv) with its own DATA_DIR.
 * Used by the main suite (via scripts/serve-api.mjs) and by restart specs that need to
 * stop/kill/restart the server themselves.
 */
import { spawn, type ChildProcess } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { BACKEND_DIR, MOCK_ENV } from './env.ts'

const PYTHON = process.platform === 'win32'
  ? path.join(BACKEND_DIR, '.venv', 'Scripts', 'python.exe')
  : path.join(BACKEND_DIR, '.venv', 'bin', 'python')

export interface ApiProcess {
  url: string
  child: ChildProcess
  /** Graceful stop (SIGTERM) or crash (SIGKILL). Resolves once the process has exited. */
  stop(signal?: NodeJS.Signals): Promise<void>
}

export async function startApi(port: number, dataDir: string, extraEnv: Record<string, string> = {}): Promise<ApiProcess> {
  if (!existsSync(PYTHON)) throw new Error(`Backend venv missing at ${PYTHON}. Run \`npm run setup\` first.`)
  const url = `http://127.0.0.1:${port}`
  const child = spawn(
    PYTHON,
    ['-m', 'uvicorn', '--factory', 'app.main:create_app', '--host', '127.0.0.1', '--port', String(port), '--timeout-graceful-shutdown', '1'],
    { cwd: BACKEND_DIR, env: { ...process.env, ...MOCK_ENV, DATA_DIR: dataDir, ...extraEnv }, stdio: ['ignore', 'pipe', 'pipe'] },
  )
  let output = ''
  child.stdout?.on('data', (d) => (output += d))
  child.stderr?.on('data', (d) => (output += d))

  const deadline = Date.now() + 30_000
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`API exited early:\n${output}`)
    try {
      if ((await fetch(`${url}/api/health`)).ok) break
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 200))
  }

  return {
    url,
    child,
    stop: (signal = 'SIGTERM') =>
      new Promise<void>((resolve) => {
        if (child.exitCode !== null || child.signalCode !== null) return resolve()
        child.once('exit', () => resolve())
        child.kill(signal)
      }),
  }
}
