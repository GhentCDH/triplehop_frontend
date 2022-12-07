<template>
  <dt
    class="col-sm-3 col-lg-2"
    :class="{'empty-field': fieldValue.length === 0}"
  >
    {{ field.label ? field.label : config.data[field.field.replace('$', '')].display_name }}
  </dt>
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
    fieldValue: {
      type: Array,
      required: true
    }
  }
}
</script>
