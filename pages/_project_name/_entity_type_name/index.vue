<template>
  <div>
    <b-breadcrumb
      class="bg-light"
      :items="breadcrumbs"
    />

    <!-- TODO: configure multiple or search page title -->
    <h1>{{ entityTypeConfig.elasticsearch.title }}</h1>
    <p v-if="$fetchState.error">
      Error while fetching data...
    </p>
    <b-overlay
      v-else
      :show="$fetchState.pending"
      spinner-variant="primary"
    >
      <b-row>
        <b-col
          v-if="filterGroups && isArray(filterGroups) && filterGroups.length"
          md="3"
        >
          <b-button
            aria-controles="filters"
            :aria-expanded="displayFilters ? 'true' : 'false'"
            variant="primary"
            class="d-md-none"
            :disabled="!displayFiltersInitialized"
            @click="displayFilters = !displayFilters"
          >
            {{ displayFiltersInitialized && displayFilters ? 'Hide filters' : 'Display filters' }}
          </b-button>
          <!-- Hide on small screens using bootstrap classes first, then with v-model -->
          <b-collapse
            id="filters"
            v-model="displayFilters"
            :class="displayFiltersInitialized ? '' : 'd-none d-md-block'"
          >
            <b-overlay
              :show="disableFormElements"
              spinner-variant="primary"
            >
              <b-form @submit.prevent="searchQueryChanged">
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
                      v-if="filter.type === 'autocomplete' && autocompleteData[filter.systemName] != null"
                      :id="`i_${filter.systemName}`"
                      v-model="form[filter.systemName]"
                      :data="autocompleteData[filter.systemName]"
                      :disable-sort="true"
                      :show-all-results="true"
                      :disabled="disableFormElements"
                      @input="autocompleteLookup(filter.systemName)"
                      @hit="searchQueryChanged"
                      @keyup.enter.prevent="searchQueryChanged"
                    />
                    <template v-if="filter.type === 'histogram_slider' && aggs != null && aggs[`${filter.systemName}_hist`] != null">
                      <vue-slider
                        v-if="fullRangeData[`${filter.systemName}_min`] != null && fullRangeData[`${filter.systemName}_max`] != null"
                        v-model="form[filter.systemName]"
                        class="mt-5"
                        :min="fullRangeData[`${filter.systemName}_min`]"
                        :max="fullRangeData[`${filter.systemName}_max`]"
                        :dot-options="sliderDotOptions"
                        :process-style="sliderProcessStyle"
                        :tooltip-style="sliderTooltipStyle"
                        tooltip="always"
                        @drag-end="searchQueryChanged"
                      />
                      <vue-slider
                        v-else
                        class="mt-5"
                      />
                      <histogram :chart-data="aggs[`${filter.systemName}_hist`]" />
                    </template>
                    <multiselect
                      v-if="filter.type === 'nested' && aggs != null && aggs[filter.systemName] != null"
                      v-model="form[filter.systemName]"
                      :clear-on-select="false"
                      :close-on-select="false"
                      :disabled="disableFormElements"
                      label="name"
                      :multiple="true"
                      :options="aggs[filter.systemName]"
                      :preserve-search="true"
                      :show-labels="false"
                      track-by="id"
                      @close="multiselectClose(filter.systemName)"
                      @input="multiselectInput(filter.systemName)"
                      @open="multiselectOpen(filter.systemName)"
                    >
                      <template slot="option" slot-scope="props">
                        {{ props.option.name }}
                        <b-badge
                          :pill="true"
                        >
                          {{ props.option.count }}
                        </b-badge>
                      </template>
                    </multiselect>
                    <multiselect
                      v-if="filter.type === 'dropdown' && aggs != null && aggs[filter.systemName] != null"
                      v-model="form[filter.systemName]"
                      :clear-on-select="false"
                      :close-on-select="false"
                      :disabled="disableFormElements"
                      label="key"
                      :multiple="true"
                      :options="aggs[filter.systemName]"
                      :preserve-search="true"
                      :show-labels="false"
                      track-by="key"
                      @close="multiselectClose(filter.systemName)"
                      @input="multiselectInput(filter.systemName)"
                      @open="multiselectOpen(filter.systemName)"
                    >
                      <template slot="option" slot-scope="props">
                        {{ props.option.key }}
                        <b-badge
                          :pill="true"
                        >
                          {{ props.option.count }}
                        </b-badge>
                      </template>
                    </multiselect>
                  </b-form-group>
                </div>
              </b-form>
            </b-overlay>
          </b-collapse>
        </b-col>
        <b-col
          v-if="total.value > 0"
          md="9"
        >
          Displaying {{ showingStart }} to {{ showingEnd }}
          of {{ total.relation === 'gte' ? 'more than' : '' }} {{ total.value }} results.
          <b-pagination
            :value="currentPage"
            :total-rows="total.value"
            :per-page="body.size"
            @input="pageChanged"
          />
          <b-table
            striped
            hover
            :items="sortedItems"
            :fields="fields"
            :sort-by="sortBy.split('.')[0]"
            :sort-desc="sortDesc"
            :no-local-sorting="true"
            @sort-changed="sortingChanged"
          >
            <template v-slot:cell()="data">
              <template v-if="isArray(data.value)">
                <ul
                  v-if="data.value.length > 1"
                  class="list-line"
                >
                  <li
                    v-for="(item, index) in data.value"
                    :key="index"
                  >
                    <!-- nested -->
                    <nuxt-link
                      v-if="isObject(item) && 'id' in item && 'name' in item && 'entity_type_name' in item"
                      :to="`${projectPrefix}${item.entity_type_name}/${item.id}`"
                    >
                      {{ nameOrNA(item.name) }}
                    </nuxt-link>
                    <template v-else>
                      {{ item }}
                    </template>
                  </li>
                </ul>
                <template v-else-if="data.value.length == 1">
                  <!-- nested -->
                  <nuxt-link
                    v-if="isObject(data.value[0]) && 'id' in data.value[0] && 'name' in data.value[0] && 'entity_type_name' in data.value[0]"
                    :to="`${projectPrefix}${data.value[0].entity_type_name}/${data.value[0].id}`"
                  >
                    {{ nameOrNA(data.value[0].name) }}
                  </nuxt-link>
                  <template v-else>
                    {{ data.value[0] }}
                  </template>
                </template>
              </template>
              <template v-else>
                <!-- nested -->
                <nuxt-link
                  v-if="isObject(data.value) && 'id' in data.value && 'name' in data.value && 'entity_type_name' in data.value"
                  :to="`${projectPrefix}${data.value.entity_type_name}/${data.value.id}`"
                >
                  {{ nameOrNA(data.value.name) }}
                </nuxt-link>
                <!-- edtf -->
                <template
                  v-else-if="isObject(data.value) && 'text' in data.value"
                >
                  {{ nameOrNA(data.value.text) }}
                </template>
                <template v-else>
                  {{ data.value }}
                </template>
              </template>
            </template>
          </b-table>
          <b-pagination
            :value="currentPage"
            :total-rows="total.value"
            :per-page="body.size"
            @input="pageChanged"
          />
        </b-col>
        <b-col
          v-else
          md="9"
        >
          <em>No results found.</em>
        </b-col>
      </b-row>
    </b-overlay>
  </div>
