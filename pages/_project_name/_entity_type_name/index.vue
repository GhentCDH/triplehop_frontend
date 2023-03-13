<template>
  <div :class="`${projectName}__${entityTypeName}__search page-search`">
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
            size="sm"
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
            class="filters scrollable"
            :class="displayFiltersInitialized ? '' : 'd-none d-md-block'"
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
                  <component
                    :is="filter.type"
                    v-model="form[filter.systemName]"
                    :disabled="$fetchState.pending"
                    :system-name="filter.systemName"
                    v-bind="filterProperties[filter.systemName]"
                    @changed="searchQueryChanged"
                  />
                </b-form-group>
              </div>
            </b-form>
          </b-collapse>
        </b-col>
        <b-col
          v-if="total > 0"
          md="9"
        >
          <div>
            <h1>
              {{ entityTypeConfig.elasticsearch.title }}
            </h1>
            <div class="float-right text-center">
              Displaying {{ showingStart }} to {{ showingEnd }} of {{ total }} results.
              <b-pagination
                :value="currentPage"
                :total-rows="totalPagination"
                :per-page="body.size"
                @input="pageChanged"
              />
            </div>
          </div>
          <div class="results-table scrollable">
            <b-table
              striped
              hover
              :items="items"
              :fields="columns"
              :sort-by="sortBy"
              :sort-desc="sortOrder === 'desc'"
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
          </div>
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
import rfdc from 'rfdc'
import { ExpiredAuthSessionError } from '~auth/runtime'
import { hasEntityTypePermission } from '~/assets/js/auth'
import TableCellContent from '~/components/Search/TableCellContent'
import Autocomplete from '~/components/Search/Filters/Autocomplete'
import Dropdown from '~/components/Search/Filters/Dropdown'
import HistogramSlider from '~/components/Search/Filters/HistogramSlider'
import Nested from '~/components/Search/Filters/Nested'
import NestedPresent from '~/components/Search/Filters/NestedPresent'

import { MAX_INT, getFields, getFilterDefs, getColumnKeys } from '~/assets/js/es'
import { isArray, isNumber, isObject } from '~/assets/js/utils'

