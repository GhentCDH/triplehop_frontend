<template>
  <b-card
    :title="panelTitle"
    class="bg-light border-0 mb-3"
  >
    Test
  </b-card>
</template>
<script>
export default {
  props: {
    config: {
      type: Object,
      required: true
    },
    side: {
      type: String,
      required: true
    }
  },
  computed: {
    panelTitle () {
      return this.config.edit[`${this.side}_title`]
    }
  }
}
</script>
