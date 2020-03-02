import { createEntityQuery } from '~/assets/js/graphql'

export const state = () => ({
  data: {}
})

export const mutations = {
  SET_DATA (state, payload) {
    state.data = payload
  }
}

export const actions = {
  async load ({ commit, displatch }, { entityConfig, params }) {
    // Display is configured
    if ('display' in entityConfig) {
      // Get all fields used in the title
      const fields = [...entityConfig.display.title.matchAll('(?<![$])[$]([0-9]+)')].map(m => m[1])
      if ('layout' in entityConfig.display && 'fields' in entityConfig.display.layout) {
        for (const panel of entityConfig.display.layout) {
          for (const field of panel.fields) {
            field.push(field)
          }
        }
      }

      commit(
        'SET_DATA',
        await this.$axios.post(
          params.project_name,
          {
            query: createEntityQuery(
              params.entity_type_name,
              params.id,
              [...new Set(fields)] // unique values only
            )
          }
        )
      )
    }
  }
}
