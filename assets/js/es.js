export function constructQuery (body) {
  return {}
}

export function extractFields (config) {
  const fields = []
  for (const fieldConfig of config) {
    fields.push({
      key: fieldConfig.systemName,
      label: fieldConfig.displayName
    })
  }
  return fields
}

export function extractItems (keys, data) {
  const items = []
  for (const hit of data.hits.hits) {
    const item = {}
    for (const key of keys) {
      item[key] = hit._source[key]
    }
    items.push(item)
  }
  return items
}

export function extractSystemNames (config) {
  const systemNames = []
  for (const fieldConfig of config) {
    systemNames.push(fieldConfig.systemName)
  }
  return systemNames
}

export function extractTotal (data) {
  return data.hits.total
}
