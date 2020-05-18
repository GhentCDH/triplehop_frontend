<template>
  <div>
    <b-table striped hover :items="items" :fields="fields" />
  </div>
</template>

<script>
import { extractFields, extractSystemNames } from '~/assets/js/es'

export default {
  auth: false,
  async fetch ({ params, store, error, $axios }) {
    await store.dispatch('config/load_entity_types', params.project_name)
    if (!(params.entity_type_name in store.state.config.entity_types)) {
      return error({
        statusCode: 404,
        message: `Entity type "${params.entity_type_name}" cannot be found.`
      })
    }
    if (!('es_columns' in store.state.config.entity_types[params.entity_type_name])) {
      return error({
        statusCode: 404,
        message: `No search page configured for entity type "${params.entity_type_name}".`
      })
    }
    await store.dispatch(
      'es/search',
      {
        body: {
          keys: extractSystemNames(store.state.config.entity_types[params.entity_type_name].es_columns)
        },
        entityTypeName: params.entity_type_name,
        projectName: params.project_name
      }
    )
  },
  computed: {
    entityTypeName () {
      return this.$route.params.entity_type_name
    },
    fields () {
      return extractFields(this.$store.state.config.entity_types[this.entityTypeName].es_columns)
    },
    items () {
      return this.$store.state.es.items
    },
    total () {
      return this.$store.state.es.total
    }
  }
}
</script>
