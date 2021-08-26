<template>
  <div>
    <b-breadcrumb
      class="bg-light"
      :items="breadcrumbs"
    />

    <h1>{{ entityTypeConfig.elasticsearch.title }}</h1>

    <p v-if="$fetchState.error">
      Error while fetching data...
    </p>
    <b-row v-else>
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
          <b-form @submit.prevent="searchQueryChanged">
            <div
              v-for="(group, index) in filterGroups"
              :key="index"
              class="bg-light p-3"
            >
              <b-overlay
                :show="disableFormElements"
                spinner-variant="primary"
              >
                <b-form-group
                  v-for="filter in group.filters"
                  :id="`ig_${filter.systemName}`"
                  :key="filter.systemName"
                  :label="filter.displayName"
                  :label-for="`i_${filter.systemName}`"
                >
                  <component
                    :is="filter.type"
                    v-model="form[filter.systemName]"
                    :disabled="disableFormElements"
                    :system-name="filter.systemName"
                    v-bind="filterProperties[filter.systemName]"
                    @changed="searchQueryChanged"
                  />
                </b-form-group>
              </b-overlay>
            </div>
          </b-form>
        </b-collapse>
      </b-col>
      <b-col
        v-if="total.value > 0"
        md="9"
      >
        <b-overlay
          :show="$fetchState.pending"
          spinner-variant="primary"
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
            <template #cell()="data">
              <template v-if="isArray(data.value)">
                <ul
                  v-if="data.value.length > 1"
                  class="list-line"
                >
                  <li
                    v-for="(item, index) in data.value"
                    :key="index"
                  >
                    <table-cell-content
                      :entity-id="data.item._id"
                      :entity-type-name="entityTypeName"
                      :field="data.field"
                      :project-prefix="projectPrefix"
                      :value="item"
                    />
                  </li>
                </ul>
                <template v-else-if="data.value.length == 1">
                  <table-cell-content
                    :entity-id="data.item._id"
                    :entity-type-name="entityTypeName"
                    :field="data.field"
                    :project-prefix="projectPrefix"
                    :value="data.value[0]"
                  />
                </template>
              </template>
              <template v-else>
                <table-cell-content
                  :entity-id="data.item._id"
                  :entity-type-name="entityTypeName"
                  :field="data.field"
                  :project-prefix="projectPrefix"
                  :value="data.value"
                />
              </template>
            </template>
          </b-table>
          <b-pagination
            :value="currentPage"
            :total-rows="total.value"
            :per-page="body.size"
            @input="pageChanged"
          />
        </b-overlay>
      </b-col>
      <b-col
        v-else
        md="9"
      >
        <em>No results found.</em>
      </b-col>
    </b-row>
  </div>
</template>

<script>
import rfdc from 'rfdc'
import TableCellContent from '~/components/Search/TableCellContent'
import Autocomplete from '~/components/Search/Filters/Autocomplete'
import Dropdown from '~/components/Search/Filters/Dropdown'
import HistogramSlider from '~/components/Search/Filters/HistogramSlider'
import Nested from '~/components/Search/Filters/Nested'

import { MAX_INT, getFields, getFilterDefs, getColumnKeys } from '~/assets/js/es'
import { compareNameUnicode, isArray, isNumber, isObject } from '~/assets/js/utils'

export default {
  auth: false,
  components: {
    Autocomplete,
    Dropdown,
    histogram_slider: HistogramSlider,
    Nested,
    TableCellContent
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
  data () {
    return {
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
      sortBy: null,
      sortOrder: null
    }
  },
  async fetch () {
    this.disableFormElements = true
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

    this.fillFormFromQuery()

    // Request only the data on initial request, since aggregation can be relatively slow
    // TODO: make size configurable
    const size = 25
    // TODO: make default sorting configurable

    this.sortBy = this.$route.query.sortBy ?? this.calcSortBy(this.fields[0].key)
    this.sortOrder = this.$route.query.sortOrder == null ? 'asc' : this.$route.query.sortOrder

    this.body = {
      keys: this.esColumnsKeys,
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
    esColumnsKeys () {
      return getColumnKeys(this.entityTypeConfig)
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
    filterProperties () {
      const properties = {}
      for (const [systemName, filter] of Object.entries(this.esFiltersDefs)) {
        properties[systemName] = {}
        if (filter.type === 'histogram_slider') {
          properties[systemName].histogramData = this.aggs[`${systemName}_hist`]
          properties[systemName].range = {
            min: this.fullRangeData[`${systemName}_min`],
            max: this.fullRangeData[`${systemName}_max`]
          }
          continue
        }
        if (filter.type === 'autocomplete') {
          properties[systemName].searchUrl = `/es/${this.projectName}/${this.entityTypeName}/search`
          continue
        }
        if (filter.type === 'nested') {
          properties[systemName].aggregationData = this.aggs[systemName]
          continue
        }
        if (filter.type === 'dropdown') {
          properties[systemName].aggregationData = this.aggs[systemName]
          continue
        }
      }
      return properties
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
    calcSortBy (sortBy, sortDesc = false) {
      // For edtf:
      // * sort on lower value when sorting ascending
      // * sort on upper value when sorting descending
      if (this.fields.filter(f => f.key === sortBy)[0].type === 'edtf') {
        sortBy = `${sortBy}.${sortDesc ? 'upper' : 'lower'}`
      }
      return sortBy
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
    fillFormFromQuery () {
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
        if (filter.type === 'autocomplete') {
          this.form[systemName] = this.$route.query[`filter[${systemName}]`] ?? null
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
      this.$router.push({
        query: this.constructRouterQuery({
          sortBy: this.calcSortBy(sortBy, sortDesc),
          sortOrder: sortDesc ? 'desc' : 'asc'
        })
      })
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
