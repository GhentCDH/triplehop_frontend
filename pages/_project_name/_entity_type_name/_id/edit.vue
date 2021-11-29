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
        {{ titleValue }}
      </h1>
    </template>
  </div>
</template>

<script>
import { constructFieldFromData, isNumber } from '~/assets/js/utils'

export default {
  validate ({ params }) {
    // Make sure id is a number
    if (!isNumber(params.id)) {
      return false
    }
    return true
  },
  async fetch () {
    // TODO store state invalidation (websockets / subscriptions?)
    // after login, nuxtServerInit is not called
    if (!this.$store.state.initialized) {
      await this.$store.dispatch('nuxtServerInit', this.$nuxt.context)
    }

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
        text: this.titleValue,
        active: true
      })
      return breadcrumbs
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
    relationTypesConfig () {
      return this.$store.state.config.relation_types
    },
    sourceTitlesConfig () {
      const sourceTitlesConfig = {}
      for (const [entityTypeName, entityTypeConfig] of Object.entries(this.entityTypesConfig)) {
        if ('source' in entityTypeConfig && entityTypeConfig.source) {
          sourceTitlesConfig[entityTypeName] = entityTypeConfig.display.title
        }
      }
      return sourceTitlesConfig
    },
    title () {
      return this.constructFieldFromData(
        this.entityTypeConfig.display.title,
        this.entityData,
        this.sourceTitlesConfig,
        {},
        true
      )
    },
    titleValue () {
      return this.title.map(title => title.value).join(', ')
    }
  },
  methods: {
    constructFieldFromData
  }
}
</script>
