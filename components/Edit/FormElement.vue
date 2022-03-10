<template>
  <b-form-group
    :label="field.label ? field.label : config.data[id].display_name"
    :label-for="id"
  >
    <component
      :is="component_type(field.type)"
      :id="id"
      v-model="compValue"
      :state="validateState()"
    />
    <b-form-invalid-feedback
      v-if="vuelidate.formData[id].required === false"
    >
      This field is required.
    </b-form-invalid-feedback>
    <b-form-invalid-feedback
      v-if="vuelidate.formData[id].edtfYear === false"
    >
      Please provide a valid EDTF year. For more information, please check the <a href="https://www.loc.gov/standards/datetime/" target="_blank">specification</a>.
    </b-form-invalid-feedback>
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
    vuelidate: {
      type: Object,
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
            systemName: this.id,
            value
          }
        )
      }
    },
    id () {
      return this.field.field.replace('$', '')
    }
  },
  methods: {
    component_type (crdbType) {
      return 'b-form-input'
    },
    validateState () {
      const { $dirty, $invalid } = this.vuelidate.formData[this.id]
      return $dirty ? !$invalid : null
    }
  }
}
</script>
