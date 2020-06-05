export function constructQuery (body, entityTypeConfig) {
  const sort = {}
  for (const key in body.sort) {
    if (entityTypeConfig.es_columns.filter(c => c.systemName === key)[0].type === 'text') {
      sort[`${key}.keyword`] = body.sort[key]
    } else {
      sort[key] = body.sort[key]
    }
  }
  return {
    sort,
    from: body.from,
    size: body.size
  }
}

export function extractFields (entityTypeConfig) {
  const fields = []
  for (const fieldConfig of entityTypeConfig.es_columns) {
    fields.push({
      key: fieldConfig.systemName,
      label: fieldConfig.displayName,
      sortable: fieldConfig.sortable
    })
  }
  return fields
}

export function extractItems (keys, data, entityTypeName) {
  const items = []
  for (const hit of data.hits.hits) {
    const item = {}
    for (const [index, key] of keys.entries()) {
      // TODO: make linked column configurable
      if (index === 0) {
        item[key] = {
          entity_type_name: entityTypeName,
          id: hit._id,
          name: hit._source[key]
        }
      } else {
        item[key] = hit._source[key]
      }
    }
    items.push(item)
  }
  return items
}

export function extractSystemNames (entityTypeConfig) {
  const systemNames = []
  for (const fieldConfig of entityTypeConfig.es_columns) {
    systemNames.push(fieldConfig.systemName)
  }
  return systemNames
}

export function extractTotal (data) {
  return data.hits.total
}
