<template>
  <div>
    {{ this.$store.state.config.entity_types }}
  </div>
</template>

<script>
export default {
  auth: false,
  async fetch ({ params, store, error }) {
    await store.dispatch('config/load_entity_types', params.project_name)
    if (!(params.entity_type_name in store.state.config.entity_types)) {
      return error({
        statusCode: 404,
        message: `Entity type "${params.entity_type_name}" cannot be found.`
      })
    }
    await store.dispatch('config/load_relation_types', params.project_name)
  },
  data () {
    return {
      items: [],
      fields: []
    }
  }
}
</script>
