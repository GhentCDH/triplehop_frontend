<template>
  <b-card
    v-if="relationData.length && relationTitle !== ''"
    :title="relationTitle"
    class="border-0 bg-light mb-3"
  >
    <b-card
      v-for="relation in relationData"
      :key="relation.id"
      class="border-0 bg-white mb-1"
    >
      <nuxt-link
        :to="{
          name: 'project_name-entity_type_name-id',
          params: {
            project_name: projectName,
            entity_type_name: relation.entity.__typename.toLowerCase(),
            id: relation.entity.id
          }
        }"
      >
        {{ constructTitle(entityTypesConfig[relation.entity.__typename.toLowerCase()].display.title, relation.entity) }}
      </nuxt-link>
    </b-card>
  </b-card>
</template>
<script>
import { constructTitle } from '~/assets/js/utils'

export default {
  props: {
    entityTypesConfig: {
      type: Object,
      required: true
    },
    projectName: {
      type: String,
      required: true
    },
    relationData: {
      type: Array,
      required: true
    },
    relationTitle: {
      type: String,
      required: true
    }
  },
  methods: {
    constructTitle
  }
}
</script>
