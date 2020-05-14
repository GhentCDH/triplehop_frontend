export const state = () => ({
  jobs: {}
})

export const mutations = {
  SET_JOB (state, payload) {
    state.jobs[payload.id] = payload
  }
}

export const actions = {
  async load_single_by_project ({ commit }, { id, projectName }) {
    const response = await this.$axios.get(
      `/job/${projectName}/${id}`
    )
    if (response.data != null) {
      commit('SET_JOB', response.data)
    }
  }
}
