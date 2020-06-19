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
    <b-row
      v-else
    >
      <b-col
        v-if="filterGroups && isArray(filterGroups) && filterGroups.length"
        cols="3"
      >
        <b-form>
          <div
            v-for="(group, index) in filterGroups"
            :key="index"
            class="bg-light p-3"
          >
            <b-form-group
              v-for="filter in group.filters"
              :id="`ig_${filter.systemName}`"
              :key="filter.systemName"
              :label="filter.displayName"
              :label-for="`i_${filter.systemName}`"
            >
              <vue-typeahead-bootstrap
                v-if="filter.type === 'autocomplete'"
                :id="`i_${filter.systemName}`"
                v-model="form[filter.systemName]"
                :data="autocompleteData[filter.systemName]"
                :disable-sort="true"
                :show-all-results="true"
                @input="autocompleteLookup(filter.systemName)"
              />
            </b-form-group>
          </div>
        </b-form>
      </b-col>
      <b-col cols="9">
        Displaying {{ showingStart }} to {{ showingEnd }} of {{ total }} results.
        <b-pagination
          :value="currentPage"
          :total-rows="total"
          :per-page="body.size"
          @input="pageChanged"
        />
        <b-table
          striped
          hover
          :items="sortedItems"
          :fields="fields"
          :sort-by="sortBy"
          :sort-desc="sortDesc"
          :no-local-sorting="true"
          @sort-changed="sortingChanged"
        >
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
          @input="pageChanged"
        />
      </b-col>
    </b-row>
  </div>
</template>

<script>
import VueTypeaheadBootstrap from 'vue-typeahead-bootstrap'

import { extractFields, extractSystemNames } from '~/assets/js/es'
import { compareNameUnicode, isArray, isNumber, isObject } from '~/assets/js/utils'

export default {
  auth: false,
  components: {
    'vue-typeahead-bootstrap': VueTypeaheadBootstrap
  },
  validate ({ query }) {
    if ((query.page != null && !isNumber(query.page)) || query.page === '0') {
      return false
    }
    if (query.sortOrder != null && query.sortOrder !== 'asc' && query.sortOrder !== 'desc') {
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
    if ('es_filters' in this.$store.state.config.entity_types[this.$route.params.entity_type_name]) {
      this.form = {}
      for (const section of this.$store.state.config.entity_types[this.$route.params.entity_type_name].es_filters) {
        for (const filter of section.filters) {
          this.form[filter.systemName] = this.$route.query[`f_${filter.systemName}`] ?? null
          this.autocompleteData[filter.systemName] = []
        }
      }
      this.oldForm = JSON.parse(JSON.stringify(this.form))
    }
    const keys = extractSystemNames(this.$store.state.config.entity_types[this.$route.params.entity_type_name])
    // TODO: make size configurable
    const size = 25
    // TODO: make default sorting configurable
    this.sortBy = this.$route.query.sortBy == null ? keys[0] : this.$route.query.sortBy
    this.sortOrder = this.$route.query.sortOrder == null ? 'asc' : this.$route.query.sortOrder
    this.body = {
      keys,
      from: this.$route.query.page == null ? 0 : (parseInt(this.$route.query.page) - 1) * size,
      size,
      sort: [
        {
          [this.sortBy]: this.sortOrder
        }
      ]
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
      autocompleteData: {},
      body: {
        from: 0,
        size: 25
      },
      form: {},
      oldForm: {},
      sortBy: null,
      sortOrder: null
    }
  },
  computed: {
    currentPage () {
      return this.$route.query.page ?? 1
    },
    entityTypeConfig () {
      return this.$store.state.config.entity_types[this.entityTypeName]
    },
    entityTypeDisplayName () {
      return this.entityTypeConfig.display_name
    },
    entityTypeName () {
      return this.$route.params.entity_type_name
    },
    fields () {
      return extractFields(this.entityTypeConfig)
    },
    filterGroups () {
      return this.entityTypeConfig.es_filters
    },
    items () {
      return this.$store.state.es.items
    },
    projectName () {
      return this.$route.params.project_name
    },
    showingStart () {
      return this.body.from + 1
    },
    showingEnd () {
      if (this.total < this.body.from + this.body.size) {
        return this.total
      }
      return this.body.from + this.body.size
    },
    sortDesc () {
      return this.sortOrder === 'desc'
    },
    sortedItems () {
      if (
        this.sortBy != null &&
        this.entityTypeConfig.es_columns.filter(c => c.systemName === this.sortBy)[0].type === 'nested'
      ) {
        const items = []
        for (const item of this.items) {
          if (this.sortBy in item && isArray(item[this.sortBy]) && item[this.sortBy].length > 1) {
            items.push(this.sortItem(item))
          } else {
            items.push(item)
          }
        }
        return items
      }
      return this.items
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
    async autocompleteLookup (systemName) {
      // First search for 10 exact matches. If there are less results, use fuzzy matching
      const response = await this.$axios.post(
        `/es/${this.projectName}/${this.entityTypeName}/search`,
        {
          suggest: {
            autocomplete: {
              prefix: this.form[systemName],
              completion: {
                field: `${systemName}.completion`,
                skip_duplicates: true,
                size: 10
              }
            }
          }
        }
      )
      if (
        response.status === 200 &&
        'suggest' in response.data &&
        'autocomplete' in response.data.suggest &&
        isArray(response.data.suggest.autocomplete) &&
        isObject(response.data.suggest.autocomplete[0]) &&
        'options' in response.data.suggest.autocomplete[0] &&
        isArray(response.data.suggest.autocomplete[0].options)
      ) {
        this.autocompleteData[systemName] = response.data.suggest.autocomplete[0].options.map(o => o.text)
      } else {
        this.autocompleteData[systemName] = []
      }
    },
    constructQuery (queryPart) {
      const query = {}

      if ('page' in queryPart) {
        query.page = queryPart.page
      } else {
        query.page = Math.floor(this.body.from / this.body.size) + 1
      }

      if ('sortBy' in queryPart) {
        query.sortBy = queryPart.sortBy
      } else {
        query.sortBy = this.sortBy
      }

      if ('sortOrder' in queryPart) {
        query.sortOrder = queryPart.sortOrder
      } else {
        query.sortOrder = this.sortOrder
      }

      return query
    },
    formChanged () {
      const form = {}
      for (const field in this.form) {
        if (this.form[field] != null) {
          form[field] = this.form[field]
        }
      }
    },
    pageChanged (page) {
      if (page == null && this.body.from === 0) {
        return
      }
      if (page === Math.floor(this.body.from / this.body.size) + 1) {
        return
      }
      this.$router.push({ query: this.constructQuery({ page }) })
    },
    sortingChanged ({ sortBy, sortDesc }) {
      this.$router.push({ query: this.constructQuery({ sortBy, sortOrder: sortDesc ? 'desc' : 'asc' }) })
    },
    sortItem (item) {
      const result = {}
      for (const field in item) {
        if (field !== this.sortBy) {
          result[field] = item[field]
        } else if (this.sortOrder === 'desc') {
          result[field] = [...item[field]].sort(compareNameUnicode).reverse()
        } else {
          result[field] = [...item[field]].sort(compareNameUnicode)
        }
      }
      return result
    }
  }
}
</script>
