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

export function compareNameUnicode (a, b) {
  const normA = normalizeUnicode(a.name).toLowerCase()
  const normB = normalizeUnicode(b.name).toLowerCase()
  if (normA < normB) {
    return -1
  }
  if (normA > normB) {
    return 1
  }
  return 0
}

export function stringify (input) {
  if (typeof input === 'object' && input !== null) {
    return JSON.stringify(input)
  }
  return input
}

// Merge objects
function addValuesWithSourceObjects (valuesWithSourceObjects, additionalValuesWithSourceObjects) {
  for (const [value, sourceObjects] of Object.entries(additionalValuesWithSourceObjects)) {
    if (!(value in valuesWithSourceObjects)) {
      valuesWithSourceObjects[value] = {}
    }
    addSourceObjects(valuesWithSourceObjects[value], sourceObjects)
  }
}

// Merge objects
function addSourceObjects (sourceObjects, additionalSourceObjects) {
  for (const [sourceEntityName, sourceEntities] of Object.entries(additionalSourceObjects)) {
    if (!(sourceEntityName in sourceObjects)) {
      sourceObjects[sourceEntityName] = {}
    }
    for (const [sourceEntityId, sourceEntity] of sourceEntities) {
      if (!(sourceEntityId in sourceObjects[sourceEntityName])) {
        sourceObjects[sourceEntityName][sourceEntityId] = sourceEntity
      }
      // TODO: merge other source relation values if necessary
    }
  }
}

function constructEntitySource (sourceTitlesConfig, entity, property) {
  console.log('constructentitysource')
  console.log(sourceTitlesConfig)
  console.log(entity)
  console.log(property)
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
      addSourceObjects(
        sourceObjects,
        {
          [source.entity.__typename.toLowerCase()]: {
            [source.entity.id]: {
              title: constructFieldFromData(
                sourceTitlesConfig[source.entity.__typename.toLowerCase()],
                source.entity,
                null,
                true
              )
            }
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
function rawConstructFieldFromData (input, data, sourceTitlesConfig, displayNA = false) {
  console.log('data')
  console.log(data)
  // TODO: fix for sources
  const inputParts = input.split(' $||$ ')
  if (inputParts.length > 1) {
    const resultParts = inputParts
      .map((inputPart) => {
        return constructFieldFromData(inputPart, data, sourceTitlesConfig, displayNA)
      })
      .filter((newresult) => {
        return Object.keys(newresult).length > 0
      })
    const results = {}
    for (const resultPart of resultParts) {
      addValuesWithSourceObjects(results, resultPart)
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
                  console.log('array')
                  for (const value of currentLevel[p]) {
                    addValuesWithSourceObjects(
                      newResults,
                      {
                        [result.replace(match, stringify(value))]: constructEntitySource(
                          sourceTitlesConfig,
                          currentLevel,
                          p
                        )
                      }
                    )
                  }
                } else {
                  console.log('single')
                  console.log(sourceTitlesConfig)
                  addValuesWithSourceObjects(
                    newResults,
                    {
                      [result.replace(match, stringify(currentLevel[p]))]: constructEntitySource(
                        sourceTitlesConfig,
                        currentLevel,
                        p
                      )
                    }
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
                  }
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
            // TODO: relation sources
            newCurrentLevels.push(rel.entity)
          }
        }
        currentLevels = newCurrentLevels
      }
    }
  }
  console.log('raw constructed')
  console.log(results)
  return results
}

export function constructFieldFromData (input, data, sourceTitlesConfig, displayNA = false) {
  const raw = rawConstructFieldFromData(input, data, sourceTitlesConfig, displayNA)
  const results = []
  for (const [value, sourceObjects] of Object.entries(raw)) {
    const sources = []
    for (const [sourceEntityTypeName, sourceEntities] of Object.entries(sourceObjects)) {
      for (const [sourceEntityId, sourceEntity] of Object.entries(sourceEntities)) {
        if ('title' in sourceEntity) {
          sources.push({
            typeName: sourceEntityTypeName,
            id: sourceEntityId,
            title: sourceEntity.title
            // TODO: other source properties / source relation properties?
          })
        }
      }
    }
    results.push({
      value,
      sources
    })
  }
  console.log('constructed')
  console.log(results)
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

export function filterObject (obj, predicate) {
  return Object.keys(obj)
    .filter(key => predicate(obj[key]))
    .reduce((result, key) => ({ ...result, [key]: obj[key] }), {})
}

export function normalizeUnicode (string) {
  return string.normalize('NFKD').replace(/[^\w]/g, '')
}
