// Verifies every relative Markdown link in CLAUDE.md / AGENTS.md / docs / domain CLAUDE.md files resolves.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const skip = new Set(['node_modules', '.git', '.venv', 'dist', 'data', '.context'])
const files = []
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    if (skip.has(name)) continue
    const path = join(dir, name)
    if (statSync(path).isDirectory()) walk(path)
    else if (name.endsWith('.md')) files.push(path)
  }
}
walk(root)

let broken = 0
for (const file of files) {
  const text = readFileSync(file, 'utf8').replace(/```[\s\S]*?```/g, '')
  for (const [, target] of text.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
    if (/^(https?:|mailto:|#)/.test(target)) continue
    const path = join(dirname(file), decodeURI(target.split('#')[0]))
    if (!existsSync(path)) {
      console.error(`${relative(root, file)} → ${target}`)
      broken++
    }
  }
}
console.log(`${files.length} markdown files checked, ${broken} broken link(s).`)
process.exit(broken ? 1 : 0)
