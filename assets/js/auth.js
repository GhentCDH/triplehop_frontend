export function hasGlobalPermission (user, permission) {
  if (user == null || user === false) {
    return false
  }

  // Check for specific or all on permission level
  for (const perm of ['__all__', permission]) {
    if (
      perm in user.permissions &&
      '__all__' in user.permissions[perm]
    ) {
      return true
    }
  }

  return false
}

export function hasOneOfGlobalPermissions (user, permissions) {
  if (user == null || user === false) {
    return false
  }

  for (const permission of permissions) {
    if (hasGlobalPermission(user, permission)) {
      return true
    }
  }

  return false
}

export function hasGlobalAdminAccess (user) {
  if (user == null) {
    return false
  }

  return hasOneOfGlobalPermissions(user, [])
}

export function hasProjectPermission (user, projectName, permission) {
  if (user == null || user === false) {
    return false
  }

  if (projectName == null) {
    return false
  }

  // Check for specific or all on permission, project level
  for (const perm of ['__all__', permission]) {
    for (const proj of ['__all__', projectName]) {
      if (
        perm in user.permissions &&
        proj in user.permissions[perm]
      ) {
        return true
      }
    }
  }

  return false
}

export function hasOneOfProjectPermissions (user, projectName, permissions) {
  if (user == null || user === false) {
    return false
  }

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

export function hasProjectAdminAccess (user, projectName) {
  return hasOneOfProjectPermissions(user, projectName, ['es_index'])
}

export function hasEntityPermission (user, projectName, entityName, permission) {
  if (user == null || user === false) {
    return false
  }

  if (projectName == null) {
    return false
  }

  if (entityName == null) {
    return false
  }

  // Check for specific or all on permission, project, entity level
  for (const perm of ['__all__', permission]) {
    for (const proj of ['__all__', projectName]) {
      for (const ent of ['__all__', entityName]) {
        if (
          perm in user.permissions &&
          proj in user.permissions[perm] &&
          ent in user.permissions[perm][proj].entities
        ) {
          return true
        }
      }
    }
  }

  return false
}
