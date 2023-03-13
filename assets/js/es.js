export const MAX_INT = 2147483647

export function getFields (entityTypeConfig) {
  const fields = []
  for (const fieldConfig of entityTypeConfig.elasticsearch.columns) {
    if (fieldConfig.subField != null) {
      fields.push({
        key: `${fieldConfig.systemName}.${fieldConfig.subField}`,
        label: fieldConfig.displayName,
        sortable: fieldConfig.sortable,
        searchable: fieldConfig.searchable,
        type: fieldConfig.subFieldType ?? fieldConfig.type,
        mainLink: fieldConfig.mainLink,
        link: fieldConfig.link,
        subField: fieldConfig.subField
      })
    } else {
      fields.push({
        key: fieldConfig.systemName,
        label: fieldConfig.displayName,
        sortable: fieldConfig.sortable,
        searchable: fieldConfig.searchable,
        type: fieldConfig.type,
        mainLink: fieldConfig.mainLink,
        link: fieldConfig.link
      })
    }
  }
  return fields
}

export function getFilterDefs (entityTypeConfig) {
  const filterDefs = {}
  for (const section of entityTypeConfig.elasticsearch.filters) {
    for (const filter of section.filters) {
      filterDefs[filter.systemName] = filter
    }
  }
  return filterDefs
}
