export const MAX_INT = 2147483647

export function getFields (entityTypeConfig) {
  const fields = []
  if (entityTypeConfig.elasticsearch != null && 'columns' in entityTypeConfig.elasticsearch) {
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
  } else {
    fields.push({
      key: 'edit_relation_title',
      label: 'Id and title',
      sortable: true,
      type: 'nested',
      mainLink: true,
      link: null
    })
  }
  return fields
}

export function getFilterDefs (entityTypeConfig) {
  // TODO: rethink default value (edit_relation_title)
  const filterDefs = {}
  if (entityTypeConfig.elasticsearch != null && 'filters' in entityTypeConfig.elasticsearch) {
    for (const section of entityTypeConfig.elasticsearch.filters) {
      for (const filter of section.filters) {
        filterDefs[filter.systemName] = filter
      }
    }
  } else {
    return {
      edit_relation_title: {
        systemName: 'edit_relation_title',
        displayName: 'Id and title',
        type: 'nested'
      }
    }
  }
  return filterDefs
}
