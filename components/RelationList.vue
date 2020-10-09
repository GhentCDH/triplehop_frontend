<template>
  <b-card
    v-if="data && data.length && relationTitle !== ''"
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
      v-if="data.length > 5"
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
    data: {
      type: Array,
      required: true
    },
    entityTypesConfig: {
      type: Object,
      required: true
    },
    projectName: {
      type: String,
      required: true
    },
    relationTitle: {
      type: String,
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
        return `Show ${this.data.length - 3} more results (${this.data.length} in total)`
      }
      return `Hide ${this.data.length - 3} results (${this.data.length} in total)`
    },
    firstThree () {
      return this.data.slice(0, 3)
    },
    relations () {
      if (this.data.length > 5 && this.collapsed) {
        return this.firstThree
      }
      return this.data
    }
  },
  methods: {
    constructTitle
  }
}
</script>
