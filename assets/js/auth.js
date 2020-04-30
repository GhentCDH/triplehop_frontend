export function hasGlobalPermission (user, permission) {
  if (
    permission in user.permissions &&
    '__all__' in user.permissions[permission]
  ) {
    return true
  }
}

export function hasOneOfGlobalPermissions (user, permissions) {
  for (const permission of permissions) {
    if (hasGlobalPermission(user, permission)) {
      return true
    }
  }
  return false
}

export function displayGlobalAdminLink (user) {
  return hasOneOfGlobalPermissions(user, [])
}

export function hasProjectPermission (user, projectName, permission) {
  if (projectName == null) {
    return false
  }

  if (
    permission in user.permissions && (
      '__all__' in user.permissions[permission] ||
      projectName in user.permissions[permission]
    )
  ) {
    return true
  }

  return false
}

export function hasOneOfProjectPermissions (user, projectName, permissions) {
  if (projectName == null) {
    return false
  }

  for (const permission of permissions) {
    if (hasProjectPermission(user, projectName, permission)) {
      return true
    }
  }

  return false
}

export function displayProjectAdminLink (user, projectName) {
  return hasOneOfProjectPermissions(user, projectName, ['es_index'])
}

export function hasEntityPermission (user, projectName, entityName, permission) {
  if (!hasProjectPermission(user, projectName, permission)) {
    return false
  }

  if (entityName == null) {
    return false
  }

  if (
    '__all__' in user.permissions[permission] && (
      '__all__' in user.permissions[permission].__all__ ||
      entityName in user.permissions[permission].__all__
    )
  ) {
    return true
  }

  if (
    projectName in user.permissions[permission] && (
      '__all__' in user.permissions[permission][projectName] ||
      entityName in user.permissions[permission][projectName]
    )
  ) {
    return true
  }

  return false
}
