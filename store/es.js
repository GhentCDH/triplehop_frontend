import {
  constructAggsQuery,
  constructAllNestedAggQuery,
  constructDataQuery,
  constructFullRangeAggQuery,
  extractAggs,
  extractAllNestedAggs,
  extractItems,
  extractTotal
} from '~/assets/js/es'

export const state = () => ({
  aggs: {},
  aggsInitialized: false,
  items: [],
  fullRangeData: {},
  nestedAggsCache: {},
  total: 0
})

export const mutations = {
  SET_AGGS (state, payload) {
    state.aggs = payload
  },
  SET_AGGS_INITIALIZED (state, payload) {
    state.aggsInitialized = payload
  },
  SET_ITEMS (state, payload) {
    state.items = payload
  },
  SET_FULL_RANGE_DATA (state, payload) {
    state.fullRangeData = payload
  },
  SET_NESTED_AGGS_CACHE (state, payload) {
    state.nestedAggsCache = payload
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
    if (
      response.status === 200 &&
      response.data != null
    ) {
      commit('SET_ITEMS', extractItems(body.keys, response.data, entityTypeName))
      commit('SET_TOTAL', extractTotal(response.data))
    }
  },
  async search_aggs ({ commit, state }, { body, entityTypeName, projectName, esFiltersDefs }) {
    if (!(state.aggsInitialized)) {
      if (Object.values(esFiltersDefs).filter((def) => { return def.type === 'histogram_slider' }).length !== 0) {
        const response = await this.$axios.post(
          `/es/${projectName}/${entityTypeName}/search`,
          constructFullRangeAggQuery(esFiltersDefs)
        )
        if (
          response.status === 200 &&
          'aggregations' in response.data
        ) {
          const fullRangeData = {}
          for (const [aggName, aggResult] in Object.entries(response.data.aggregations)) {
            fullRangeData[aggName] = aggResult.value
          }
          commit('SET_FULL_RANGE_DATA', fullRangeData)
        }
      }
      if (Object.values(esFiltersDefs).filter((def) => { return def.type === 'nested' }).length !== 0) {
        const response = await this.$axios.post(
          `/es/${projectName}/${entityTypeName}/search`,
          constructAllNestedAggQuery(esFiltersDefs)
        )
        if (
          response.status === 200 &&
          'aggregations' in response.data
        ) {
          commit('SET_NESTED_AGGS_CACHE', extractAllNestedAggs(response.data, esFiltersDefs))
        }
      }
      commit('SET_AGGS_INITIALIZED', true)
    }
    const response = await this.$axios.post(
      `/es/${projectName}/${entityTypeName}/search`,
      constructAggsQuery(body, esFiltersDefs)
    )
    if (response.data != null) {
      commit('SET_AGGS', extractAggs(response.data, esFiltersDefs, state.nestedAggsCache))
    }
  }
}
