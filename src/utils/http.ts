import axios from 'axios'
import type { AxiosResponseTransformer } from 'axios'

const LARGE_INTEGER_VALUE_PATTERN = /(:\s*)(-?\d{16,})(?=\s*[,}\]])/g

export function parseApiResponseData(data: unknown) {
  if (typeof data !== 'string') {
    return data
  }

  const trimmed = data.trim()
  if (!trimmed) {
    return data
  }

  try {
    const normalized = trimmed.replace(LARGE_INTEGER_VALUE_PATTERN, '$1"$2"')
    return JSON.parse(normalized)
  } catch {
    return data
  }
}

const defaultTransformResponse = Array.isArray(axios.defaults.transformResponse)
  ? axios.defaults.transformResponse
  : axios.defaults.transformResponse
    ? [axios.defaults.transformResponse]
    : []

export const apiTransformResponse: AxiosResponseTransformer[] = [
  ...defaultTransformResponse,
  (data) => parseApiResponseData(data),
]
