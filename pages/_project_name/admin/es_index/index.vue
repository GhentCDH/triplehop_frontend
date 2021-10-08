<template>
  <div v-frag>
    <b-breadcrumb
      class="bg-light"
      :items="breadcrumbs"
    />
    <b-row>
      <b-col
        v-for="entityTypeName in sortedEntityTypeNames"
        :key="entityTypeName"
        sm="6"
        md="4"
      >
        <b-overlay :show="busy">
          <b-button
            block
            variant="secondary"
            class="text-center"
            @click="reindex(entityTypeName)"
          >
            <b-icon
              icon="search"
              font-scale="4"
              class="mb-4 mt-4"
            />
            <b-icon
              icon="arrow-clockwise"
              font-scale="4"
              class="mb-4 mt-4"
            />
            <h2 class="mb-4">
              {{ entityTypesConfig[entityTypeName].display_name }}
            </h2>
          </b-button>
        </b-overlay>
      </b-col>
    </b-row>
  </div>
</template>
<script>
import frag from 'vue-frag'
import { hasEntityPermission, hasProjectPermission } from '@/assets/js/auth'

// TODO: check for es_index jobs with status 'started'
export default {
  directives: {
    frag
  },
  validate ({ $auth, $config, error, params }) {
    // TODO: validate project_name based on cached config
    if (!hasProjectPermission($auth.user, $config.projectName ?? params.project_name, 'es_index')) {
      return error({ statusCode: 403, message: 'Unauthorized.' })
    }
    return true
  },
  data () {
    return {
      busy: false
    }
  },
  async fetch () {
    // TODO https://github.com/superwf/vuex-cache -> how to reset cache (subscriptions?)?

    await this.$store.dispatch('config/load_entity_types', this.projectName)
  },
  computed: {
    breadcrumbs () {
      return [
        {
          text: 'Admin',
          to: `${this.projectPrefix}admin`
        },
        {
          text: 'Elasticsearch',
          active: true
        }
      ]
    },
    entityTypesConfig () {
      const entityTypesConfig = JSON.parse(JSON.stringify(this.$store.state.config.entity_types))
      // Filter out entity types without elasticsearch config
      for (const entityTypeName of Object.keys(entityTypesConfig)) {
        if (!('elasticsearch' in entityTypesConfig[entityTypeName])) {
          delete entityTypesConfig[entityTypeName]
        }
      }
      // Filter out entity types for wich the user has no es_index permission
      for (const entityTypeName of Object.keys(entityTypesConfig)) {
        if (!hasEntityPermission(this.$auth.user, this.projectName, entityTypeName, 'es_index')) {
          delete entityTypesConfig[entityTypeName]
        }
      }
      return entityTypesConfig
    },
    sortedEntityTypeNames () {
      const sortedEntityTypeNames = Object.keys(this.entityTypesConfig)
      sortedEntityTypeNames.sort()
      return sortedEntityTypeNames
    },
    projectName () {
      return this.$config.projectName ?? this.$route.params.project_name
    },
    projectPrefix () {
      return this.$config.projectName == null ? `/${this.projectName}/` : '/'
    }
  },
  methods: {
    async reindex (entityTypeName) {
      this.busy = true

      try {
        const response = await this.$axios.get(
          `/es/${this.projectName}/${entityTypeName}/reindex`
        )
        this.$router.push(`${this.projectPrefix}admin/job/${response.data.id}`)
      } catch (error) {
        this.$store.dispatch(
          'notifications/create',
          {
            message: 'There was an issue creating the re-index job.  Please try again.',
            title: 'Re-index unsuccessfull',
            variant: 'danger'
          }
        )
        this.busy = false
      }
    }
  }
}
</script>
