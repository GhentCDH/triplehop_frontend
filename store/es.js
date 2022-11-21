export const state = () => ({
  aggs: {},
  items: [],
  fullRangeData: {},
  nestedAggsCache: {},
  total: 0,
  sortBy: '',
  sortOrder: '',
  from: 0,
  to: 0
})

export const mutations = {
  SET_AGGS (state, payload) {
    state.aggs = payload
  },
  SET_ITEMS (state, payload) {
    state.items = payload
  },
  SET_NESTED_AGGS_CACHE (state, payload) {
    state.nestedAggsCache = payload
  },
  SET_TOTAL (state, payload) {
    state.total = payload
  },
  SET_SORT_BY (state, payload) {
    state.sortBy = payload
  },
  SET_SORT_ORDER (state, payload) {
    state.sortOrder = payload
  },
  SET_FROM (state, payload) {
    state.from = payload
  },
  SET_TO (state, payload) {
    state.to = payload
  }
}

export const actions = {
  async search ({ commit }, { body, entityTypeName, projectName, entityTypeConfig }) {
    const response = await this.$axios.post(
      `/es/${projectName}/${entityTypeName}/search`,
      body
    )
    if (
      response.status === 200 &&
      response.data != null
    ) {
      commit('SET_ITEMS', response.data.results)
      commit('SET_AGGS', response.data.aggs)
      commit('SET_TOTAL', response.data.total)
      commit('SET_SORT_BY', response.data.sortBy)
      commit('SET_SORT_ORDER', response.data.sortOrder)
      commit('SET_FROM', response.data.from)
      commit('SET_TO', response.data.to)
    }
  }
}
