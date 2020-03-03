import { createEntityQuery } from '~/assets/js/graphql'
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
      // Get all fields used in the title
      const fields = [...entityTypeConfig.display.title.match(/(?<![$])[$]([a-z_]+)/g)].map(f => f.slice(1))

      // Get all fields used in the layout
      if ('layout' in entityTypeConfig.display && 'fields' in entityTypeConfig.display.layout) {
        for (const panel of entityTypeConfig.display.layout) {
          for (const field of panel.fields) {
            field.push(field)
          }
        }
      }

      const response = await this.$axios.post(
        params.project_name,
        {
          query: createEntityQuery(
            params.entity_type_name,
            params.id,
            [...new Set(fields)] // unique values only
          )
        }
      )

      commit(
        'SET_DATA',
        response.data.data[capitalizeFirstLetter(params.entity_type_name)]
      )
    }
  }
}
