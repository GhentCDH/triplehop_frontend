<template>
  <div v-frag>
    <b-table striped :items="items" />
    <sources :sources="valueAndSources.sources" />
  </div>
</template>

<script>
import frag from 'vue-frag'
import Sources from '~/components/Detail/Sources.vue'

export default {
  directives: {
    frag
  },
  components: {
    Sources
  },
  props: {
    valueAndSources: {
      type: Object,
      required: true
    }
  },
  computed: {
    items () {
      const items = []
      const keys = []
      for (const row of this.valueAndSources.value) {
        // First row contains the keys
        if (keys.length === 0) {
          for (const col of row) {
            keys.push(col)
          }
        } else {
          const item = {}
          for (const [i, key] of keys.entries()) {
            item[key] = row[i]
          }
          items.push(item)
        }
      }
      return items
    }
  }
}
</script>
