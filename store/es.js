import { constructQuery, extractItems, extractTotal } from '~/assets/js/es'

export const state = () => ({
  total: 0,
  items: {}
})

export const mutations = {
  SET_ITEMS (state, payload) {
    state.items = payload
  },
  SET_TOTAL (state, payload) {
    state.total = payload
  }
}

export const actions = {
  async search ({ commit }, { body, entityTypeName, projectName }) {
    const response = await this.$axios.post(
      `/es/${projectName}/${entityTypeName}/search`,
      constructQuery(body)
    )
    if (response.data != null) {
      commit('SET_ITEMS', extractItems(body.keys, response.data))
      commit('SET_TOTAL', extractTotal(response.data))
    }
  }
}
