<template>
  <b-row>
    <b-col
      v-for="(entityTypeConfig, entityTypeName) in entityTypesConfig"
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
          <h2 class="mb-4">
            Re-index {{ entityTypeConfig.display_name }}
          </h2>
        </b-button>
      </b-overlay>
    </b-col>
  </b-row>
</template>
<script>
import { hasProjectPermission } from '@/assets/js/auth'

// TODO: check for es_index jobs with status 'started'
export default {
  async fetch () {
    // TODO https://github.com/superwf/vuex-cache -> how to reset cache (subscriptions?)?

    await this.$store.dispatch('config/load_entity_types', this.projectName)
  },
  data () {
    return {
      busy: false
    }
  },
  validate ({ $auth, $config, error, params }) {
    // TODO: validate project_name based on cached config
    if (!hasProjectPermission($auth.user, $config.projectName ?? params.project_name, 'es_index')) {
      return error({ statusCode: 403, message: 'Unauthorized.' })
    }
    return true
  },
  computed: {
    entityTypesConfig () {
      // TODO: filter on hasEntityPermission
      return this.$store.state.config.entity_types
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
