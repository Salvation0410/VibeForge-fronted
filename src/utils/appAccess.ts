import type { AppVO } from '@/api/app'
import type { LoginUserVO } from '@/api/sysUserApi'
import { isAdminRole } from './appUtils'

type LoginUserInfo = LoginUserVO['user'] | null | undefined

export function canManageApp(user: LoginUserInfo, app?: AppVO | null) {
  if (!user?.id || !app?.id) {
    return false
  }
  if (isAdminRole(user.userRole)) {
    return true
  }
  return String(user.id) === String(app.userId)
}

export function canEditApp(user: LoginUserInfo, app?: AppVO | null) {
  return canManageApp(user, app)
}

export function canViewApp(user: LoginUserInfo, app?: AppVO | null) {
  if (!app?.id) {
    return false
  }
  if ((app.priority ?? 0) >= 99) {
    return true
  }
  return canManageApp(user, app)
}
