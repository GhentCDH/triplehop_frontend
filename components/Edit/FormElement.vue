<template>
  <b-form-group
    :label="field.label ? field.label : config.data[field.field.replace('$', '')].display_name"
    :label-for="id"
  >
    <edtfYearInput
      v-if="field.type == 'edtf_year'"
      :id="id"
      v-model="compValue"
      :field="field"
    />
    <b-form-input
      v-else
      :id="id"
      v-model="compValue"
    />
  </b-form-group>
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
    },
    id: {
      type: String,
      required: true
    }
  },
  computed: {
    compValue: {
      get () {
        return this.value
      },
      set (value) {
        this.$emit(
          'input',
          {
            systemName: this.field.field.replace('$', ''),
            value
          }
        )
      }
    }
  }
}
</script>
