<template>
  <div v-frag>
    <b-breadcrumb
      class="bg-light"
      :items="breadcrumbs"
    />
    <b-row>
      <b-col
        v-if="hasAtLeastOneEntityTypeWithPermission('es_data', 'index')"
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
  </div>
</template>
<script>
import frag from 'vue-frag'
import { hasProjectAdminAccess, hasAtLeastOneEntityTypeWithPermission } from '@/assets/js/auth'

export default {
  directives: {
    frag
  },
  validate ({ $auth, $config, error, params }) {
    // TODO: validate project_name based on cached config
    if (!hasProjectAdminAccess($auth.user, $config.projectName ?? params.project_name)) {
      return error({ statusCode: 403, message: 'Forbidden.' })
    }
    return true
  },
  data () {
    return {
      breadcrumbs: [
        {
          text: 'Admin',
          href: this.$config.homepage
        }
      ]
    }
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
    hasAtLeastOneEntityTypeWithPermission (scope, permission) {
      return hasAtLeastOneEntityTypeWithPermission(this.$auth.user, this.projectName, scope, permission)
    }
  }
}
</script>
