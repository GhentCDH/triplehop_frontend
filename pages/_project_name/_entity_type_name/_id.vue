<template>
  <b-container>
    {{ JSON.stringify(entity_types_config) }}
    {{ JSON.stringify(entity_data) }}
  </b-container>
</template>

<script>
import { isNumber } from '~/assets/js/utils'

export default {
  validate ({ params }) {
    // TODO: validate project_name and entity_type_name based on cached config
    // Make sure id is a number
    if (!isNumber(params.id)) {
      return false
    }
    return true
  },
  async fetch ({ $axios, params, store, error }) {
    // TODO (backend): allow fields to be ordered
    // TODO (backend): allow display widget configuration
    // TODO https://github.com/superwf/vuex-cache -> how to reset cache (subscriptions?)?

    await store.dispatch('config/load_entity_types', params.project_name)
    if (!(params.entity_type_name in store.state.config.entity_types)) {
      return error({ statusCode: 404, message: `Entity type "${params.entity_type_name}" not found.` })
    }

    await store.dispatch(
      'data/load',
      {
        entityConfig: store.state.config.entity_types[params.entity_type_name],
        params
      }
    )
  },
  computed: {
    entity_types_config () {
      return this.$store.state.config.entity_types
    },
    entity_data () {
      return this.$store.state.data.data
    }
  },
  head () {
    // Set Meta Tags for this Page
  }
}
</script>
