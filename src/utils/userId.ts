export type UserIdLike = string | number | null | undefined

export function normalizeUserId(value: UserIdLike): string | undefined {
  if (value === null || value === undefined) {
    return undefined
  }

  const normalized = String(value).trim()
  return normalized ? normalized : undefined
}

export function isSameUserId(left: UserIdLike, right: UserIdLike): boolean {
  const normalizedLeft = normalizeUserId(left)
  const normalizedRight = normalizeUserId(right)

  if (!normalizedLeft || !normalizedRight) {
    return false
  }

  return normalizedLeft === normalizedRight
}
