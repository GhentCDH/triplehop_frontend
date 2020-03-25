export const state = () => ({
  notifications: []
})

export const mutations = {
  ADD (state, payload) {
    state.notifications.push(payload)
  },
  REMOVE (state, payload) {
    state.notifications.splice(payload, 1)
  }
}

export const actions = {
  create ({ commit }, notification) {
    commit('ADD', notification)
  },
  remove ({ commit }, index) {
    commit('REMOVE', index)
  }
}
