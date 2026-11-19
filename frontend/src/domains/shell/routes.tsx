import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { AppsPage } from '../apps-catalog/AppsPage'
import { CreateImagePage } from '../create-image/components/CreateImagePage'
import { BlankPage } from './BlankPage'
import { Layout } from './Layout'

/** Composition root for the frontend: the only place that wires domains to URLs. */
export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/apps" replace />} />
          <Route path="apps" element={<AppsPage />} />
          <Route path="apps/create-image" element={<CreateImagePage />} />
          <Route path="projects" element={<BlankPage title="Projects" />} />
          <Route path="library" element={<BlankPage title="Library" />} />
          <Route path="jobs" element={<BlankPage title="Jobs" />} />
          <Route path="discover" element={<BlankPage title="Discover" />} />
          <Route path="*" element={<Navigate to="/apps" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
