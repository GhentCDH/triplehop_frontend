import { COLOR_PRIMARY } from '~/assets/js/variables'

export function constructQuery (body, entityTypeConfig) {
  const result = {
    from: body.from,
    size: body.size
  }

  const aggs = {}
  const filterDefs = {}
  for (const section of entityTypeConfig.es_filters) {
    for (const filter of section.filters) {
      if (filter.type === 'histogram_slider') {
        aggs[`${filter.systemName}_hist`] = {
          histogram: {
            field: filter.systemName,
            interval: filter.interval
          }
        }
        if (
          `${filter.systemName}_min` in body.fullRangeData &&
          `${filter.systemName}_max` in body.fullRangeData
        ) {
          const min = body.fullRangeData[`${filter.systemName}_min`]
          const max = body.fullRangeData[`${filter.systemName}_max`]
          aggs[`${filter.systemName}_hist`].histogram.extended_bounds = {
            min: min - (min % filter.interval),
            max: max - (max % filter.interval)
          }
        }
        aggs[`${filter.systemName}_min`] = {
          min: {
            field: filter.systemName
          }
        }
        aggs[`${filter.systemName}_max`] = {
          max: {
            field: filter.systemName
          }
        }
      }
      filterDefs[filter.systemName] = filter
    }
  }
  if (Object.keys(aggs).length > 0) {
    result.aggs = aggs
  }

  const sort = []
  for (const sortPart of body.sort) {
    const key = Object.keys(sortPart)[0]
    const newSortPart = {}
    if (entityTypeConfig.es_columns.filter(c => c.systemName === key)[0].type === 'nested') {
      newSortPart[`${key}.name.keyword`] = {
        mode: sortPart[key] === 'desc' ? 'max' : 'min',
        order: sortPart[key],
        nested: {
          path: key
        }
      }
    } else if (entityTypeConfig.es_columns.filter(c => c.systemName === key)[0].type === 'text') {
      newSortPart[`${key}.keyword`] = sortPart[key]
    } else {
      newSortPart[key] = sortPart[key]
    }
    sort.push(newSortPart)
  }
  if (sort.length > 0) {
    result.sort = sort
  }

  const query = {
    bool: {
      must: []
    }
  }
  for (const systemName in body.filters) {
    if (filterDefs[systemName].type === 'histogram_slider') {
      const queryPart = {
        range: {}
      }
      queryPart.range[systemName] = {}
      if (body.filters[systemName][0] != null) {
        queryPart.range[systemName].gte = body.filters[systemName][0]
      }
      if (body.filters[systemName][1] != null) {
        queryPart.range[systemName].lte = body.filters[systemName][1]
      }
      if (Object.keys(queryPart.range[systemName]).length > 0) {
        query.bool.must.push(queryPart)
      }
      continue
    }
    if (body.filters[systemName] != null) {
      const queryPart = {
        match: {}
      }
      queryPart.match[systemName] = { query: body.filters[systemName] }
      if (filterDefs[systemName].type === 'autocomplete') {
        queryPart.match[systemName].operator = 'and'
      }
      query.bool.must.push(queryPart)
    }
  }
  if (query.bool.must.length > 0) {
    result.query = query
  }

  return result
}

export function constructFullRangeAggQuery (esFiltersDefs) {
  const result = {
    size: 0
  }

  const aggs = {}
  for (const systemName in esFiltersDefs) {
    if (esFiltersDefs[systemName].type === 'histogram_slider') {
      aggs[`${systemName}_min`] = {
        min: {
          field: systemName
        }
      }
      aggs[`${systemName}_max`] = {
        max: {
          field: systemName
        }
      }
    }
  }
  if (Object.keys(aggs).length > 0) {
    result.aggs = aggs
  }

  return result
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

export function extractAggs (data) {
  if (data.aggregations == null) {
    return null
  }
  const result = {}
  for (const aggName in data.aggregations) {
    if (aggName.endsWith('_hist')) {
      result[aggName] = {
        labels: [],
        datasets: [
          {
            backgroundColor: COLOR_PRIMARY,
            data: []
          }
        ]
      }
      for (const bucket of data.aggregations[aggName].buckets) {
        result[aggName].labels.push(bucket.key)
        result[aggName].datasets[0].data.push(bucket.doc_count)
      }
    } else {
      result[aggName] = data.aggregations[aggName].value
    }
  }
  return result
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
