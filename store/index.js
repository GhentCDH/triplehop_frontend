export const actions = {
  async nuxtServerInit ({ commit }, { error, params, store }) {
    if (params.project_name != null) {
      await store.dispatch('config/load_poject_def', params.project_name)
      if (
        store.state.config.project_def == null ||
        store.state.config.project_def.system_name == null
      ) {
        return error({
          statusCode: 404,
          message: `Project "${params.project_name}" cannot be found.`
        })
      }
      await store.dispatch('config/load_entity_types', params.project_name)
    }
  }
}
