export const state = () => ({
  project_def: {},
  entity_types: {},
  relation_types: {}
})

export const mutations = {
  SET_PROJECT_DEF (state, payload) {
    state.project_def = payload
  },
  SET_ENTITY_TYPES (state, payload) {
    state.entity_types = payload
  },
  SET_RELATION_TYPES (state, payload) {
    state.relation_types = payload
  }
}

export const actions = {
  async load_poject_def ({ commit }, projectName) {
    const response = await this.$axios.post(
      `/config/${projectName}`,
      {
        query: `
        {
          Project_config {
            system_name
            display_name
          }
        }
        `
      }
    )
    commit('SET_PROJECT_DEF', response.data.data.Project_config)
  },
  async load_entity_types ({ commit }, projectName) {
    const response = await this.$axios.post(
      `/config/${projectName}`,
      {
        query: `
        {
          Entity_config_s {
            system_name
            display_name
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
            es_columns {
              system_name
              display_name
              type
              sortable
            }
            es_filters {
              filters {
                system_name
                display_name
                type
                interval
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
        data: {},
        display: raw.display
      }
      for (const rawField of raw.data) {
        config[raw.system_name].data[rawField.system_name] = {
          display_name: rawField.display_name,
          type: rawField.type
        }
      }
      if (raw.es_columns != null) {
        config[raw.system_name].es_columns = []
        for (const rawColumn of raw.es_columns) {
          config[raw.system_name].es_columns.push({
            systemName: rawColumn.system_name,
            displayName: rawColumn.display_name,
            type: rawColumn.type,
            sortable: rawColumn.sortable
          })
        }
      }
      if (raw.es_filters != null) {
        config[raw.system_name].es_filters = []
        for (const rawSection of raw.es_filters) {
          const section = {
            filters: []
          }
          for (const rawFilter of rawSection.filters) {
            const filter = {
              systemName: rawFilter.system_name,
              displayName: rawFilter.display_name,
              type: rawFilter.type
            }
            if ('interval' in rawFilter) {
              filter.interval = rawFilter.interval
            }
            section.filters.push(filter)
          }
          config[raw.system_name].es_filters.push(section)
        }
      }
    }
    commit('SET_ENTITY_TYPES', config)
  },
  async load_relation_types ({ commit }, projectName) {
    const response = await this.$axios.post(
      `/config/${projectName}`,
      {
        query: `
        {
          Relation_config_s {
            system_name
            display_name
            data {
              system_name
              display_name
              type
            }
            display {
              domain_title
              range_title
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
            domain_names
            range_names
          }
        }
        `
      }
    )
    const rawConfig = response.data.data.Relation_config_s
    const config = {}
    for (const raw of rawConfig) {
      config[raw.system_name] = {
        display_name: raw.display_name,
        data: {},
        display: raw.display,
        domain_names: raw.domain_names,
        range_names: raw.range_names
      }
      for (const rawField of raw.data) {
        config[raw.system_name].data[rawField.system_name] = {
          display_name: rawField.display_name,
          type: rawField.type
        }
      }
    }
    commit('SET_RELATION_TYPES', config)
  }
}