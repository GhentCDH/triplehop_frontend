export const state = () => ({
  initialized: false
})

export const mutations = {
  SET_INITIALIZED (state, payload) {
    state.initialized = payload
  }
}

export const actions = {
  async nuxtServerInit ({ commit }, { error, params, store, $config }) {
    const projectName = $config.projectName ?? params.project_name
    // not all paths (e.g., login) are project-related
    if (projectName != null) {
      await store.dispatch('config/load_poject_def', projectName)
      if (
        store.state.config.project_def == null ||
        store.state.config.project_def.system_name == null
      ) {
        return error({
          statusCode: 404,
          message: `Project "${projectName}" cannot be found.`
        })
      }
      await store.dispatch('config/load_entity_types', projectName)
      commit('SET_INITIALIZED', true)
    }
  }
}
