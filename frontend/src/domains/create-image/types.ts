/** Mirrors backend/app/domains/generations/schemas.py. */

export type GenerationStatus = 'queued' | 'processing' | 'succeeded' | 'failed'
export type AspectRatio = '1:1' | '16:9' | '9:16'
export type Style = 'Photorealistic' | 'Illustration' | 'Cinematic'

export interface Generation {
  id: string
  prompt: string
  aspect_ratio: AspectRatio
  style: Style
  provider: string
  status: GenerationStatus
  version: number
  attempts: number
  error: string | null
  image_url: string | null
  created_at: string
  updated_at: string
  started_at: string | null
  completed_at: string | null
}

export interface GenerationOptions {
  aspect_ratios: AspectRatio[]
  styles: Style[]
  default_aspect_ratio: AspectRatio
  default_style: Style
  prompt_max_length: number
  example_prompt: string
}

export interface CreateGenerationInput {
  prompt: string
  aspect_ratio: AspectRatio
  style: Style
}

export const isActive = (g: Generation) => g.status === 'queued' || g.status === 'processing'
