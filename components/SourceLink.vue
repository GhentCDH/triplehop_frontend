<template>
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
</template>
<script>
export default {
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
