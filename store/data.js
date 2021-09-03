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

function constructQueryEntityQueryPart (crdbQuery, entityTypeNames, entityTypesConfig, relationTypesConfig) {
  const queryParts = []
  queryParts.push('entity {')
  for (const entityTypeName of entityTypeNames) {
    // Filter out props not related to this entity type
    const eProps = new Set()
    for (const eProp of crdbQuery.e_props) {
      if (eProp.includes('|')) {
        if (eProp.split('|')[0] === entityTypeName) {
          eProps.add(eProp.split('|')[1])
        }
      } else {
        eProps.add(eProp)
      }
    }
    // Filter out relations not related to this entity type
    const relations = {}
    for (const [relation, relationQuery] of Object.entries(crdbQuery.relations)) {
      if (relation.includes('|')) {
        if (relation.split('|')[0] === entityTypeName) {
          relations[relation.split('|')[1]] = relationQuery
        }
      } else {
        relations[relation] = relationQuery
      }
    }
    queryParts.push(`... on ${capitalizeFirstLetter(entityTypeName)} {`)
    queryParts.push('id')
    queryParts.push('__typename')
    queryParts.push(...constructQueryPartsForProps(eProps, entityTypesConfig[entityTypeName].data))
    for (const [relation, relationQuery] of Object.entries(relations)) {
      const suffix = relation === '_source_' ? '' : '_s'
      queryParts.push(`${relation}${suffix} {`)
      queryParts.push(...constructQueryParts(relationQuery, entityTypesConfig, relationTypesConfig, null, relation))
      // relation
      queryParts.push('}')
    }
    // on entity type name
    queryParts.push('}')
  }
  // entity
  queryParts.push('}')
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
    // Entity properties
    queryParts.push(...constructQueryPartsForProps(crdbQuery.e_props, entityTypesConfig[initialEntityTypeName].data))

    // Relations
    for (const [relation, relationQuery] of Object.entries(crdbQuery.relations)) {
      const suffix = relation === '_source_' ? '' : '_s'
      queryParts.push(`${relation}${suffix} {`)
      queryParts.push(...constructQueryParts(relationQuery, entityTypesConfig, relationTypesConfig, null, relation))
      queryParts.push('}')
    }
    return queryParts
  }

  // Sources
  if (currentRelationType === '_source_') {
    // TODO: define config for source props and use constructQueryPartsForProps?
    if (crdbQuery.r_props.size !== 0) {
      queryParts.push(...crdbQuery.r_props)
    }
    if (crdbQuery.e_props.size || Object.keys(crdbQuery.relations).length) {
      // Get names of all entity types that can be used as source
      const setn = []
      for (const [etn, etc] of Object.entries(entityTypesConfig)) {
        if (
          'source' in etc &&
          etc.source
        ) {
          setn.push(etn)
        }
      }
      queryParts.push(...constructQueryEntityQueryPart(crdbQuery, setn, entityTypesConfig, relationTypesConfig))
    }
    return queryParts
  }

  // current position = relation
  const relationTypeConfig = relationTypesConfig[currentRelationType.split('_').slice(1).join('_')]
  if (crdbQuery.r_props.size !== 0) {
    queryParts.push(...constructQueryPartsForProps(crdbQuery.r_props, relationTypeConfig.data))
  }
  if (crdbQuery.e_props.size || Object.keys(crdbQuery.relations).length) {
    // Remove r_ or ri_
    const relationTypeConfig = relationTypesConfig[currentRelationType.split('_').slice(1).join('_')]
    const linkedEntityTypeNames = relationTypeConfig[`${currentRelationType.split('_')[0] === 'r' ? 'range' : 'domain'}_names`]
    queryParts.push(...constructQueryEntityQueryPart(crdbQuery, linkedEntityTypeNames, entityTypesConfig, relationTypesConfig))
  }
  return queryParts
}

export const actions = {
  async load ({ commit }, { entityTypeName, entityTypesConfig, id, projectName, relationTypesConfig }) {
    const entityTypeConfig = entityTypesConfig[entityTypeName]
    const sourceTypeNames = []
    for (const [etn, etc] of Object.entries(entityTypesConfig)) {
      if (
        'source' in etc &&
        etc.source
      ) {
        sourceTypeNames.push(etn)
      }
    }

    // Get all fieldNames used in the title and layout
    const dataPaths = extractDataPaths(entityTypeConfig.display)

    const baseDataPaths = [...dataPaths]
    // For all current dataPaths, request the linked source entity titles,
    // as well as the properties for which this source is relevant.
    for (const dataPath of baseDataPaths) {
      if (dataPath.includes('.')) {
        // TODO: sources of relation properties
      } else {
        const parts = dataPath.split('->')
        parts.pop()
        let prefix = ''
        if (parts.length !== 0) {
          prefix = `${parts.join('->')}->`
        }
        // Get all fieldNames used in source titles
        for (const etn of sourceTypeNames) {
          extractDataPathsForField(entityTypesConfig[etn].display.title)
            .forEach(path => dataPaths.add(`${prefix}_source_->${etn}|${path}`))
        }
        // Get the properties relevant for a source
        dataPaths.add(`${prefix}_source_.properties`)
      }
    }

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
            if (
              'display' in entityTypesConfig[linkedEntityTypeName] &&
              entityTypesConfig[linkedEntityTypeName].display != null &&
              'title' in entityTypesConfig[linkedEntityTypeName].display
            ) {
              extractDataPathsForField(entityTypesConfig[linkedEntityTypeName].display.title)
                .forEach(path => dataPaths.add(`${prefix}->${linkedEntityTypeName}|${path}`))
            }
          }
          // TODO: add sources for relations
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
