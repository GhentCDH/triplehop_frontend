<template>
  <b-row>
    <b-col
      v-for="(entityTypeConfig, entityTypeName) in entityTypesConfig"
      :key="entityTypeName"
      sm="6"
      md="4"
    >
      <b-button
        block
        variant="secondary"
        class="text-center"
        :to="`/${projectName}/admin/es_index`"
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
    </b-col>
  </b-row>
</template>
<script>
import { hasProjectPermission } from '@/assets/js/auth'

// TODO: check for es_index jobs with status 'started'
export default {
  validate ({ $auth, params, error }) {
    // TODO: validate project_name based on cached config
    if (!hasProjectPermission($auth.user, params.project_name, 'es_index')) {
      return error({ statusCode: 403, message: 'Unauthorized.' })
    }
    return true
  },
  async fetch ({ params, store }) {
    // TODO https://github.com/superwf/vuex-cache -> how to reset cache (subscriptions?)?

    await store.dispatch('config/load_entity_types', params.project_name)
  },
  computed: {
    entityTypesConfig () {
      // TODO: filter on hasEntityPermission
      return this.$store.state.config.entity_types
    },
    projectName () {
      return this.$route.params.project_name
    }
  }
}
</script>
