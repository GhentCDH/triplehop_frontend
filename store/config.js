export const state = () => ({
  config: {}
})

export const mutations = {
  SET (state, payload) {
    state.config = payload
  }
}

export const actions = {
  async load ({ commit }, projectName) {
    const response = await this.$axios.post(
      projectName,
      {
        query: `
          {
            Entity_config_s {
              system_name
              field_s {
                system_name
              }
            }
          }
        `
      }
    )
    commit('SET', response.data.data.Entity_config_s)
  }
}
