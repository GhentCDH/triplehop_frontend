<template>
  <div>
    <!-- TODO: configure multiple or search page title -->
    <h1>Search {{ entityTypeDisplayName }}s</h1>
    <p v-if="$fetchState.pending">
      Fetching data...
    </p>
    <p v-else-if="$fetchState.error">
      Error while fetching data...
    </p>
    <div v-else>
      Displaying {{ showing_start }} to {{ showing_end }} of {{ total }} results.
      <b-pagination
        :value="currentPage"
        :total-rows="total"
        :per-page="body.size"
        @input="changePage"
      />
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
      <b-pagination
        :value="currentPage"
        :total-rows="total"
        :per-page="body.size"
        @input="changePage"
      />
    </div>
  </div>
</template>

<script>
import { extractFields, extractSystemNames } from '~/assets/js/es'
import { isArray, isNumber, isObject } from '~/assets/js/utils'

export default {
  auth: false,
  validate ({ query }) {
    if ((query.page != null && !isNumber(query.page)) || query.page === '0') {
      return false
    }
    return true
  },
  async fetch () {
    await this.$store.dispatch('config/load_entity_types', this.$route.params.project_name)
    if (!(this.$route.params.entity_type_name in this.$store.state.config.entity_types)) {
      return this.$nuxt.error({
        statusCode: 404,
        message: `Entity type "${this.$route.params.entity_type_name}" cannot be found.`
      })
    }
    if (!('es_columns' in this.$store.state.config.entity_types[this.$route.params.entity_type_name])) {
      return this.$nuxt.error({
        statusCode: 404,
        message: `No search page configured for entity type "${this.$route.params.entity_type_name}".`
      })
    }
    const keys = extractSystemNames(this.$store.state.config.entity_types[this.$route.params.entity_type_name])
    // TODO: make size configurable
    const size = 25
    this.body = {
      keys,
      // TODO: make default sorting configurable
      sort: [keys[0]],
      from: this.$route.query.page == null ? 0 : (parseInt(this.$route.query.page) - 1) * size,
      size
    }
    await this.$store.dispatch(
      'es/search',
      {
        body: this.body,
        entityTypeName: this.$route.params.entity_type_name,
        projectName: this.$route.params.project_name,
        entityTypeConfig: this.$store.state.config.entity_types[this.$route.params.entity_type_name]
      }
    )
  },
  data () {
    return {
      body: {
        from: 0,
        size: 25
      }
    }
  },
  computed: {
    currentPage () {
      return this.$route.query.page ?? 1
    },
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
    showing_start () {
      return this.body.from + 1
    },
    showing_end () {
      if (this.total < this.body.from + this.body.size) {
        return this.total
      }
      return this.body.from + this.body.size
    },
    total () {
      return this.$store.state.es.total
    }
  },
  watch: {
    '$route.query': '$fetch'
  },
  methods: {
    isArray,
    isObject,
    changePage (page) {
      if (page == null && this.body.from === 0) {
        return
      }
      if (page === Math.floor(this.body.from / this.body.size) + 1) {
        return
      }
      this.body.from = (page - 1) * this.body.size
      this.$router.push({ query: { page } })
    }
  }
}
</script>
