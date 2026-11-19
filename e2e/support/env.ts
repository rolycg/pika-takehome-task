/** Ports and timings shared by the Playwright config and the specs. Isolated from `npm run dev` (8000/5173). */
import { fileURLToPath } from 'node:url'
import path from 'node:path'

export const E2E_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const BACKEND_DIR = path.resolve(E2E_DIR, '..', 'backend')
export const FRONTEND_DIR = path.resolve(E2E_DIR, '..', 'frontend')

export const API_PORT = 8100
export const WEB_PORT = 5180
export const API_URL = `http://127.0.0.1:${API_PORT}`
export const WEB_URL = `http://127.0.0.1:${WEB_PORT}`

/** Mock delays for e2e: short, but long enough that every state is observable. */
export const MOCK_ENV = {
  MOCK_QUEUED_DELAY_S: '1.0',
  MOCK_PROCESSING_DELAY_S: '1.5',
}
