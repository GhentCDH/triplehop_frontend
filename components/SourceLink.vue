<template>
  <div v-frag>
    <b-link
      class="text-white"
      :to="{
        name: 'project_name-entity_type_name-id',
        params: {
          project_name: projectName,
          entity_type_name: source.typeName,
          id: source.id,
        },
      }"
    >
      {{ source.title }}
    </b-link>
    <template v-if="source.page_number">
      <br />
      <em>
        Page number(s): {{ source.page_number.join(', ') }}
      </em>
    </template>
  </div>
</template>
<script>
import frag from 'vue-frag'

export default {
  directives: {
    frag
  },
  props: {
    source: {
      type: Object,
      required: true
    }
  },
  computed: {
    projectName () {
      return this.$config.projectName ?? this.$route.params.project_name
    }
  }
}
</script>
