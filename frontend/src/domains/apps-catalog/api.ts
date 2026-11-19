import { requestJson } from '../../shared/api/http'

export interface AppEntry {
  id: string
  name: string
  description: string
  path: string
}

export async function fetchApps(): Promise<AppEntry[]> {
  return (await requestJson<{ items: AppEntry[] }>('/api/apps')).items
}
