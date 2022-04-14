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
 * Add data paths required to correctly display sources for all parts of the data
 * @param  {Set} dataPaths all data paths required to correcly display data
 * @param  {Set} sourceEProps all properties required to correctly display sources
 */
function addSourceDataPaths (dataPaths, sourceEProps = null) {
  if (sourceEProps == null) {
    return
  }

  for (const dataPath of [...dataPaths]) {
    const path = dataPath.split('->')
    let sourcePath = ''
    for (const [i, p] of path.entries()) {
      if (i === path.length - 1) {
        if (p.includes('.')) {
          const relation = p.split('.')[0]
          // relation property
          for (const sourceEProp of sourceEProps) {
            dataPaths.add(`${sourcePath}${relation}._source_->${sourceEProp}`)
          }
          dataPaths.add(`${sourcePath}${relation}._source_.properties`)
          dataPaths.add(`${sourcePath}${relation}._source_.source_props`)
        } else {
          // entity property
          for (const sourceEProp of sourceEProps) {
            dataPaths.add(`${sourcePath}_source_->${sourceEProp}`)
          }
          dataPaths.add(`${sourcePath}_source_.properties`)
          dataPaths.add(`${sourcePath}_source_.source_props`)
        }
      } else {
        // not last element => p = relation => request relation source and update sourcePath
        for (const sourceEProp of sourceEProps) {
          dataPaths.add(`${sourcePath}${p}._source_->${sourceEProp}`)
        }
        dataPaths.add(`${sourcePath}${p}._source_.properties`)
        dataPaths.add(`${sourcePath}${p}._source_.source_props`)
        sourcePath = `${sourcePath}${p}->`
      }
    }
  }
}

/**
 * Extract all fieldNames required to display an entity, including sources
 * @param  {Object} display object containing display information: title and layout with panels and fields
 * @param  {Set} sourceEProps all properties required to correctly display sources
 * @param  {boolean} full indicates if sources need to be added to all parts of the data path
 * @return {Set}            all required data paths to display the entity
 */
