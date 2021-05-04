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

export function constructFieldFromData (input, data, displayNA = false) {
  const matches = input.match(RE_FIELD_CONVERSION)
  if (matches == null) {
    return input
  }
  let results = [input]
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
          const newResults = []
          for (const result of results) {
            for (const currentLevel of currentLevels) {
              for (const rel of currentLevel[`${relation}_s`]) {
                newResults.push(result.replace(match, rel[rProp]))
              }
            }
          }
          results = newResults
        } else {
          // entity property
          const newResults = []
          for (const result of results) {
            for (const currentLevel of currentLevels) {
              if (currentLevel[p] != null) {
                newResults.push(result.replace(match, currentLevel[p]))
              } else if (displayNA) {
                newResults.push(result.replace(match, 'N/A'))
              }
            }
          }
          results = newResults
        }
      } else {
        // not last element => p = relation => travel
        const newCurrentLevels = []
        for (const currentLevel of currentLevels) {
          for (const rel of currentLevel[`${p}_s`]) {
            newCurrentLevels.push(rel.entity)
          }
        }
        currentLevels = newCurrentLevels
      }
    }
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

export function filterObject (obj, predicate) {
  return Object.keys(obj)
    .filter(key => predicate(obj[key]))
    .reduce((result, key) => ({ ...result, [key]: obj[key] }), {})
}

export function normalizeUnicode (string) {
  return string.normalize('NFKD').replace(/[^\w]/g, '')
}
