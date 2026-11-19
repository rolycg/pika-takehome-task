// Deletes local generation history and stored assets (everything in data/ except .gitkeep).
// Refuses to run while the API is up, because the server holds the SQLite database open.
import { readdirSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const dataDir = process.env.DATA_DIR ?? join(dirname(fileURLToPath(import.meta.url)), '..', 'data')

try {
  const res = await fetch('http://127.0.0.1:8000/api/health', { signal: AbortSignal.timeout(500) })
  if (res.ok) {
    console.error('The API is running on :8000. Stop `npm run dev` first, then run `npm run reset-data` again.')
    process.exit(1)
  }
} catch {
  // not running: good
}

let removed = 0
for (const entry of readdirSync(dataDir)) {
  if (entry === '.gitkeep') continue
  rmSync(join(dataDir, entry), { recursive: true, force: true })
  removed++
}
console.log(`Reset ${dataDir} (${removed} entr${removed === 1 ? 'y' : 'ies'} removed).`)
