export const state = () => ({
  entity_types: {}
})

export const mutations = {
  SET_ENTITY_TYPES (state, payload) {
    state.entity_types = payload
  }
}

export const actions = {
  async load_entity_types ({ commit }, projectName) {
    const response = await this.$axios.post(
      projectName,
      {
        query: `
        {
          Entity_config_s {
            system_name
            data {
              system_name
              display_name
            }
            display {
              title
              layout {
                label
                fields {
                  label
                  field
                }
              }
            }
          }
        }
        `
      }
    )
    const rawConfig = response.data.data.Entity_config_s
    const config = {}
    for (const raw of rawConfig) {
      const fieldConfig = {}
      for (const rawField of raw.data) {
        fieldConfig[rawField.system_name] = {
          display_name: rawField.display_name
        }
      }
      config[raw.system_name] = {
        display_name: raw.display_name,
        fields: fieldConfig
      }
    }
    commit('SET_ENTITY_TYPES', config)
  }
}
