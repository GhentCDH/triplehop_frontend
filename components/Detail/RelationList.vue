<template>
  <b-card
    v-if="data && data.length && relationTitle !== ''"
    :title="relationTitle"
    class="border-0 bg-light mb-3"
  >
    <relation
      v-for="relation in relations"
      :key="relation.id"
      :relation="relation"
      :relation-type-name="relationTypeName"
      :source-titles-config="sourceTitlesConfig"
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
import Relation from '~/components/Detail/Relation.vue'

export default {
  components: {
    Relation
  },
  props: {
    data: {
      type: null,
      required: true
    },
    relationTitle: {
      type: String,
      required: true
    },
    relationTypeName: {
      type: String,
      required: true
    },
    sourceTitlesConfig: {
      type: Object,
      default: () => {
        return null
      }
    }
  },
  data () {
    return {
      collapsed: true
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
  }
}
</script>
