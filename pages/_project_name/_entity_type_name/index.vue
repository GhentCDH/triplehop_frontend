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
          cols="3"
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
                      :to="`${projectPrefix}${item.entity_type_name}/${item.id}`"
                    >
                      {{ item.name }}
                    </nuxt-link>
                    <template v-else>
                      {{ item }}
                    </template>
                  </li>
                </ul>
                <template v-else-if="data.value.length == 1">
                  <nuxt-link
                    v-if="isObject(data.value[0]) && 'id' in data.value[0] && 'name' in data.value[0] && 'entity_type_name' in data.value[0]"
                    :to="`${projectPrefix}${data.value[0].entity_type_name}/${data.value[0].id}`"
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
                  :to="`${projectPrefix}${data.value.entity_type_name}/${data.value.id}`"
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

import { constructFullRangeAggQuery, getFields, getFilterDefs, getSystemNames } from '~/assets/js/es'
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
    for (const systemName in this.esFiltersDefs) {
      if (this.esFiltersDefs[systemName].type === 'histogram_slider') {
        this.form[systemName] = [
          this.$route.query[`filter[${systemName}]_min`] ?? null,
          this.$route.query[`filter[${systemName}]_max`] ?? null
        ]
        continue
      }
      if (this.esFiltersDefs[systemName].type === 'nested') {
        if (this.$route.query[`filter[${systemName}][0]`] == null) {
          this.form[systemName] = null
          continue
        }
        this.form[systemName] = []
        let counter = 0
        while (this.$route.query[`filter[${systemName}][${counter}]`] != null) {
          this.form[systemName].push(
            {
              id: parseInt(this.$route.query[`filter[${systemName}][${counter}]`])
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

    // Retrieve min and max of all ranges if not yet known
    for (const systemName in this.esFiltersDefs) {
      if (
        this.esFiltersDefs[systemName].type === 'histogram_slider' &&
        !(`${systemName}_min` in this.fullRangeData && `${systemName}_max` in this.fullRangeData)
      ) {
        const response = await this.$axios.post(
          `/es/${this.projectName}/${this.entityTypeName}/search`,
          constructFullRangeAggQuery(this.esFiltersDefs)
        )
        if (
          response.status === 200 &&
          'aggregations' in response.data
        ) {
          for (const aggName in response.data.aggregations) {
            if (!(aggName in this.fullRangeData)) {
              this.fullRangeData[aggName] = response.data.aggregations[aggName].value
            }
          }
        }
      }
    }

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
      fullRangeData: this.fullRangeData,
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
        entityTypeName: this.entityTypeName,
        projectName: this.projectName,
        entityTypeConfig: this.entityTypeConfig
      }
    )
    for (const systemName in this.esFiltersDefs) {
      if (this.esFiltersDefs[systemName].type === 'histogram_slider') {
        if (!(`${systemName}_min` in this.fullRangeData && `${systemName}_max` in this.fullRangeData)) {
          this.fullRangeData[`${systemName}_min`] = this.aggs[`${systemName}_min`]
          this.fullRangeData[`${systemName}_max`] = this.aggs[`${systemName}_max`]
        }
        this.form[systemName] = [
          this.form[systemName][0] ?? this.fullRangeData[`${systemName}_min`],
          this.form[systemName][1] ?? this.fullRangeData[`${systemName}_max`]
        ]
        continue
      }
      if (this.esFiltersDefs[systemName].type === 'nested') {
        if (this.form[systemName] != null) {
          this.form[systemName] = this.form[systemName].map(
            (filterValue) => {
              return this.aggs[systemName].filter(v => v.id === filterValue.id)[0]
            }
          )
        }
        continue
      }
    }
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
      form: {},
      fullRangeData: {},
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
      return rfdc()(this.$store.state.es.aggs)
    },
    breadcrumbs () {
      return [
        {
          text: 'Home',
          to: this.projectPrefix
        },
        {
          text: this.entityTypeConfig.display_name,
          active: true
        }
      ]
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
    '$route.query': '$fetch'
  },
  mounted () {
    this.disableFormElements = false
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

      for (const systemName in this.form) {
        if (this.esFiltersDefs[systemName].type === 'histogram_slider') {
          if (
            this.form[systemName][0] != null &&
            this.form[systemName][0] !== this.fullRangeData[`${systemName}_min`]
          ) {
            query[`filter[${systemName}]_min`] = this.form[systemName][0]
          }
          if (
            this.form[systemName][1] != null &&
            this.form[systemName][1] !== this.fullRangeData[`${systemName}_max`]
          ) {
            query[`filter[${systemName}]_max`] = this.form[systemName][1]
          }
          continue
        }
        if (this.esFiltersDefs[systemName].type === 'nested') {
          if (this.form[systemName] != null && this.form[systemName].length > 0) {
            for (const [i, filterValue] of this.form[systemName].entries()) {
              query[`filter[${systemName}][${i}]`] = filterValue.id
            }
          }
          continue
        }
        if (this.form[systemName] != null && this.form[systemName] !== '') {
          query[`filter[${systemName}]`] = this.form[systemName]
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
    formChanged () {
      const form = {}
      for (const field in this.form) {
        if (this.form[field] != null) {
          form[field] = this.form[field]
        }
      }
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
    pageChanged (page) {
      if (page == null && this.body.from === 0) {
        return
      }
      if (page === Math.floor(this.body.from / this.body.size) + 1) {
        return
      }
      this.$router.push({ query: this.constructRouterQuery({ page }) })
    },
    searchQueryChanged () {
      if (JSON.stringify(this.form) !== JSON.stringify(this.oldForm)) {
        this.$router.push({ query: this.constructRouterQuery({}) })
      }
    },
    sortingChanged ({ sortBy, sortDesc }) {
      this.$router.push({ query: this.constructRouterQuery({ sortBy, sortOrder: sortDesc ? 'desc' : 'asc' }) })
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
