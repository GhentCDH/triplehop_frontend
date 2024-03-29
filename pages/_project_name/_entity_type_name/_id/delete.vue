<template>
  <div :class="`${projectName}__${entityTypeName}__${id}__delete page-delete`">
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
      <b-alert show variant="danger">
        Are you sure you want to delete this entity?<br>
        All incoming and outgoing relations will be deleted as well.
        <b-button
          variant="danger"
          size="sm"
          class="float-right"
          title="Delete entity"
          @click="onDelete"
        >
          Delete <b-icon icon="trash" />
        </b-button>
        <b-button
          size="sm"
          class="float-right mr-1"
          title="Delete entity"
          @click="$router.go(-1)"
        >
          Cancel <b-icon icon="x" />
        </b-button>
      </b-alert>
      <b-breadcrumb
        class="bg-light"
        :items="breadcrumbs"
      />
      <div
        class="title-wrapper"
      >
        <h1>
          {{ titleValue }}
        </h1>
      </div>

      <div class="content scrollable">
        <layout-panel
          v-for="(panel, panelIndex) in entityTypeConfig.display.layout"
          :key="`panel-${panelIndex}`"
          :panel="panel"
          :config="entityTypeConfig"
          :data="entityData"
          :source-titles-config="sourceTitlesConfig"
        />

        <relation-list
          v-for="relationTypeName of domainRelationTypeNames"
          :key="`${relationTypeName}-domain`"
          :data="entityData[`r_${relationTypeName}_s`]"
          :relation-title="relationTypesConfig[relationTypeName].display.domain_title"
          :relation-type-name="relationTypeName"
          :source-titles-config="sourceTitlesConfig"
        />
        <relation-list
          v-for="relationTypeName of rangeRelationTypeNames"
          :key="`${relationTypeName}-range`"
          :data="entityData[`ri_${relationTypeName}_s`]"
          :relation-title="relationTypesConfig[relationTypeName].display.range_title"
          :relation-type-name="relationTypeName"
          :source-titles-config="sourceTitlesConfig"
        />
      </div>
    </template>
  </div>
</template>

<script>
import { ExpiredAuthSessionError } from '~auth/runtime'
import { hasEntityTypePermission } from '~/assets/js/auth'
import { constructFieldFromData, isNumber } from '~/assets/js/utils'
import LayoutPanel from '~/components/Detail/LayoutPanel.vue'
import RelationList from '~/components/Detail/RelationList.vue'

export default {
  auth: false,
  components: {
    LayoutPanel,
    RelationList
  },
  validate ({ params, $auth }) {
    // Make sure id is a number
    if (!isNumber(params.id)) {
      return false
    }
    if (!(hasEntityTypePermission($auth.user, params.project_name, params.entity_type_name, 'data', 'post'))) {
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
    let authSessionTries = 2
    while (authSessionTries--) {
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
        // Try fetching the data one more time if the auth session has expired
        if (e instanceof ExpiredAuthSessionError) {
          continue
        }
        throw new Error('Error while fetching data.')
      }
      // Everything worked fine, exit loop
      break
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
    domainRelationTypeNames () {
      return Object.keys(this.relationTypesConfig)
        .filter(
          (relationTypeName) => {
            const relationConfig = this.relationTypesConfig[relationTypeName]
            return (
              relationConfig.domain_names.includes(this.entityTypeName) &&
              relationConfig.display != null
            )
          }
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
    id () {
      return this.$route.params.id
    },
    projectName () {
      return this.$config.projectName ?? this.$route.params.project_name
    },
    projectPrefix () {
      return this.$config.projectName == null ? `/${this.projectName}/` : '/'
    },
    rangeRelationTypeNames () {
      return Object.keys(this.relationTypesConfig)
        .filter(
          (relationTypeName) => {
            const relationConfig = this.relationTypesConfig[relationTypeName]
            return (
              relationConfig.range_names.includes(this.entityTypeName) &&
              relationConfig.display != null
            )
          }
        )
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
    constructFieldFromData,
    hasEntityTypePermission,
    async onDelete () {
      try {
        await this.$store.dispatch(
          'data/delete',
          {
            projectName: this.projectName,
            entityTypeName: this.entityTypeName,
            id: this.$route.params.id
          }
        )
        this.$store.dispatch(
          'notifications/create',
          {
            message: 'Entity successfully deleted.',
            variant: 'success'
          }
        )
        setTimeout(this.redirect, 50)
      } catch (error) {
        console.error(error)
        this.$store.dispatch(
          'notifications/create',
          {
            message: 'There was an issue deleting the entity.',
            title: 'Deletion unsuccessfull',
            variant: 'danger'
          }
        )
      }
    },
    redirect () {
      if (window?.history?.length > 1) {
        this.$router.go(-1)
      } else {
        this.$router.push({
          name: 'project_name-entity_type_name',
          params: {
            project_name: this.projectName,
            entity_type_name: this.entityTypeName
          }
        })
      }
    }
  }
}
</script>
