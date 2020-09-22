<template>
  <b-row>
    <b-col
      v-if="hasProjectPermission('es_index')"
      sm="6"
      md="4"
    >
      <b-button
        block
        variant="secondary"
        class="text-center"
        :to="`${projectPrefix}admin/es_index`"
      >
        <b-icon
          icon="search"
          font-scale="4"
          class="mb-4 mt-4"
        />
        <h2 class="mb-4">
          Elasticsearch
        </h2>
      </b-button>
    </b-col>
  </b-row>
</template>
<script>
import { hasProjectAdminAccess, hasProjectPermission } from '@/assets/js/auth'

export default {
  validate ({ $auth, $config, error, params }) {
    // TODO: validate project_name based on cached config
    if (!hasProjectAdminAccess($auth.user, $config.projectName ?? params.project_name)) {
      return error({ statusCode: 403, message: 'Unauthorized.' })
    }
    return true
  },
  computed: {
    projectName () {
      return this.$config.projectName ?? this.$route.params.project_name
    },
    projectPrefix () {
      return this.$config.projectName == null ? `/${this.projectName}/` : '/'
    }
  },
  methods: {
    hasProjectPermission (permission) {
      return hasProjectPermission(this.$auth.user, this.projectName, permission)
    }
  }
}
</script>
