export const RE_FIELD_CONVERSION = new RegExp([
  // zero, one or multiple (inverse) relations
  /(?:[$]ri?_[a-z_]+->)*/,
  // zero or one (inverse) relations; dot for relation property and arrow for entity property
  /(?:[$]ri?_[a-z_]+(?:[.]|->)){0,1}/,
  // one property (entity or relation)
  /[$](?:[a-z_]+)/
].map(r => r.source).join(''),
'g')

export function capitalizeFirstLetter (string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

export function stringify (input) {
  if (typeof input === 'object' && input !== null) {
    return JSON.stringify(input)
  }
  return input
}

// Merge objects
function addValuesWithSourceObjects (valuesWithSourceObjects, additionalValuesWithSourceObjects, relationSourceObjects) {
  for (const [value, sourceObjects] of Object.entries(additionalValuesWithSourceObjects)) {
    if (!(value in valuesWithSourceObjects)) {
      valuesWithSourceObjects[value] = {}
    }
    addSourceObjects(valuesWithSourceObjects[value], sourceObjects)
    addSourceObjects(valuesWithSourceObjects[value], relationSourceObjects)
  }
}

// Merge objects
function addSourceObjects (sourceObjects, additionalSourceObjects) {
  for (const [sourceEntityName, sourceEntities] of Object.entries(additionalSourceObjects)) {
    if (!(sourceEntityName in sourceObjects)) {
      sourceObjects[sourceEntityName] = {}
    }
    for (const [sourceEntityId, sourceEntity] of Object.entries(sourceEntities)) {
      if (!(sourceEntityId in sourceObjects[sourceEntityName])) {
        sourceObjects[sourceEntityName][sourceEntityId] = sourceEntity
      }
      // TODO: merge other source relation values if necessary
    }
  }
}

function constructEntitySource (sourceTitlesConfig, entity, property) {
  if (sourceTitlesConfig == null) {
    return {}
  }
  if (!('_source_' in entity)) {
    return {}
  }
  if (entity._source_.length === 0) {
    return {}
  }
  const sourceObjects = {}
  for (const source of entity._source_) {
    if (source.properties.includes(property)) {
      const sourceData = {
        title: Object.keys(
          rawConstructFieldFromData(
            sourceTitlesConfig[source.entity.__typename.toLowerCase()],
            source.entity,
            null,
            {},
            true
          )
        )[0]
      }
      if (source.source_props != null) {
        if ('page_number' in source.source_props && source.source_props.page_number != null && source.source_props.page_number.length !== 0) {
          sourceData.page_number = source.source_props.page_number
        }
      }
      addSourceObjects(
        sourceObjects,
        {
          [source.entity.__typename.toLowerCase()]: {
            [source.entity.id]: sourceData
          }
        }
      )
    }
  }
  return sourceObjects
}

/**
 *
 * @param {string} input
 * @param {object} data
 * @param {object} sourceTitlesConfig null if sources don't need to be added (e.g., when resolving source title)
 * @param {Array} relationSources additional sources from relations to be added
 * @param {boolean} displayNA
 * @returns {object} Constructed field values as keys, related sources as values. Example:
 * 'Field value': {
 *   source_entity_name: {
 *     source_entity_id: {
 *       title: 'Source title'
 *     }
 *   }
 * }
 */
function rawConstructFieldFromData (input, data, sourceTitlesConfig, rawRelation, displayNA = false) {
  const inputParts = input.split(' $||$ ')
  if (inputParts.length > 1) {
    // Merge results
    const resultParts = inputParts
      .map((inputPart) => {
        return rawConstructFieldFromData(inputPart, data, sourceTitlesConfig, rawRelation, displayNA)
      })
      .filter((newresult) => {
        return Object.keys(newresult).length > 0
      })
    const results = {}
    for (const resultPart of resultParts) {
      addValuesWithSourceObjects(results, resultPart, {})
    }
    return results
  }

  const matches = input.match(RE_FIELD_CONVERSION)
  if (matches == null) {
    return input
  }

  let results = {
    [input]: []
  }
  for (const match of matches) {
    let currentLevels = [data]
    const relationSources = constructEntitySource(sourceTitlesConfig, rawRelation, '__rel__')
    // remove all dollar signs, split in parts
    const path = match.split('$').join('').split('->')
    for (const [i, p] of path.entries()) {
      if (i === path.length - 1) {
        // last element => p = relation.r_prop or e_prop
        if (p.includes('.')) {
          // relation property
          const [relation, rProp] = p.split('.')
          const newResults = {}
          for (const result of Object.keys(results)) {
            for (const currentLevel of currentLevels) {
              for (const rel of currentLevel[`${relation}_s`]) {
                // TODO: relation sources
                newResults[result.replace(match, stringify(rel[rProp]))] = results[result]
              }
            }
          }
          results = { ...newResults }
        } else {
          // entity property
          const newResults = {}
          for (const result of Object.keys(results)) {
            for (const currentLevel of currentLevels) {
              if (currentLevel[p] != null) {
                if (isArray(currentLevel[p])) {
                  for (const [index, value] of currentLevel[p].entries()) {
                    // Add entity source
                    addValuesWithSourceObjects(
                      newResults,
                      {
                        [result.replace(match, stringify(value))]: constructEntitySource(
                          sourceTitlesConfig,
                          currentLevel,
                          `${p}[${index}]`
                        )
                      },
                      relationSources
                    )
                  }
                } else {
                  addValuesWithSourceObjects(
                    newResults,
                    {
                      [result.replace(match, stringify(currentLevel[p]))]: constructEntitySource(
                        sourceTitlesConfig,
                        currentLevel,
                        p
                      )
                    },
                    relationSources
                  )
                }
              } else if (displayNA) {
                addValuesWithSourceObjects(
                  newResults,
                  {
                    [result.replace(match, 'N/A')]: constructEntitySource(
                      sourceTitlesConfig,
                      currentLevel,
                      p
                    )
                  },
                  relationSources
                )
              }
            }
          }
          results = { ...newResults }
        }
      } else {
        // not last element => p = relation => travel
        const newCurrentLevels = []
        for (const currentLevel of currentLevels) {
          for (const rel of currentLevel[`${p}_s`]) {
            // Add relations sources
            addSourceObjects(
              relationSources,
              constructEntitySource(sourceTitlesConfig, rel, '__rel__')
            )
            newCurrentLevels.push(rel.entity)
          }
        }
        currentLevels = newCurrentLevels
      }
    }
  }
  return results
}

export function constructRelationSources (sourceTitlesConfig, rawRelation) {
  const sourceObjects = constructEntitySource(sourceTitlesConfig, rawRelation, '__rel__')
  const sources = []
  for (const [sourceEntityTypeName, sourceEntities] of Object.entries(sourceObjects)) {
    for (const [sourceEntityId, sourceEntity] of Object.entries(sourceEntities)) {
      if ('title' in sourceEntity) {
        const sourceData = {
          typeName: sourceEntityTypeName,
          id: sourceEntityId,
          title: sourceEntity.title
        }
        if ('page_number' in sourceEntity) {
          sourceData.page_number = sourceEntity.page_number
        }
        // TODO: other source properties / source relation properties?
        sources.push(sourceData)
      }
    }
  }
  return sources
}

export function constructFieldFromData (input, data, sourceTitlesConfig, rawRelation, displayNA = false) {
  const raw = rawConstructFieldFromData(input, data, sourceTitlesConfig, rawRelation, displayNA)
  const results = []
  for (const [value, sourceObjects] of Object.entries(raw)) {
    const sources = []
    for (const [sourceEntityTypeName, sourceEntities] of Object.entries(sourceObjects)) {
      for (const [sourceEntityId, sourceEntity] of Object.entries(sourceEntities)) {
        if ('title' in sourceEntity) {
          const sourceData = {
            typeName: sourceEntityTypeName,
            id: sourceEntityId,
            title: sourceEntity.title
          }
          if ('page_number' in sourceEntity) {
            sourceData.page_number = sourceEntity.page_number
          }
          // TODO: other source properties / source relation properties?
          sources.push(sourceData)
        }
      }
    }
    results.push({
      value,
      sources
    })
  }
  return results
}

export function formatDateTime (string) {
  if (string == null) {
    return null
  }
  const date = new Date(string)
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}.${date.getMilliseconds()}`
}

export function isArray (variable) {
  return Array.isArray(variable)
}

export function isNumber (string) {
  return /^\d+$/.test(string)
}

export function isObject (variable) {
  return variable != null && typeof variable === 'object'
}

export function isUUID (string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(string)
}

export function nestedKeyExists (obj, ...props) {
  for (const prop of props) {
    if (prop in obj) {
      obj = obj[prop]
    } else {
      return false
    }
  }
  return true
}
