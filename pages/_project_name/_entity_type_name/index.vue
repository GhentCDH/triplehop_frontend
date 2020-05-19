<template>
  <div>
    Search {{ entityTypeDisplayName }}s
    <b-table striped hover :items="items" :fields="fields">
      <template v-slot:cell()="data">
        <template v-if="isArray(data.value)">
          <ul v-if="data.value.length > 1">
            <li
              v-for="(item, index) in data.value"
              :key="index"
            >
              <nuxt-link
                v-if="isObject(item) && 'id' in item && 'name' in item && 'entity_type_name' in item"
                :to="`/${projectName}/${item.entity_type_name}/${item.id}`"
              >
                {{ item.name }}
              </nuxt-link>
              <template v-else>
                {{ item.value }}
              </template>
            </li>
          </ul>
          <template v-else-if="data.value.length == 1">
            <nuxt-link
              v-if="isObject(data.value[0]) && 'id' in data.value[0] && 'name' in data.value[0] && 'entity_type_name' in data.value[0]"
              :to="`/${projectName}/${data.value[0].entity_type_name}/${data.value[0].id}`"
            >
              {{ data.value[0].name }}
            </nuxt-link>
            <template v-else>
              {{ data.value[0] }}
            </template>
          </template>
        </template>
        <template v-else>
          <nuxt-link
            v-if="isObject(data.value) && 'id' in data.value && 'name' in data.value && 'entity_type_name' in data.value"
            :to="`/${projectName}/${data.value.entity_type_name}/${data.value.id}`"
          >
            {{ data.value.name }}
          </nuxt-link>
          <template v-else>
            {{ data.value }}
          </template>
        </template>
      </template>
    </b-table>
  </div>
</template>

<script>
import { extractFields, extractSystemNames } from '~/assets/js/es'
import { isArray, isObject } from '~/assets/js/utils'

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
    const keys = extractSystemNames(store.state.config.entity_types[params.entity_type_name])
    await store.dispatch(
      'es/search',
      {
        body: {
          keys,
          // TODO: make default sorting configurable
          sort: [keys[0]],
          from: 0,
          // TODO: make size configurable
          size: 25
        },
        entityTypeName: params.entity_type_name,
        projectName: params.project_name,
        entityTypeConfig: store.state.config.entity_types[params.entity_type_name]
      }
    )
  },
  computed: {
    entityTypeName () {
      return this.$route.params.entity_type_name
    },
    entityTypeDisplayName () {
      return this.$store.state.config.entity_types[this.entityTypeName].display_name
    },
    fields () {
      return extractFields(this.$store.state.config.entity_types[this.entityTypeName])
    },
    items () {
      return this.$store.state.es.items
    },
    projectName () {
      return this.$route.params.project_name
    },
    total () {
      return this.$store.state.es.total
    }
  },
  methods: {
    isArray,
    isObject
  }
}
</script>
