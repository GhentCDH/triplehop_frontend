<template>
  <div>
    <div
      v-if="$fetchState.pending"
      class="text-center"
    >
      <b-spinner variant="primary" />
    </div>
    <!-- TODO: style error -->
    <p v-else-if="$fetchState.error">
      {{ $fetchState.error.message }}
    </p>
    <template v-else>
      <b-breadcrumb
        class="bg-light"
        :items="breadcrumbs"
      />
      <h1>
        {{ title }}
      </h1>

      <layout-panel
        v-for="(panel, panelIndex) in entityTypeConfig.display.layout"
        :key="`panel-${panelIndex}`"
        :panel="panel"
        :panel-index="panelIndex"
        :config="entityTypeConfig"
        :data="entityData"
      />

      <relation-list
        v-for="(relationTypeConfig, relationTypeName) in domainRelationTypesConfig"
        :key="relationTypeName"
        :entity-types-config="entityTypesConfig"
        :project-name="projectName"
        :data="entityData[`r_${relationTypeName}_s`]"
        :relation-title="relationTypeConfig.display.domain_title"
        :relation-type-config="relationTypeConfig"
      />
      <relation-list
        v-for="(relationTypeConfig, relationTypeName) in rangeRelationTypesConfig"
        :key="relationTypeName"
        :project-name="projectName"
        :entity-types-config="entityTypesConfig"
        :data="entityData[`ri_${relationTypeName}_s`]"
        :relation-title="relationTypeConfig.display.range_title"
        :relation-type-config="relationTypeConfig"
      />
    </template>
  </div>
</template>

<script>
import { constructFieldFromData, filterObject, isNumber } from '~/assets/js/utils'
import LayoutPanel from '~/components/LayoutPanel.vue'
import RelationList from '~/components/RelationList.vue'

export default {
  auth: false,
  components: {
    LayoutPanel,
    RelationList
  },
  validate ({ params }) {
    // Make sure id is a number
    if (!isNumber(params.id)) {
      return false
    }
    return true
  },
  async fetch () {
    // TODO (backend): allow fields to be ordered
    // TODO (backend): allow display widget configuration
    // TODO https://github.com/superwf/vuex-cache -> how to reset cache (subscriptions?)?

    if (!(this.entityTypeName in this.entityTypesConfig)) {
      if (process.server) {
        this.$nuxt.context.res.statusCode = 404
      }
      throw new Error(`Entity type "${this.entityTypeName}" cannot be found.`)
    }
    try {
      await this.$store.dispatch('config/load_relation_types', this.projectName)

      await this.$store.dispatch(
        'data/load',
        {
          entityTypeName: this.entityTypeName,
          entityTypesConfig: this.entityTypesConfig,
          id: this.$route.params.id,
          projectName: this.projectName,
          relationTypesConfig: this.relationTypesConfig
        }
      )
    } catch (e) {
      throw new Error('Error while fetching data.')
    }
    if (this.$store.state.data.data == null) {
      if (process.server) {
        this.$nuxt.context.res.statusCode = 404
      }
      throw new Error(`Entity of type "${this.entityTypeName}" with id "${this.$route.params.id}" cannot be found.`)
    }
  },
  head () {
    // TODO: set Meta Tags for this Page
  },
  computed: {
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
      if ('elasticsearch' in this.entityTypeConfig) {
        breadcrumbs.push({
          text: this.entityTypeConfig.display_name,
          to: `${this.projectPrefix}${this.entityTypeName}`
        })
      } else {
        breadcrumbs.push({
          text: this.entityTypeConfig.display_name,
          active: true
        })
      }
      // current entity
      breadcrumbs.push({
        text: this.title,
        active: true
      })
      return breadcrumbs
    },
    domainRelationTypesConfig () {
      return filterObject(
        this.relationTypesConfig,
        relationConfig => (
          relationConfig.domain_names.includes(this.entityTypeName) &&
          relationConfig.display != null
        )
      )
    },
    entityData () {
      return this.$store.state.data.data
    },
    entityTypeConfig () {
      return this.$store.state.config.entity_types[this.entityTypeName]
    },
    entityTypesConfig () {
      return this.$store.state.config.entity_types
    },
    entityTypeName () {
      return this.$route.params.entity_type_name
    },
    projectName () {
      return this.$config.projectName ?? this.$route.params.project_name
    },
    projectPrefix () {
      return this.$config.projectName == null ? `/${this.projectName}/` : '/'
    },
    rangeRelationTypesConfig () {
      return filterObject(
        this.relationTypesConfig,
        relationConfig => (
          relationConfig.range_names.includes(this.entityTypeName) &&
          relationConfig.display != null
        )
      )
    },
    relationTypesConfig () {
      return this.$store.state.config.relation_types
    },
    title () {
      return this.constructFieldFromData(this.entityTypeConfig.display.title, this.entityData, true).join(', ')
    }
  },
  methods: {
    constructFieldFromData
  }
}
</script>
