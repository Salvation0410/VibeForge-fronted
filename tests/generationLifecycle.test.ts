import assert from 'node:assert/strict'
import test from 'node:test'

import {
  generationStatusPollDelay,
  isTruncatedWithoutPreview,
  resolveGenerationUiState,
} from '../src/utils/generationLifecycle.ts'

test('generation lifecycle stays stopping until backend becomes idle', () => {
  assert.equal(resolveGenerationUiState('RUNNING', 'running'), 'running')
  assert.equal(resolveGenerationUiState('STOPPING', 'running'), 'stopping')
  assert.equal(resolveGenerationUiState('RUNNING', 'stopping'), 'stopping')
  assert.equal(resolveGenerationUiState('COMMITTING', 'stopping'), 'stopping')
  assert.equal(resolveGenerationUiState('IDLE', 'stopping'), 'idle')
})

test('generation status polling backs off within a bounded interval', () => {
  assert.equal(generationStatusPollDelay(0), 400)
  assert.equal(generationStatusPollDelay(2), 800)
  assert.equal(generationStatusPollDelay(8), 1500)
})

test('truncated preview guidance only replaces an empty preview', () => {
  assert.equal(isTruncatedWithoutPreview('MODEL_OUTPUT_TRUNCATED', false), true)
  assert.equal(isTruncatedWithoutPreview('MODEL_OUTPUT_TRUNCATED', true), false)
  assert.equal(isTruncatedWithoutPreview('GENERATION_FAILED', false), false)
})
