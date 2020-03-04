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
              type
            }
            display {
              title
              layout {
                label
                fields {
                  label
                  field
                  type
                  base_layer
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
      config[raw.system_name] = {
        display_name: raw.display_name,
        data: {}
      }
      for (const rawField of raw.data) {
        config[raw.system_name].data[rawField.system_name] = {
          display_name: rawField.display_name,
          type: rawField.type
        }
      }
      if ('display' in raw) {
        config[raw.system_name].display = raw.display
      }
    }
    commit('SET_ENTITY_TYPES', config)
  }
}