export default {
  auth: false,
  components: {
    Autocomplete,
    Dropdown,
    histogram_slider: HistogramSlider,
    Nested,
    nested_present: NestedPresent,
    nested_multi_type: Nested,
    nested_flatten: Nested,
    TableCellContent,
    uncertain_centuries: Dropdown
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
      body: {},
      displayFilters: true,
      displayFiltersInitialized: false,
      form: {},
      multiselectState: {},
      oldForm: {}
    }
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

    this.fillFormFromQuery()

    // Get data including limited aggregations (including all aggregation can be too slow)
    // TODO: make size configurable
    this.body = {
      filters: this.simpleForm,
      page: this.$route.query.page,
      size: 25,
      sortBy: this.$route.query.sortBy,
      sortOrder: this.$route.query.sortOrder
    }

    let authSessionTries = 2
    while (authSessionTries--) {
      try {
        await this.$store.dispatch(
          'es/search',
          {
            body: this.body,
            entityTypeName: this.entityTypeName,
            projectName: this.projectName
          }
        )
      } catch (e) {
        // Try fetching the data one more time if the auth session has expired
        if (e instanceof ExpiredAuthSessionError) {
          continue
        }
        throw new Error('Error while fetching data.')
      }
      // Everything worked fine, exit loop
      break
    }
    this.completeFormFromData()
    this.oldForm = JSON.parse(JSON.stringify(this.form))
  },
  head () {
    if (this.entityTypeConfig.style?.search == null) {
      return {}
    }
    return {
      style: [
        {
          cssText: this.entityTypeConfig.style?.search.map(rule => `.novel_echoes__text__search ${rule}`).join('\n'),
          type: 'text/css'
        }
      ]
    }
  },
  computed: {
    aggs () {
      return this.$store.state.es.aggs
    },
    columns () {
      const fields = JSON.parse(JSON.stringify(this.fields))
      let mainLinkPresent = false
      for (const field of fields) {
        if (field.mainLink) {
          // Mainlink present, return fields
          mainLinkPresent = true
        }
      }
      if (!mainLinkPresent) {
        // No mainLink field present, add detail column with mainLink
        fields.unshift({
          key: '__link__',
          label: 'Details',
          type: 'main_link',
          mainLink: true
        })
      }
      if (hasEntityTypePermission(this.$auth.user, this.projectName, this.entityTypeName, 'data', 'put')) {
        const actionField = {
          key: '__actions__',
          label: 'Actions',
          type: 'actions',
          actions: []
        }
        if (hasEntityTypePermission(this.$auth.user, this.projectName, this.entityTypeName, 'data', 'put')) {
          actionField.actions.push('edit')
        }
        if (hasEntityTypePermission(this.$auth.user, this.projectName, this.entityTypeName, 'data', 'delete')) {
          actionField.actions.push('delete')
        }
        fields.push(actionField)
        fields.push({
          key: '__id__',
          label: 'Id',
          type: 'id'
        })
      }
      return fields
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
        switch (filter.type) {
          case 'nested':
          case 'nested_multi_type':
          case 'nested_flatten':
          case 'uncertain_centuries':
          case 'nested_present':
          case 'dropdown':
            properties[systemName].aggregationData = this.aggs[systemName]
            properties[systemName].filters = this.simpleForm
            properties[systemName].searchUrl = `/es/${this.projectName}/${this.entityTypeName}/aggregation_suggest`
            break
          case 'autocomplete':
            properties[systemName].searchUrl = `/es/${this.projectName}/${this.entityTypeName}/suggest`
            break
          case 'histogram_slider':
            properties[systemName].histogramData = this.aggs[`${systemName}_hist`]
            properties[systemName].range = {
              min: this.aggs[`${systemName}_min`],
              max: this.aggs[`${systemName}_max`]
            }
            break
        }
      }
      return properties
    },
    simpleForm () {
      const simpleForm = {}
      for (const [key, values] of Object.entries(this.form)) {
        switch (this.esFiltersDefs[key].type) {
          case 'nested':
          case 'nested_multi_type':
          case 'nested_flatten':
          case 'uncertain_centuries':
          case 'dropdown':
            simpleForm[key] = []
            for (const value of values) {
              simpleForm[key].push(value.key)
            }
            break
          default:
            simpleForm[key] = values
        }
      }
      return simpleForm
    },
    showingStart () {
      return this.$store.state.es.from
    },
    showingEnd () {
      return this.$store.state.es.to
    },
    sortDesc () {
      return this.sortOrder === 'desc'
    },
    sortBy () {
      return this.$store.state.es.sortBy
    },
    sortOrder () {
      return this.$store.state.es.sortOrder
    },
    total () {
      return this.$store.state.es.total
    },
    totalPagination () {
      return Math.min(this.$store.state.es.total, 10000)
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
  },
  methods: {
    isArray,
    isObject,
    constructRouterQuery (queryPart) {
      const query = {}

      for (const [systemName, filterValues] of Object.entries(this.form)) {
        if (this.esFiltersDefs[systemName].type === 'histogram_slider') {
          if (filterValues == null) {
            continue
          }
          if (
            filterValues[0] != null &&
            filterValues[0] !== this.aggs[`${systemName}_min`]
          ) {
            query[`filter[${systemName}]_min`] = filterValues[0]
          }
          if (
            filterValues[1] != null &&
            filterValues[1] !== this.aggs[`${systemName}_max`]
          ) {
            query[`filter[${systemName}]_max`] = filterValues[1]
          }
          continue
        }
        if (
          this.esFiltersDefs[systemName].type === 'nested' ||
          this.esFiltersDefs[systemName].type === 'nested_multi_type' ||
          this.esFiltersDefs[systemName].type === 'nested_flatten'
        ) {
          if (filterValues != null && filterValues.length > 0) {
            for (const [i, filterValue] of filterValues.entries()) {
              query[`filter[${systemName}][${i}]`] = filterValue.key
            }
          }
          continue
        }
        if (this.esFiltersDefs[systemName].type === 'nested_present') {
          if (filterValues != null) {
            query[`filter[${systemName}]`] = filterValues.key
          }
          continue
        }
        if (['dropdown', 'uncertain_centuries'].includes(this.esFiltersDefs[systemName].type)) {
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
        query.page = this.body.page
      }

      if (query.page === 1) {
        delete query.page
      }

      if ('sortBy' in queryPart) {
        if (queryPart.sortBy != null) {
          query.sortBy = queryPart.sortBy
        }
      } else if (this.$route.query.sortBy != null) {
        query.sortBy = this.$route.query.sortBy
      }

      if ('sortOrder' in queryPart) {
        if (queryPart.sortOrder != null) {
          query.sortOrder = queryPart.sortOrder
        }
      } else if (this.$route.query.sortOrder != null) {
        query.sortOrder = this.$route.query.sortOrder
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
    fillFormFromQuery () {
      const newForm = {}
      for (const [systemName, filter] of Object.entries(this.esFiltersDefs)) {
        if (filter.type === 'histogram_slider') {
          if (this.$route.query[`filter[${systemName}]_min`] == null && this.$route.query[`filter[${systemName}]_max`] == null) {
            continue
          }
          newForm[systemName] = [
            this.$route.query[`filter[${systemName}]_min`] ?? null,
            this.$route.query[`filter[${systemName}]_max`] ?? null
          ]
          continue
        }
        if (filter.type === 'nested' || filter.type === 'nested_flatten') {
          if (this.$route.query[`filter[${systemName}][0]`] == null) {
            continue
          }
          newForm[systemName] = []
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
            newForm[systemName].push(
              {
                key: value
              }
            )
            counter++
          }
          continue
        }
        if (filter.type === 'nested_multi_type') {
          if (this.$route.query[`filter[${systemName}][0]`] == null) {
            continue
          }
          newForm[systemName] = []
          let counter = 0
          while (this.$route.query[`filter[${systemName}][${counter}]`] != null) {
            const value = this.$route.query[`filter[${systemName}][${counter}]`]
            if (!value.includes('|')) {
              return this.$nuxt.error({
                statusCode: 400,
                message: `Invalid value "${value}" for filter "${systemName}".`
              })
            }
            const intValue = parseInt(value.split('|')[1])
            if (Number.isNaN(intValue) || intValue > MAX_INT) {
              return this.$nuxt.error({
                statusCode: 400,
                message: `Invalid value "${value}" for filter "${systemName}".`
              })
            }
            newForm[systemName].push(
              {
                key: value
              }
            )
            counter++
          }
          continue
        }
        if (filter.type === 'nested_present') {
          if (this.$route.query[`filter[${systemName}]`] == null) {
            continue
          }
          const value = this.$route.query[`filter[${systemName}]`]
          const intValue = parseInt(value)
          if (Number.isNaN(intValue) || intValue > MAX_INT) {
            return this.$nuxt.error({
              statusCode: 400,
              message: `Invalid value "${value}" for filter "${systemName}".`
            })
          }
          newForm[systemName] = {
            key: intValue
          }
          continue
        }
        if (['dropdown', 'uncertain_centuries'].includes(filter.type)) {
          if (this.$route.query[`filter[${systemName}][0]`] == null) {
            continue
          }
          newForm[systemName] = []
          let counter = 0
          while (this.$route.query[`filter[${systemName}][${counter}]`] != null) {
            newForm[systemName].push(
              {
                key: this.$route.query[`filter[${systemName}][${counter}]`]
              }
            )
            counter++
          }
          continue
        }
        if (filter.type === 'autocomplete') {
          if (this.$route.query[`filter[${systemName}]`] == null) {
            continue
          }
          newForm[systemName] = this.$route.query[`filter[${systemName}]`]
        }
      }
      this.form = rfdc()(newForm)
    },
    completeFormFromData () {
      const newForm = {}
      for (const [systemName, filter] of Object.entries(this.esFiltersDefs)) {
        switch (filter.type) {
          case 'nested':
          case 'nested_multi_type':
          case 'nested_flatten':
          case 'uncertain_centuries':
          case 'dropdown':
            if (this.form[systemName] != null) {
              newForm[systemName] = this.form[systemName].map(
                (filterValue) => {
                  return this.aggs[systemName].filter(v => v.key === filterValue.key)[0]
                }
              )
            }
            break
          case 'nested_present':
            if (this.form[systemName] != null) {
              newForm[systemName] = this.aggs[systemName].filter(v => v.key === this.form[systemName].key)[0]
            }
            break
          default:
            if (this.form[systemName] != null) {
              newForm[systemName] = this.form[systemName]
            }
        }
      }
      this.form = rfdc()(newForm)
    },
    pageChanged (page) {
      if (page === this.body.page) {
        return
      }
      this.$router.push({ query: this.constructRouterQuery({ page }) })
    },
    async reload () {
      await this.$fetch()
    },
    searchQueryChanged () {
      if (JSON.stringify(this.form) !== JSON.stringify(this.oldForm)) {
        this.$router.push({ query: this.constructRouterQuery({}) })
      }
    },
    sortingChanged ({ sortBy, sortDesc }) {
      this.$router.push({
        query: this.constructRouterQuery({
          sortBy: sortBy === '' ? null : sortBy,
          sortOrder: sortDesc ? 'desc' : null
        })
      })
    }
  }
}
</script>
