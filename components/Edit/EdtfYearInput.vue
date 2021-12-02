<template>
  <b-form-input
    :id="field.field"
    :value="value"
  />
</template>
<script>
export default {
  props: {
    config: {
      type: Object,
      required: true
    },
    field: {
      type: Object,
      required: true
    },
    value: {
      type: [Array, String],
      required: true
    }
  }
}
</script>
