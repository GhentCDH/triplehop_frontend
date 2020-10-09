<template>
  <b-card
    v-if="relationData.length && relationTitle !== ''"
    :title="relationTitle"
    class="border-0 bg-light mb-3"
  >
    <b-card
      v-for="relation in relations"
      :key="relation.id"
      class="border-0 bg-white mb-1"
    >
      <b-link
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
      </b-link>
    </b-card>
    <b-button
      v-if="relationData.length > 5"
      class="mt-3"
      variant="primary"
      @click="collapsed = !collapsed"
    >
      {{ buttonText }}
    </b-button>
  </b-card>
</template>
<script>
import { constructTitle } from '~/assets/js/utils'

export default {
  props: {
    collapsed: {
      type: Boolean,
      default: true
    },
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
  computed: {
    buttonText () {
      if (this.collapsed) {
        return `Show ${this.relationData.length - 3} more results (${this.relationData.length} in total)`
      }
      return `Hide ${this.relationData.length - 3} results (${this.relationData.length} in total)`
    },
    firstThree () {
      return this.relationData.slice(0, 3)
    },
    relations () {
      if (this.relationData.length > 5 && this.collapsed) {
        return this.firstThree
      }
      return this.relationData
    }
  },
  methods: {
    constructTitle
  }
}
</script>
