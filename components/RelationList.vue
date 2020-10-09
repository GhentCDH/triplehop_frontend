<template>
  <b-card
    v-if="relationData && relationData.length && relationTitle !== ''"
    :title="relationTitle"
    class="border-0 bg-light mb-3"
  >
    <relation
      v-for="relation in relations"
      :key="relation.id"
      :project-name="projectName"
      :entity-types-config="entityTypesConfig"
      :relation="relation"
      :relation-type-config="relationTypeConfig"
    />
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
import Relation from '~/components/Relation.vue'

export default {
  components: {
    Relation
  },
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
    relationTypeConfig: {
      type: Object,
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
    },
    relationTitle () {
      return this.relationTypeConfig.display.title
    }
  },
  methods: {
    constructTitle
  }
}
</script>