function extractDataPathsWithSources (display, sourceEProps) {
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

  addSourceDataPaths(dataPaths, sourceEProps)

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
    // Source relations have no relations
    if ('relations' in crdbQuery) {
      for (const [relation, relationQuery] of Object.entries(crdbQuery.relations)) {
        if (relation.includes('|')) {
          if (relation.split('|')[0] === entityTypeName) {
            relations[relation.split('|')[1]] = relationQuery
          }
        } else {
          relations[relation] = relationQuery
        }
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

  // Entity sources
  if (currentRelationType === '_source_') {
    // TODO: define config for source props and use constructQueryPartsForProps?
    if (crdbQuery.r_props.size !== 0) {
      queryParts.push(...crdbQuery.r_props)
    }
    if (
      crdbQuery.e_props.size !== 0 ||
      (
        'relations' in crdbQuery &&
        Object.keys(crdbQuery.relations).length
      )
    ) {
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
  if (crdbQuery.e_props.size !== 0 || Object.keys(crdbQuery.relations).length) {
    // Remove r_ or ri_
    const relationTypeConfig = relationTypesConfig[currentRelationType.split('_').slice(1).join('_')]
    const linkedEntityTypeNames = relationTypeConfig[`${currentRelationType.split('_')[0] === 'r' ? 'range' : 'domain'}_names`]
    queryParts.push(...constructQueryEntityQueryPart(crdbQuery, linkedEntityTypeNames, entityTypesConfig, relationTypesConfig))
  }
  if (
    'relation_source' in crdbQuery &&
    (
      crdbQuery.relation_source.r_props.size !== 0 ||
      crdbQuery.relation_source.e_props.size !== 0
    )
  ) {
    // Relation source -> add _source_ and handle as entity source with relation source data
    queryParts.push('_source_ {')
    queryParts.push(...constructQueryParts(crdbQuery.relation_source, entityTypesConfig, relationTypesConfig, null, '_source_'))
    queryParts.push('}')
  }
  return queryParts
}

/**
 * Check if there is a relation structure at the current level for a certain relation. If there is no such structure, create one.
 * @param {Object} currentLevel
 * @param {String} relation
 */
function addRelationStructureIfNeeded (currentLevel, relation) {
  if (!(relation in currentLevel.relations)) {
    currentLevel.relations[relation] = {
      e_props: new Set(),
      r_props: new Set(),
      relations: {},
      relation_source: {
        e_props: new Set(),
        r_props: new Set()
      }
    }
  }
}

function crdbQueryFromDataPaths (dataPaths) {
  // Entity sources are modeled using relation '_source_' with e_props
  // relation sources are modeled using relation_source
  const crdbQuery = {
    e_props: new Set(),
    relations: {}
  }
  for (const dataPath of dataPaths) {
    let currentLevel = crdbQuery
    // remove all dollar signs, split in parts
    const path = dataPath.split('$').join('').split('->')
    let isRelationSource = false
    for (const [i, p] of path.entries()) {
      if (i === path.length - 1) {
        // last element => p = relationsource.e_prop, relation.r_prop or e_prop
        if (isRelationSource) {
          // relation source
          currentLevel.relation_source.e_props.add(p)
        } else if (p.includes('.')) {
          // relation property
          const [relation, ...rest] = p.split('.')
          addRelationStructureIfNeeded(currentLevel, relation)

          if (rest.length === 2) {
            if (rest[0] !== '_source_') {
              throw new Error('Unexpected datapath')
            }
            currentLevel.relations[relation].relation_source.r_props.add(rest[1])
          } else {
            currentLevel.relations[relation].r_props.add(rest)
          }
        } else {
          // entity property
          currentLevel.e_props.add(p)
        }
      } else if (p.includes('.')) {
        // relation source
        const relation = p.split('.')[0]
        addRelationStructureIfNeeded(currentLevel, relation)
        isRelationSource = true
        currentLevel = currentLevel.relations[relation]
      } else {
        // not last element => p = relation => travel
        addRelationStructureIfNeeded(currentLevel, p)
        currentLevel = currentLevel.relations[p]
      }
    }
  }
  return crdbQuery
}

export const actions = {
  async load ({ commit }, { entityTypeName, entityTypesConfig, id, projectName, relationTypesConfig }) {
    const entityTypeConfig = entityTypesConfig[entityTypeName]

    // Construct all properties required to correctly display sources
    const sourceEProps = new Set()
    for (const [etn, etc] of Object.entries(entityTypesConfig)) {
      if (
        'source' in etc &&
        etc.source
      ) {
        extractDataPathsForField(etc.display.title)
          .forEach(path => sourceEProps.add(`${etn}|${path}`))
      }
    }

    // Get all fieldNames used in the title and layout with sources
    const dataPaths = extractDataPathsWithSources(entityTypeConfig.display, sourceEProps)

    // Relations
    const relationSides = ['domain', 'range']
    for (const [relation, relationTypeConfig] of Object.entries(relationTypesConfig)) {
      for (const side of relationSides) {
        const prefix = `${side === 'domain' ? 'r' : 'ri'}_${relation}`
        if (relationTypeConfig[`${side}_names`].includes(entityTypeName)) {
          if (relationTypeConfig.display != null) {
            // Add relation prefix to each path
            const relationPaths = extractDataPathsWithSources(relationTypeConfig.display, sourceEProps)
            if (relationPaths.size !== 0) {
              relationPaths.forEach(path => dataPaths.add(`${prefix}.${path}`))
            }
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
          // Add relation sources
          for (const sourceEProp of sourceEProps) {
            dataPaths.add(`${prefix}._source_->${sourceEProp}`)
          }
          dataPaths.add(`${prefix}._source_.properties`)
          dataPaths.add(`${prefix}._source_.source_props`)
        }
      }
    }

    const queryParts = [
      'query {',
      `get${capitalizeFirstLetter(entityTypeName)}(id: ${id}){`,
      ...constructQueryParts(
        crdbQueryFromDataPaths(dataPaths),
        entityTypesConfig,
        relationTypesConfig,
        entityTypeName
      ),
      '}',
      '}'
    ]

    const response = await this.$axios.post(
      `/data/${projectName}`,
      {
        query: queryParts.join('\n')
      }
    )
    commit(
      'SET_DATA',
      response.data.data[`get${capitalizeFirstLetter(entityTypeName)}`]
    )
  },
  async loadEdit ({ commit }, { entityTypeName, entityTypesConfig, id, projectName, relationTypesConfig }) {
    const entityTypeConfig = entityTypesConfig[entityTypeName]

    // Get all fieldNames used in the edit form
    const dataPaths = extractDataPathsWithSources(entityTypeConfig.edit)

    // Get all fieldNames used in the relations edit forms and title fields of related entities
    const relationSides = ['domain', 'range']
    for (const [relation, relationTypeConfig] of Object.entries(relationTypesConfig)) {
      for (const side of relationSides) {
        const prefix = `${side === 'domain' ? 'r' : 'ri'}_${relation}`
        if (relationTypeConfig[`${side}_names`].includes(entityTypeName)) {
          if (relationTypeConfig.edit != null) {
            // Add relation prefix to each path
            const relationPaths = extractDataPathsWithSources(relationTypeConfig.edit)
            if (relationPaths.size !== 0) {
              relationPaths.forEach(path => dataPaths.add(`${prefix}.${path}`))
            }
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
        }
      }
    }

    const queryParts = [
      'query {',
      `get${capitalizeFirstLetter(entityTypeName)}(id: ${id}){`,
      ...constructQueryParts(
        crdbQueryFromDataPaths(dataPaths),
        entityTypesConfig,
        relationTypesConfig,
        entityTypeName
      ),
      '}',
      '}'
    ]

    const response = await this.$axios.post(
      `/data/${projectName}`,
      {
        query: queryParts.join('\n')
      }
    )
    commit(
      'SET_DATA',
      response.data.data[`get${capitalizeFirstLetter(entityTypeName)}`]
    )
  },
  async save ({ commit }, { entityTypeName, entityTypesConfig, id, projectName, relationTypesConfig, data }) {
    const entityTypeConfig = entityTypesConfig[entityTypeName]

    // Get all fieldNames used in the edit form
    const dataPaths = extractDataPathsWithSources(entityTypeConfig.edit)
    const queryParts = [
      'mutation {',
      `put${capitalizeFirstLetter(entityTypeName)}(id: ${id}, input: {`
    ]
    for (const [key, value] of Object.entries(data)) {
      queryParts.push(`${key}: ${JSON.stringify(value)}`)
    }
    queryParts.push(
      '}',
      '){',
      ...constructQueryParts(
        crdbQueryFromDataPaths(dataPaths),
        entityTypesConfig,
        relationTypesConfig,
        entityTypeName
      ),
      '}',
      '}'
    )

    const response = await this.$axios.post(
      `/data/${projectName}`,
      {
        query: queryParts.join('\n')
      }
    )

    if ('errors' in response.data) {
      throw new Error(response.data.errors[0].message)
    }

    commit(
      'SET_DATA',
      response.data.data[`put${capitalizeFirstLetter(entityTypeName)}`]
    )
  }
}
