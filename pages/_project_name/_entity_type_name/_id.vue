<template>
  <b-container>
    {{ JSON.stringify(config) }}
  </b-container>
</template>

<script>
import { capitalizeFirstLetter, isNumber } from '~/assets/js/utils'

export default {
  validate ({ params }) {
    // TODO: validate project_name and entity_type_name based on cached config
    // Make sure id is a number
    if (!isNumber(params.id)) {
      return false
    }
    return true
  },
  async asyncData ({ $axios, params, store }) {
    // TODO: get project config (from cache), get fields from project config
    // TODO (backend): allow fields to be ordered

    await store.dispatch('config/load', params.project_name)
    const response = await $axios.post(
      params.project_name,
      {
        query: `
          {
            ${capitalizeFirstLetter(params.entity_type_name)}(id: ${params.id}) {
              title
              year
            }
          }
        `
      }
    )
    return response.data.data
  },
  computed: {
    config () {
      return this.$store.state.config.config
    }
  },
  head () {
    // Set Meta Tags for this Page
  }
}
</script>
