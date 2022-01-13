import { nestedKeyExists } from '~/assets/js/utils'

export function hasAtLeastOneEntityTypeWithPermission (user, projectName, scope, permission) {
  if (
    user == null || user === false ||
    projectName == null || scope == null || permission == null
  ) {
    return false
  }

  if (nestedKeyExists(user, 'permissions', projectName, 'entities')) {
    for (const scopePermissions of Object.values(user.permissions[projectName].entities)) {
      if (
        scope in scopePermissions &&
        permission in scopePermissions[scope]
      ) {
        return true
      }
    }
  }

  return false
}

export function hasProjectAdminAccess (user, projectName) {
  if (hasAtLeastOneEntityTypeWithPermission(user, projectName, 'es_data', 'index')) {
    return true
  }
  return false
}

export function hasEntityTypePermission (user, projectName, entityTypeName, scope, permission) {
  if (
    user == null || user === false ||
    projectName == null || entityTypeName == null || scope == null || permission == null
  ) {
    return false
  }

  if (nestedKeyExists(user, 'permissions', projectName, 'entities', entityTypeName)) {
    return true
  }

  return false
}
