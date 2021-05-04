import { RE_FIELD_CONVERSION, capitalizeFirstLetter } from '~/assets/js/utils'

export const state = () => ({
  data: {}
})

export const mutations = {
  SET_DATA (state, payload) {
    state.data = payload
  }
}

/**
 * Extract all data paths required to display an title or field
 * @param  {String} field    Field config
 * @param  {String} position Relative position (path)
 * @return {Set}             All required data paths to display this field
 */
function extractDataPathsForField (field) {
  const matches = field.match(RE_FIELD_CONVERSION)
  if (matches != null) {
    return new Set(matches)
  }

  return new Set()
}

/**
 * Extract all fieldNames required to display an entity
 * @param  {Object} display object containing display information: title and layout with panels and fields
 * @return {Set}            all required data paths to display the entity
 */
function extractDataPaths (display) {
  const dataPaths = new Set()

  if (display.title != null) {
    // Get all fieldNames used in the title
    extractDataPathsForField(display.title).forEach(path => dataPaths.add(path))
  }

  // Get all fieldNames used in the layout
  if (display.layout != null) {
    for (const panel of display.layout) {
      for (const field of panel.fields) {
        extractDataPathsForField(field.field).forEach(path => dataPaths.add(path))
        if (field.type === 'geometry' && field.base_layer != null) {
          extractDataPathsForField(field.base_layer).forEach(path => dataPaths.add(path))
        }
      }
    }
  }

  return dataPaths
}

function constructQueryPartsForProps (props, dataConfig) {
  const queryParts = []
  for (const prop of props) {
    if (dataConfig[prop].type === 'Geometry') {
      queryParts.push(`${prop} {`)
      queryParts.push('type')
      queryParts.push('coordinates')
      queryParts.push('}')
    } else {
      queryParts.push(prop)
    }
  }
  return queryParts
}

/**
 * Extract GraphQL query parts
 * @param  {Object} crdbQuery
 * @param  {Object} relationTypesConfig
 * @param  {String} currentRelationType
 * @return {Array}
 */
function constructQueryParts (crdbQuery, entityTypesConfig, relationTypesConfig, initialEntityTypeName = null, currentRelationType = null) {
  const queryParts = []
  if (currentRelationType == null) {
    // current position = base entity
    queryParts.push(...constructQueryPartsForProps(crdbQuery.e_props, entityTypesConfig[initialEntityTypeName].data))

    for (const [relation, relationQuery] of Object.entries(crdbQuery.relations)) {
      queryParts.push(`${relation}_s {`)
      queryParts.push(...constructQueryParts(relationQuery, entityTypesConfig, relationTypesConfig, null, relation))
      queryParts.push('}')
    }
    return queryParts
  }

  // current position = relation
  const relationTypeConfig = relationTypesConfig[currentRelationType.split('_').slice(1).join('_')]
  queryParts.push(...constructQueryPartsForProps(crdbQuery.r_props, relationTypeConfig.data))
  if (crdbQuery.e_props.size || Object.keys(crdbQuery.relations).length) {
    // Remove r_ or ri_
    const relationTypeConfig = relationTypesConfig[currentRelationType.split('_').slice(1).join('_')]
    queryParts.push('entity {')
    // TODO: check if this works with relations with multiple domains or ranges
    for (const linkedEntityTypeName of relationTypeConfig[`${currentRelationType.split('_')[0] === 'r' ? 'range' : 'domain'}_names`]) {
      queryParts.push(`... on ${capitalizeFirstLetter(linkedEntityTypeName)} {`)
      queryParts.push('id')
      queryParts.push('__typename')
      queryParts.push(...constructQueryPartsForProps(crdbQuery.e_props, entityTypesConfig[linkedEntityTypeName].data))
      for (const [relation, relationQuery] of Object.entries(crdbQuery.relations)) {
        queryParts.push(`${relation}_s {`)
        queryParts.push(...constructQueryParts(relationQuery, entityTypesConfig, relationTypesConfig, null, relation))
        // relation
        queryParts.push('}')
      }
      // on entity type name
      queryParts.push('}')
    }
    // entity
    queryParts.push('}')
  }
  return queryParts
}

export const actions = {
  async load ({ commit }, { entityTypeName, entityTypesConfig, id, projectName, relationTypesConfig }) {
    const entityTypeConfig = entityTypesConfig[entityTypeName]

    // Get all fieldNames used in the title and layout
    const dataPaths = extractDataPaths(entityTypeConfig.display)

    // Relations
    const relationSides = ['domain', 'range']
    for (const [relation, relationTypeConfig] of Object.entries(relationTypesConfig)) {
      for (const side of relationSides) {
        const prefix = `${side === 'domain' ? 'r' : 'ri'}_${relation}`
        if (relationTypeConfig[`${side}_names`].includes(entityTypeName)) {
          if (relationTypeConfig.display != null) {
            // Add relation prefix to each path
            extractDataPaths(relationTypeConfig.display).forEach(path => dataPaths.add(`${prefix}.${path}`))
          }
          for (const linkedEntityTypeName of relationTypeConfig[`${side === 'domain' ? 'range' : 'domain'}_names`]) {
            extractDataPathsForField(entityTypesConfig[linkedEntityTypeName].display.title).forEach(path => dataPaths.add(`${prefix}->${path}`))
          }
        }
      }
    }

    const crdbQuery = {
      e_props: new Set(),
      relations: {}
    }
    for (const dataPath of dataPaths) {
      let currentLevel = crdbQuery
      // remove all dollar signs, split in parts
      const path = dataPath.split('$').join('').split('->')
      for (const [i, p] of path.entries()) {
        if (i === path.length - 1) {
          // last element => p = relation.r_prop or e_prop
          if (p.includes('.')) {
            // relation property
            const [relation, rProp] = p.split('.')
            if (!(relation in currentLevel.relations)) {
              currentLevel.relations[relation] = {
                e_props: new Set(),
                r_props: new Set(),
                relations: {}
              }
            }
            currentLevel.relations[relation].r_props.add(rProp)
          } else {
            // entity property
            currentLevel.e_props.add(p)
          }
        } else {
          // not last element => p = relation => travel
          if (!(p in currentLevel.relations)) {
            currentLevel.relations[p] = {
              e_props: new Set(),
              r_props: new Set(),
              relations: {}
            }
          }
          currentLevel = currentLevel.relations[p]
        }
      }
    }

    const queryParts = [
      '{',
      `${capitalizeFirstLetter(entityTypeName)}(id: ${id}){`
    ]
    queryParts.push(...constructQueryParts(crdbQuery, entityTypesConfig, relationTypesConfig, entityTypeName))
    queryParts.push(
      '}',
      '}'
    )

    const response = await this.$axios.post(
      `/data/${projectName}`,
      {
        query: queryParts.join('\n')
      }
    )
    commit(
      'SET_DATA',
      response.data.data[capitalizeFirstLetter(entityTypeName)]
    )
  }
}
