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
          getProject_config {
            system_name
            display_name
          }
        }
        `
      }
    )
    commit('SET_PROJECT_DEF', response.data.data.getProject_config)
  },
  async load_entity_types ({ commit }, projectName) {
    const response = await this.$axios.post(
      `/config/${projectName}`,
      {
        query: `
        {
          getEntity_config_s {
            system_name
            display_name
            detail
            source
            data {
              system_name
              display_name
              type
              validators {
                type
                regex
                error_message
              }
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
                  base_url
                }
              }
            }
            edit {
              layout {
                label
                fields {
                  label
                  field
                  type
                  placeholder
                  help_message
                  multi
                }
              }
            }
            elasticsearch {
              title
              columns {
                system_name
                display_name
                type
                sortable
                main_link
                link
                sub_field
                sub_field_type
              }
              filters {
                filters {
                  system_name
                  display_name
                  type
                  interval
                }
              }
            }
          }
        }
        `
      }
    )
    const rawConfig = response.data.data.getEntity_config_s
    const config = {}
    for (const raw of rawConfig) {
      config[raw.system_name] = {
        display_name: raw.display_name,
        source: raw.source,
        data: {},
        display: raw.display,
        edit: raw.edit
      }
      for (const rawField of raw.data) {
        config[raw.system_name].data[rawField.system_name] = {
          display_name: rawField.display_name,
          type: rawField.type,
          validators: rawField.validators
        }
      }
      if (raw.elasticsearch != null) {
        config[raw.system_name].elasticsearch = {
          title: raw.elasticsearch.title
        }
        if (raw.elasticsearch.columns != null) {
          config[raw.system_name].elasticsearch.columns = []
          for (const rawColumn of raw.elasticsearch.columns) {
            config[raw.system_name].elasticsearch.columns.push({
              systemName: rawColumn.system_name,
              displayName: rawColumn.display_name,
              type: rawColumn.type,
              sortable: rawColumn.sortable,
              mainLink: rawColumn.main_link,
              link: rawColumn.link,
              subField: rawColumn.sub_field,
              subFieldType: rawColumn.sub_field_type
            })
          }
        }
        if (raw.elasticsearch.filters != null) {
          config[raw.system_name].elasticsearch.filters = []
          for (const rawSection of raw.elasticsearch.filters) {
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
            config[raw.system_name].elasticsearch.filters.push(section)
          }
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
          getRelation_config_s {
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
    const rawConfig = response.data.data.getRelation_config_s
    const config = {}
    for (const raw of rawConfig) {
      config[raw.system_name] = {
        display_name: raw.display_name,
        display: raw.display,
        domain_names: raw.domain_names,
        range_names: raw.range_names
      }
      if (raw.data != null) {
        config[raw.system_name].data = {}
        for (const rawField of raw.data) {
          config[raw.system_name].data[rawField.system_name] = {
            display_name: rawField.display_name,
            type: rawField.type
          }
        }
      }
    }
    commit('SET_RELATION_TYPES', config)
  }
}
