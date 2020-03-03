import { capitalizeFirstLetter } from '~/assets/js/utils'

export const state = () => ({
  data: {}
})

export const mutations = {
  SET_DATA (state, payload) {
    state.data = payload
  }
}

export const actions = {
  async load ({ commit, displatch }, { entityTypeConfig, params }) {
    // console.log(entityConfig)
    // Display is configured
    if ('display' in entityTypeConfig) {
      // Get all fieldNames used in the title
      const fieldNames = [...entityTypeConfig.display.title.match(/(?<![$])[$]([a-z_]+)/g)].map(f => f.slice(1))

      // Get all fieldNames used in the layout
      for (const panel of entityTypeConfig.display.layout) {
        for (const field of panel.fields) {
          fieldNames.push(field.field)

          if (field.type === 'geometry') {
            fieldNames.push(field.base_layer)
          }
        }
      }

      const queryParts = [
        '{',
        `${capitalizeFirstLetter(params.entity_type_name)}(id: ${params.id}){`
      ]
      const processed = []
      for (const fieldName of fieldNames) {
        if (processed.includes(fieldName)) {
          continue
        }

        if (entityTypeConfig.data[fieldName].type === 'Geometry') {
          queryParts.push(`${fieldName} {
            type
            coordinates
          }`)
          processed.push(fieldName)
          continue
        }

        queryParts.push(fieldName)
        processed.push(fieldName)
      }
      queryParts.push(
        '}',
        '}'
      )

      const response = await this.$axios.post(
        params.project_name,
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
}
