import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppRouter } from './domains/shell/routes'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppRouter />
  </StrictMode>,
)
