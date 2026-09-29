export type GenerationUiState = 'idle' | 'running' | 'stopping'
export type GenerationBackendState = 'IDLE' | 'RUNNING' | 'STOPPING' | 'COMMITTING'

export function resolveGenerationUiState(
  backendState: GenerationBackendState,
  currentState: GenerationUiState,
): GenerationUiState {
  if (backendState === 'IDLE') return 'idle'
  if (backendState === 'RUNNING' && currentState !== 'stopping') return 'running'
  return 'stopping'
}

export function generationStatusPollDelay(attempt: number): number {
  if (attempt < 2) return 400
  if (attempt < 5) return 800
  return 1500
}

export function isTruncatedWithoutPreview(errorCode: string | undefined, hasPreview: boolean) {
  return errorCode === 'MODEL_OUTPUT_TRUNCATED' && !hasPreview
}
