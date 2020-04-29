import { capitalizeFirstLetter } from '~/assets/js/utils'

export const state = () => ({
  data: {}
})

export const mutations = {
  SET_DATA (state, payload) {
    state.data = payload
  }
}

/**
 * Extract all fieldNames required to construct an entity title
 * @param  {String} titleField text string where used fieldNames are indicated with a dollar sign
 * @return {Array}             all required fieldNames
 */
function extractTitleFieldNames (titleField) {
  return [...new Set([...titleField.match(/(?<![$])[$]([a-z_]+)/g)].map(f => f.slice(1)))]
}

/**
 * Extract all fieldNames required to correctly display all properties of an entity or relation
 * @param  {Array} displayFields definition of which fields are used to display a panel of properties
 * @return {Array}               all required fieldNames
 */
function extractFieldNames (displayFields) {
  const fieldNames = displayFields.map(displayField => displayField.field)

  for (const displayField of displayFields) {
    if (displayField.type === 'geometry') {
      fieldNames.push(displayField.base_layer)
    }
  }

  return fieldNames
}

function constructQueryParts (fieldNames, typeConfig) {
  const queryParts = []
  for (const fieldName of fieldNames) {
    if (['id', '__typename'].includes(fieldName)) {
      queryParts.push(fieldName)
      continue
    }

    if (typeConfig.data[fieldName].type === 'Geometry') {
      queryParts.push(`${fieldName} {
        type
        coordinates
      }`)
      continue
    }

    queryParts.push(fieldName)
  }

  return queryParts
}

export const actions = {
  async load ({ commit, displatch }, { entityTypeName, entityTypesConfig, relationTypesConfig, params }) {
    const entityTypeConfig = entityTypesConfig[entityTypeName]
    const relationSides = {
      domain: {
        inverse: 'range',
        graphqlPrefix: 'r'
      },
      range: {
        inverse: 'domain',
        graphqlPrefix: 'ri'
      }
    }

    // Get all fieldNames used in the title
    const fieldNames = extractTitleFieldNames(entityTypeConfig.display.title)

    // Get all fieldNames used in the layout
    for (const panel of entityTypeConfig.display.layout) {
      fieldNames.push(...extractFieldNames(panel.fields))
    }

    // Relations
    // Get all fieldNames used in the layout of the display of the relation
    // and all fieldNames in the titles of linked entities
    const relationFieldNames = {
      domain: [],
      range: []
    }
    for (const relation in relationTypesConfig) {
      for (const side in relationSides) {
        if (relationTypesConfig[relation][`${side}_names`].includes(entityTypeName)) {
          relationFieldNames[side][relation] = {
            fields: [],
            titles: {}
          }
          for (const panel of relationTypesConfig[relation].display.layout) {
            relationFieldNames[side][relation].fields.push(...extractFieldNames(panel.fields))
          }
          for (const linkedEntityTypeName of relationTypesConfig[relation][`${relationSides[side].inverse}_names`]) {
            relationFieldNames[side][relation].titles[linkedEntityTypeName] = [
              ...new Set(['id', ...extractTitleFieldNames(entityTypesConfig[linkedEntityTypeName].display.title)])
            ]
          }
        }
      }
    }

    const queryParts = [
      '{',
      `${capitalizeFirstLetter(params.entity_type_name)}(id: ${params.id}){`
    ]
    queryParts.push(...constructQueryParts([...new Set(fieldNames)], entityTypeConfig))
    for (const side in relationSides) {
      for (const relation in relationFieldNames[side]) {
        if (relationFieldNames[side][relation].fields.length || Object.keys(relationFieldNames[side][relation].titles).length) {
          queryParts.push(`${relationSides[side].graphqlPrefix}_${relation}_s {`)
          queryParts.push(...constructQueryParts([...new Set(['id', ...relationFieldNames[side][relation].fields])], relationTypesConfig[relation]))
          for (const linkedEntityTypeName in relationFieldNames[side][relation].titles) {
            queryParts.push('entity {')
            queryParts.push(`... on ${capitalizeFirstLetter(linkedEntityTypeName)} {`)
            queryParts.push(...constructQueryParts([...new Set(['id', '__typename', ...relationFieldNames[side][relation].titles[linkedEntityTypeName]])], entityTypesConfig[linkedEntityTypeName]))
            queryParts.push('}')
            queryParts.push('}')
          }
          queryParts.push('}')
        }
      }
    }
    queryParts.push(
      '}',
      '}'
    )

    const response = await this.$axios.post(
      `/data/${params.project_name}`,
      {
        query: queryParts.join('\n')
      }
    )

    commit(
      'SET_DATA',
      response.data.data[capitalizeFirstLetter(params.entity_type_name)]
    )
  }
}
