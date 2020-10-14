import { COLOR_PRIMARY } from '~/assets/js/variables'

const NESTED_AGG_REGEX = /^\[([0-9]+)\]\[([\s\S]*)\]$/
const SIZE_AGG_MAX = 2147483647

export function constructQuery (body, entityTypeConfig) {
  const result = {
    from: body.from,
    size: body.size
  }

  const aggs = {}
  const filterDefs = {}
  for (const section of entityTypeConfig.elasticsearch.filters) {
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
      if (filter.type === 'nested') {
        aggs[filter.systemName] = {
          nested: {
            path: filter.systemName
          },
          aggs: {
            id_and_name: {
              terms: {
                script: {
                  source: `String.valueOf(doc['${filter.systemName}.id']) + doc['${filter.systemName}.name.keyword']`
                },
                size: SIZE_AGG_MAX
              }
            }
          }
        }
      }
      if (filter.type === 'dropdown') {
        aggs[filter.systemName] = {
          terms: {
            field: `${filter.systemName}.keyword`
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
    if (entityTypeConfig.elasticsearch.columns.filter(c => c.systemName === key)[0].type === 'nested') {
      newSortPart[`${key}.name.normalized_keyword`] = {
        mode: sortPart[key] === 'desc' ? 'max' : 'min',
        order: sortPart[key],
        nested: {
          path: key
        }
      }
    } else if (entityTypeConfig.elasticsearch.columns.filter(c => c.systemName === key)[0].type === 'text') {
      newSortPart[`${key}.normalized_keyword`] = sortPart[key]
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
      if (body.filters[systemName][0] == null && body.filters[systemName][1] == null) {
        continue
      }
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
      query.bool.must.push(queryPart)
      continue
    }
    if (filterDefs[systemName].type === 'nested') {
      if (body.filters[systemName] == null || body.filters[systemName].length === 0) {
        continue
      }
      const queryPart = {
        nested: {
          path: systemName,
          query: {
            bool: {
              should: []
            }
          }
        }
      }
      for (const filterValue of body.filters[systemName]) {
        queryPart.nested.query.bool.should.push(
          {
            match: {
              [`${systemName}.id`]: {
                query: filterValue.id
              }
            }
          }
        )
      }
      query.bool.must.push(queryPart)
      continue
    }
    if (filterDefs[systemName].type === 'dropdown') {
      if (body.filters[systemName] == null || body.filters[systemName].length === 0) {
        continue
      }
      const queryPart = {
        bool: {
          should: []
        }
      }
      queryPart.bool.should.push(
        {
          terms: {
            [`${systemName}.keyword`]: body.filters[systemName].map(f => f.key)
          }
        }
      )
      query.bool.must.push(queryPart)
      continue
    }
    if (body.filters[systemName] != null) {
      const queryPart = {
        match: {
          [systemName]: {
            query: body.filters[systemName]
          }
        }
      }
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

export function extractAggs (data, entityTypeConfig) {
  const esFiltersDefs = getFilterDefs(entityTypeConfig)
  if (data.aggregations == null) {
    return null
  }
  const result = {}
  for (const systemName in esFiltersDefs) {
    if (esFiltersDefs[systemName].type === 'histogram_slider') {
      result[`${systemName}_hist`] = {
        labels: data.aggregations[`${systemName}_hist`].buckets.map(b => b.key),
        datasets: [
          {
            // TODO: move styling to histogram component
            backgroundColor: COLOR_PRIMARY,
            data: data.aggregations[`${systemName}_hist`].buckets.map(b => b.doc_count)
          }
        ]
      }
      result[`${systemName}_min`] = data.aggregations[`${systemName}_min`].value
      result[`${systemName}_max`] = data.aggregations[`${systemName}_max`].value
      continue
    }
    if (esFiltersDefs[systemName].type === 'nested') {
      result[systemName] = data.aggregations[systemName].id_and_name.buckets.map((b) => {
        const matches = b.key.match(NESTED_AGG_REGEX)
        return {
          id: parseInt(matches[1]),
          name: matches[2] === '' ? 'N/A' : matches[2],
          count: b.doc_count
        }
      })
      continue
    }
    if (esFiltersDefs[systemName].type === 'dropdown') {
      result[systemName] = data.aggregations[systemName].buckets.map((b) => {
        return {
          key: b.key,
          count: b.doc_count
        }
      })
      continue
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

export function extractTotal (data) {
  return data.hits.total
}

export function getFields (entityTypeConfig) {
  const fields = []
  for (const fieldConfig of entityTypeConfig.elasticsearch.columns) {
    fields.push({
      key: fieldConfig.systemName,
      label: fieldConfig.displayName,
      sortable: fieldConfig.sortable
    })
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

export function getSystemNames (entityTypeConfig) {
  const systemNames = []
  for (const fieldConfig of entityTypeConfig.elasticsearch.columns) {
    systemNames.push(fieldConfig.systemName)
  }
  return systemNames
}
