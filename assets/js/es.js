import { COLOR_PRIMARY } from '~/assets/js/variables'

export const MAX_INT = 2147483647
const NESTED_AGG_REGEX = /^\[(?<id>[0-9]+)\]\[(?<name>[\s\S]*)\]$/
const SIZE_AGG_MAX = 2147483647

function constructQuery (body, esFiltersDefs) {
  const query = {
    bool: {
      must: []
    }
  }
  for (const [systemName, filterValues] of Object.entries(body.filters)) {
    if (esFiltersDefs[systemName].type === 'histogram_slider') {
      if (filterValues[0] == null && filterValues[1] == null) {
        continue
      }
      const queryPart = {
        range: {}
      }
      queryPart.range[`${systemName}.year_range`] = {}
      if (filterValues[0] != null) {
        queryPart.range[`${systemName}.year_range`].gte = filterValues[0]
      }
      if (filterValues[1] != null) {
        queryPart.range[`${systemName}.year_range`].lte = filterValues[1]
      }
      query.bool.must.push(queryPart)
      continue
    }
    if (esFiltersDefs[systemName].type === 'nested') {
      if (filterValues == null || filterValues.length === 0) {
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
      for (const filterValue of filterValues) {
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
    if (esFiltersDefs[systemName].type === 'nested_present') {
      if (filterValues == null) {
        continue
      }
      const occur = filterValues.id === 1 ? 'should' : 'must_not'
      query.bool.must.push({
        bool: {
          [occur]: {
            exists: {
              field: systemName
            }
          }
        }
      })
      continue
    }
    if (esFiltersDefs[systemName].type === 'dropdown') {
      if (filterValues == null || filterValues.length === 0) {
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
            [`${systemName}.keyword`]: filterValues.map(f => f.key)
          }
        }
      )
      query.bool.must.push(queryPart)
      continue
    }
    if (filterValues != null) {
      const queryPart = {
        match: {
          [systemName]: {
            query: filterValues
          }
        }
      }
      if (esFiltersDefs[systemName].type === 'autocomplete') {
        queryPart.match[systemName].operator = 'and'
      }
      query.bool.must.push(queryPart)
    }
  }
  if (query.bool.must.length === 0) {
    return null
  }
  return query
}

export function constructDataQuery (body, entityTypeConfig) {
  const result = {
    from: body.from,
    size: body.size
  }

  const sort = []
  for (const sortPart of body.sort) {
    const key = Object.keys(sortPart)[0]
    const newSortPart = {}

    let columnDef = {}
    const mainKey = key.split('.')[0]
    for (columnDef of entityTypeConfig.elasticsearch.columns) {
      if (columnDef.subField != null) {
        if (`${columnDef.systemName}_${columnDef.subField}` === mainKey) {
          break
        }
      }
      if (columnDef.systemName === mainKey) {
        break
      }
    }

    if (
      columnDef.subFieldType === 'edtf'
    ) {
      newSortPart[`${columnDef.systemName}.${columnDef.subField}${key.split('.')[1] != null ? '.' + key.split('.')[1] : ''}`] = sortPart[key]
    } else if (columnDef.type === 'edtf') {
      newSortPart[key] = sortPart[key]
    } else if (columnDef.type === 'nested') {
      newSortPart[`${key}.name.normalized_keyword`] = {
        mode: sortPart[key] === 'desc' ? 'max' : 'min',
        order: sortPart[key],
        nested: {
          path: key
        }
      }
    } else if (columnDef.type === 'text' || columnDef.type === '[text]') {
      newSortPart[`${key}.normalized_keyword`] = sortPart[key]
    } else {
      newSortPart[key] = sortPart[key]
    }
    sort.push(newSortPart)
  }
  if (sort.length > 0) {
    result.sort = sort
  }

  const query = constructQuery(body, getFilterDefs(entityTypeConfig))
  if (query != null) {
    result.query = query
  }

  return result
}

export function constructAggsQuery (body, esFiltersDefs, fullRangeData) {
  const result = {
    size: 0
  }

  const aggs = {}
  for (const [systemName, filter] of Object.entries(esFiltersDefs)) {
    if (esFiltersDefs[systemName].type === 'histogram_slider') {
      aggs[`${systemName}_hist`] = {
        histogram: {
          field: `${filter.systemName}.year_range`,
          interval: filter.interval
        }
      }
      if (
        `${systemName}_min` in fullRangeData &&
        `${systemName}_max` in fullRangeData
      ) {
        const min = fullRangeData[`${systemName}_min`]
        const max = fullRangeData[`${systemName}_max`]
        aggs[`${filter.systemName}_hist`].histogram.extended_bounds = {
          min: min - (min % filter.interval),
          max: max - (max % filter.interval)
        }
      }
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
    if (filter.type === 'nested') {
      aggs[systemName] = {
        nested: {
          path: systemName
        },
        aggs: {
          id: {
            terms: {
              field: `${systemName}.id`,
              size: SIZE_AGG_MAX,
              min_doc_count: 0
            }
          }
        }
      }
    }
    if (filter.type === 'nested_present') {
      aggs[`${systemName}_global`] = {
        global: {}
      }
      aggs[`${systemName}_missing`] = {
        missing: {
          field: systemName
        }
      }
    }
    if (filter.type === 'dropdown') {
      aggs[systemName] = {
        terms: {
          field: `${systemName}.keyword`,
          size: SIZE_AGG_MAX,
          min_doc_count: 0
        }
      }
    }
  }
  if (Object.keys(aggs).length > 0) {
    result.aggs = aggs
  }

  const query = constructQuery(body, esFiltersDefs)
  if (query != null) {
    result.query = query
  }

  return result
}

export function constructFullRangeAggQuery (esFiltersDefs) {
  const result = {
    size: 0
  }

  const aggs = {}
  for (const [systemName, filter] of Object.entries(esFiltersDefs)) {
    if (filter.type === 'histogram_slider') {
      aggs[`${systemName}_min`] = {
        min: {
          field: `${systemName}.lower`
        }
      }
      aggs[`${systemName}_max`] = {
        max: {
          field: `${systemName}.upper`
        }
      }
    }
  }
  if (Object.keys(aggs).length > 0) {
    result.aggs = aggs
  }

  return result
}

export function constructAllNestedAggQuery (esFiltersDefs) {
  const result = {
    size: 0
  }

  const aggs = {}
  for (const systemName of Object.keys(esFiltersDefs)) {
    if (esFiltersDefs[systemName].type === 'nested') {
      aggs[systemName] = {
        nested: {
          path: systemName
        },
        aggs: {
          id_and_name: {
            terms: {
              script: {
                source: `String.valueOf(doc['${systemName}.id']) + doc['${systemName}.name.keyword']`
              },
              size: SIZE_AGG_MAX
            }
          }
        }
      }
    }
  }
  if (Object.keys(aggs).length > 0) {
    result.aggs = aggs
  }

  return result
}

export function extractAggs (data, esFiltersDefs, nestedAggsCache) {
  const result = {}
  for (const [systemName, filter] of Object.entries(esFiltersDefs)) {
    if (filter.type === 'histogram_slider') {
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
    if (filter.type === 'nested') {
      result[systemName] = data.aggregations[systemName].id.buckets
        // .filter((bucket) => { return bucket.key in nestedAggsCache[systemName] })
        .map((bucket) => {
          return {
            id: bucket.key,
            name: nestedAggsCache[systemName][bucket.key],
            count: bucket.doc_count
          }
        })
      continue
    }
    if (filter.type === 'nested_present') {
      result[systemName] = [
        {
          id: 0,
          name: 'No',
          count: data.aggregations[`${systemName}_missing`].doc_count
        },
        {
          id: 1,
          name: 'Yes',
          count: data.aggregations[`${systemName}_global`].doc_count - data.aggregations[`${systemName}_missing`].doc_count
        }
      ]
      continue
    }
    if (filter.type === 'dropdown') {
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

export function extractAllNestedAggs (data, esFiltersDefs) {
  const result = {}
  for (const [systemName, filter] of Object.entries(esFiltersDefs)) {
    if (filter.type === 'nested') {
      result[systemName] = {}
      for (const bucket of data.aggregations[systemName].id_and_name.buckets) {
        const match = bucket.key.match(NESTED_AGG_REGEX)
        if (match) {
          result[systemName][parseInt(match.groups.id)] = match.groups.name === '' ? 'N/A' : match.groups.name
        }
      }
    }
  }
  return result
}

export function extractItems (data, entityTypeConfig) {
  const items = []
  for (const hit of data.hits.hits) {
    const item = {}
    for (const fieldConfig of entityTypeConfig.elasticsearch.columns) {
      if (fieldConfig.subField != null) {
        item[`${fieldConfig.systemName}_${fieldConfig.subField}`] = hit._source[fieldConfig.systemName][fieldConfig.subField]
      } else {
        item[fieldConfig.systemName] = hit._source[fieldConfig.systemName]
      }
    }
    item._id = hit._id
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
    if (fieldConfig.subField != null) {
      fields.push({
        key: `${fieldConfig.systemName}_${fieldConfig.subField}`,
        label: fieldConfig.displayName,
        sortable: fieldConfig.sortable,
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

export function getColumnKeys (entityTypeConfig) {
  const columnKeys = new Set()
  for (const columnDef of entityTypeConfig.elasticsearch.columns) {
    columnKeys.add(columnDef.systemName)
  }
  return [...columnKeys]
}