</template>

<script>
import Multiselect from 'vue-multiselect'
import rfdc from 'rfdc'
import VueSlider from 'vue-slider-component/dist-css/vue-slider-component.umd.min.js'
import 'vue-slider-component/dist-css/vue-slider-component.css'
import 'vue-slider-component/theme/default.css'
import VueTypeaheadBootstrap from 'vue-typeahead-bootstrap'
import Histogram from '~/components/Histogram'

import { MAX_INT, getFields, getFilterDefs, getSystemNames } from '~/assets/js/es'
import { compareNameUnicode, isArray, isNumber, isObject } from '~/assets/js/utils'
import { COLOR_PRIMARY } from '~/assets/js/variables'

export default {
  auth: false,
  components: {
    Histogram,
    Multiselect,
    VueSlider,
    VueTypeaheadBootstrap
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
    if (!(this.entityTypeName in this.entityTypesConfig)) {
      return this.$nuxt.error({
        statusCode: 404,
        message: `Entity type "${this.entityTypeName}" cannot be found.`
      })
    }
    if (!('elasticsearch' in this.entityTypeConfig)) {
      return this.$nuxt.error({
        statusCode: 404,
        message: `No search page available for entity type "${this.entityTypeName}".`
      })
    }
    for (const [systemName, filter] of Object.entries(this.esFiltersDefs)) {
      if (filter.type === 'histogram_slider') {
        this.form[systemName] = [
          this.$route.query[`filter[${systemName}]_min`] ?? null,
          this.$route.query[`filter[${systemName}]_max`] ?? null
        ]
        continue
      }
      if (filter.type === 'nested') {
        if (this.$route.query[`filter[${systemName}][0]`] == null) {
          this.form[systemName] = null
          continue
        }
        this.form[systemName] = []
        let counter = 0
        while (this.$route.query[`filter[${systemName}][${counter}]`] != null) {
          const value = this.$route.query[`filter[${systemName}][${counter}]`]
          const intValue = parseInt(value)
          if (Number.isNaN(intValue) || intValue > MAX_INT) {
            return this.$nuxt.error({
              statusCode: 400,
              message: `Invalid value "${value}" for filter "${systemName}".`
            })
          }
          this.form[systemName].push(
            {
              id: intValue
            }
          )
          counter++
        }
        continue
      }
      if (filter.type === 'dropdown') {
        if (this.$route.query[`filter[${systemName}][0]`] == null) {
          this.form[systemName] = null
          continue
        }
        this.form[systemName] = []
        let counter = 0
        while (this.$route.query[`filter[${systemName}][${counter}]`] != null) {
          this.form[systemName].push(
            {
              key: this.$route.query[`filter[${systemName}][${counter}]`]
            }
          )
          counter++
        }
        continue
      }
      this.form[systemName] = this.$route.query[`filter[${systemName}]`] ?? null
      if (this.esFiltersDefs[systemName].type === 'autocomplete') {
        this.autocompleteData[systemName] = []
      }
    }

    // Request only the data on initial request, since aggregation can be relatively slow

    const keys = getSystemNames(this.$store.state.config.entity_types[this.$route.params.entity_type_name])
    // TODO: make size configurable
    const size = 25
    // TODO: make default sorting configurable
    this.sortBy = this.$route.query.sortBy == null ? keys[0] : this.$route.query.sortBy
    this.sortOrder = this.$route.query.sortOrder == null ? 'asc' : this.$route.query.sortOrder

    this.body = {
      keys,
      filters: this.form,
      from: this.$route.query.page == null ? 0 : (parseInt(this.$route.query.page) - 1) * size,
      size,
      sort: [
        {
          [this.sortBy]: this.sortOrder
        }
      ]
    }

    await this.$store.dispatch(
      'es/search_data',
      {
        body: this.body,
        entityTypeName: this.entityTypeName,
        projectName: this.projectName,
        entityTypeConfig: this.entityTypeConfig
      }
    )
    // Make sure dropdowns are rendered (with no options)
    this.$store.dispatch('es/initialize_empty_aggs', { esFiltersDefs: this.esFiltersDefs })
    this.oldForm = JSON.parse(JSON.stringify(this.form))
  },
  data () {
    return {
      autocompleteData: {},
      body: {
        from: 0,
        size: 25
      },
      disableFormElements: true,
      displayFilters: true,
      displayFiltersInitialized: false,
      form: {},
      multiselectState: {},
      oldForm: {},
      sliderDotOptions: {
        focusStyle: {
          'box-shadow': `0px 0px 1px 2px ${COLOR_PRIMARY}`
        }
      },
      sliderProcessStyle: {
        backgroundColor: COLOR_PRIMARY
      },
      sliderTooltipStyle: {
        backgroundColor: COLOR_PRIMARY,
        borderColor: COLOR_PRIMARY
      },
      sortBy: null,
      sortOrder: null
    }
  },
  computed: {
    aggs () {
      const aggs = rfdc()(this.$store.state.es.aggs)

      // Display invalid options
      for (const [systemName, filterValues] of Object.entries(this.form)) {
        if (this.esFiltersDefs[systemName].type === 'nested') {
          if (filterValues != null && filterValues.length > 0) {
            for (const filterValue of filterValues) {
              if (!(systemName in aggs)) {
                aggs[systemName] = []
              }
              let found = false
              for (const agg of aggs[systemName]) {
                if (filterValue.id === agg.id) {
                  found = true
                  break
                }
              }
              if (!found) {
                aggs[systemName].push({
                  id: filterValue.id,
                  name: '<Invalid option>',
                  count: 0
                })
              }
            }
          }
          continue
        }
        if (this.esFiltersDefs[systemName].type === 'dropdown') {
          if (filterValues != null && filterValues.length > 0) {
            for (const filterValue of filterValues) {
              if (!(systemName in aggs)) {
                aggs[systemName] = []
              }
              let found = false
              for (const agg of aggs[systemName]) {
                if (filterValue.key === agg.key) {
                  found = true
                  break
                }
              }
              if (!found) {
                aggs[systemName].push({
                  key: '<Invalid option>',
                  count: 0
                })
              }
            }
          }
          continue
        }
      }

      return aggs
    },
    breadcrumbs () {
      const breadcrumbs = []
      // project home
      if (this.$config.homepage != null) {
        breadcrumbs.push({
          text: 'Home',
          href: this.$config.homepage
        })
      } else {
        breadcrumbs.push({
          text: 'Home',
          to: this.projectPrefix
        })
      }
      // entity search
      breadcrumbs.push({
        text: this.entityTypeConfig.display_name,
        active: true
      })
      return breadcrumbs
    },
    currentPage () {
      return this.$route.query.page ?? 1
    },
    entityTypeConfig () {
      return this.entityTypesConfig[this.entityTypeName]
    },
    entityTypesConfig () {
      return this.$store.state.config.entity_types
    },
    entityTypeDisplayName () {
      return this.entityTypeConfig.display_name
    },
    entityTypeName () {
      return this.$route.params.entity_type_name
    },
    esFiltersDefs () {
      return getFilterDefs(this.entityTypeConfig)
    },
    fields () {
      return getFields(this.entityTypeConfig)
    },
    filterGroups () {
      return this.entityTypeConfig.elasticsearch.filters
    },
    fullRangeData () {
      return this.$store.state.es.fullRangeData
    },
    items () {
      return this.$store.state.es.items
    },
    projectName () {
      return this.$config.projectName ?? this.$route.params.project_name
    },
    projectPrefix () {
      return this.$config.projectName == null ? `/${this.projectName}/` : '/'
    },
    showingStart () {
      return this.body.from + 1
    },
    showingEnd () {
      if (this.total.value < this.body.from + this.body.size) {
        return this.total.value
      }
      return this.body.from + this.body.size
    },
    sortDesc () {
      return this.sortOrder === 'desc'
    },
    sortedItems () {
      if (
        this.sortBy != null &&
        !(this.sortBy.includes('.')) &&
        this.entityTypeConfig.elasticsearch.columns.filter(c => c.systemName === this.sortBy)[0].type === 'nested'
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
    '$route.query': 'reload'
  },
  async mounted () {
    await this.$nextTick()
    this.displayOrHideFilters()
    const self = this
    window.addEventListener('resize', self.displayOrHideFilters)

    this.fetchAggregations()
  },
  methods: {
    isArray,
    isObject,
    async autocompleteLookup (systemName) {
      // TODO: create component to include this functionality?
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
    constructRouterQuery (queryPart) {
      const query = {}

      for (const [systemName, filterValues] of Object.entries(this.form)) {
        if (this.esFiltersDefs[systemName].type === 'histogram_slider') {
          if (
            filterValues[0] != null &&
            filterValues[0] !== this.fullRangeData[`${systemName}_min`]
          ) {
            query[`filter[${systemName}]_min`] = filterValues[0]
          }
          if (
            filterValues[1] != null &&
            filterValues[1] !== this.fullRangeData[`${systemName}_max`]
          ) {
            query[`filter[${systemName}]_max`] = filterValues[1]
          }
          continue
        }
        if (this.esFiltersDefs[systemName].type === 'nested') {
          if (filterValues != null && filterValues.length > 0) {
            for (const [i, filterValue] of filterValues.entries()) {
              query[`filter[${systemName}][${i}]`] = filterValue.id
            }
          }
          continue
        }
        if (this.esFiltersDefs[systemName].type === 'dropdown') {
          if (filterValues != null && filterValues.length > 0) {
            for (const [i, filterValue] of filterValues.entries()) {
              query[`filter[${systemName}][${i}]`] = filterValue.key
            }
          }
          continue
        }
        if (filterValues != null && filterValues !== '') {
          query[`filter[${systemName}]`] = filterValues
        }
      }

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
    displayOrHideFilters () {
      if (process.client) {
        if (window.innerWidth < 768) {
          this.displayFilters = false
        } else {
          this.displayFilters = true
        }
      }
      // Collapse has a .35s animation when toggled
      if (!(this.displayFiltersInitialized)) {
        setTimeout(() => { this.displayFiltersInitialized = true }, 350)
      }
    },
    formChanged () {
      const form = {}
      for (const field of this.form) {
        if (this.form[field] != null) {
          form[field] = this.form[field]
        }
      }
    },
    async fetchAggregations () {
      await this.$store.dispatch(
        'es/search_aggs',
        {
          body: this.body,
          entityTypeName: this.entityTypeName,
          projectName: this.projectName,
          esFiltersDefs: this.esFiltersDefs
        }
      )

      for (const [systemName, filter] of Object.entries(this.esFiltersDefs)) {
        if (filter.type === 'histogram_slider') {
          this.form[systemName] = [
            this.form[systemName][0] ?? this.fullRangeData[`${systemName}_min`],
            this.form[systemName][1] ?? this.fullRangeData[`${systemName}_max`]
          ]
          continue
        }
        if (filter.type === 'nested') {
          if (this.form[systemName] != null) {
            this.form[systemName] = this.form[systemName].map(
              (filterValue) => {
                return this.aggs[systemName].filter(v => v.id === filterValue.id)[0]
              }
            )
          }
          continue
        }
        if (filter.type === 'dropdown') {
          if (this.form[systemName] != null) {
            this.form[systemName] = this.form[systemName].map(
              (filterValue) => {
                return this.aggs[systemName].filter(v => v.key === filterValue.key)[0]
              }
            )
          }
          continue
        }
      }
      this.disableFormElements = false
    },
    multiselectClose (systemName) {
      this.multiselectState[systemName] = 'closed'
      this.searchQueryChanged()
    },
    multiselectInput (systemName) {
      if (this.multiselectState[systemName] !== 'open') {
        this.searchQueryChanged()
      }
    },
    multiselectOpen (systemName) {
      this.multiselectState[systemName] = 'open'
    },
    nameOrNA (itemName) {
      if (itemName == null) {
        return 'N/A'
      }
      if (itemName === '') {
        return 'N/A'
      }
      return itemName
    },
    pageChanged (page) {
      if (page == null && this.body.from === 0) {
        return
      }
      if (page === Math.floor(this.body.from / this.body.size) + 1) {
        return
      }
      this.$router.push({ query: this.constructRouterQuery({ page }) })
    },
    async reload () {
      await this.$fetch()
      await this.fetchAggregations()
    },
    searchQueryChanged () {
      if (JSON.stringify(this.form) !== JSON.stringify(this.oldForm)) {
        this.$router.push({ query: this.constructRouterQuery({}) })
      }
    },
    sortingChanged ({ sortBy, sortDesc }) {
      // For edtf:
      // * sort on lower value when sorting ascending
      // * sort on upper value when sorting descending
      if (this.fields.filter(f => f.key === sortBy)[0].type === 'edtf') {
        sortBy = `${sortBy}.${sortDesc ? 'upper' : 'lower'}`
      }
      this.$router.push({ query: this.constructRouterQuery({ sortBy, sortOrder: sortDesc ? 'desc' : 'asc' }) })
    },
    sortItem (item) {
      const result = {}
      for (const field of item) {
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
