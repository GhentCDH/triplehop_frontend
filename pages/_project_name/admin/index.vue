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
        :to="`/${$route.params.project_name}/admin/es_index`"
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
import { hasProjectPermission } from '@/assets/js/auth'

export default {
  methods: {
    hasProjectPermission (permission) {
      return hasProjectPermission(this.$auth.user, this.$route.params.project_name, permission)
    }
  }
}
</script>
