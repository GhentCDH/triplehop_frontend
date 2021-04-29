import { constructAggsQuery, constructDataQuery, extractAggs, extractItems, extractTotal } from '~/assets/js/es'

export const state = () => ({
  aggs: {},
  items: [],
  total: 0
})

export const mutations = {
  SET_AGGS (state, payload) {
    state.aggs = payload
  },
  SET_ITEMS (state, payload) {
    state.items = payload
  },
  SET_TOTAL (state, payload) {
    state.total = payload
  }
}

export const actions = {
  async search_data ({ commit }, { body, entityTypeName, projectName, entityTypeConfig }) {
    const response = await this.$axios.post(
      `/es/${projectName}/${entityTypeName}/search`,
      constructDataQuery(body, entityTypeConfig)
    )
    if (response.data != null) {
      commit('SET_ITEMS', extractItems(body.keys, response.data, entityTypeName))
      commit('SET_TOTAL', extractTotal(response.data))
    }
  },
  async search_aggs ({ commit }, { body, entityTypeName, projectName, entityTypeConfig }) {
    const response = await this.$axios.post(
      `/es/${projectName}/${entityTypeName}/search`,
      constructAggsQuery(body, entityTypeConfig)
    )
    if (response.data != null) {
      commit('SET_AGGS', extractAggs(response.data, entityTypeConfig))
    }
  }
}
