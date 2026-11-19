// Runs the API and the web app together with prefixed output; Ctrl+C stops both.
// Usage: node scripts/run-both.mjs dev|start
import { spawn } from 'node:child_process'

const mode = process.argv[2] === 'start' ? 'start' : 'dev'
const procs = [
  { name: 'api', color: 34, script: `${mode}:api` },
  { name: 'web', color: 35, script: `${mode}:web` },
]

let shuttingDown = false
const children = procs.map(({ name, color, script }) => {
  const child = spawn('npm', ['run', '--silent', script], { stdio: ['ignore', 'pipe', 'pipe'], detached: process.platform !== 'win32', shell: process.platform === 'win32' })
  const prefix = `\x1b[${color}m[${name}]\x1b[0m `
  const pipe = (stream, out) => {
    let buffer = ''
    stream.on('data', (chunk) => {
      buffer += chunk
      const lines = buffer.split('\n')
      buffer = lines.pop()
      for (const line of lines) out.write(prefix + line + '\n')
    })
  }
  pipe(child.stdout, process.stdout)
  pipe(child.stderr, process.stderr)
  child.on('exit', (code) => {
    if (!shuttingDown) {
      console.error(`${prefix}exited with code ${code}; stopping the other process.`)
      stopAll(code ?? 1)
    }
  })
  return child
})

function stopAll(code = 0) {
  shuttingDown = true
  for (const child of children) {
    if (child.exitCode !== null) continue
    try {
      if (process.platform === 'win32') child.kill('SIGINT')
      else process.kill(-child.pid, 'SIGINT') // whole process group (npm → uv → uvicorn)
    } catch {
      // already gone
    }
  }
  setTimeout(() => process.exit(code), 4000).unref()
  Promise.all(children.map((c) => (c.exitCode !== null ? null : new Promise((r) => c.on('exit', r))))).then(() => process.exit(code))
}

process.on('SIGINT', () => stopAll(0))
process.on('SIGTERM', () => stopAll(0))
