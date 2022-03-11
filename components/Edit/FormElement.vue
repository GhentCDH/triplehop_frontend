<template>
  <b-form-group
    :label="field.label ? field.label : config.data[id].display_name"
    :label-for="id"
    :description="field.help_message"
  >
    <component
      :is="component_type(field.type)"
      :id="id"
      v-model="compValue"
      :placeholder="field.placeholder"
      :state="validateState()"
    />
    <b-form-invalid-feedback
      v-for="validator, key in validatorsWithError"
      :key="key"
    >
      <template v-if="validator.error_message">
        {{ validator.error_message }}
      </template>
      <template v-else-if="key === 'required'">
        This field is required.
      </template>
      <template v-else>
        The value provided for this field is invalid.
      </template>
    </b-form-invalid-feedback>
  </b-form-group>
</template>
<script>
const VALIDATOR_TYPES_CONVERSION = {
  edtf_year: 'edtfYear',
  regex: 'regex',
  required: 'required'
}

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
  data () {
    return {
      id: this.field.field.replace('$', ''),
      validatorsWithError: {}
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
    }
  },
  mounted () {
    // Use a custom watcher to watch the vuelidate formData
    // Since formData is an object, computed properties based on formData are not reactive
    if (this.field.validators) {
      for (const validator of this.field.validators) {
        const validatorType = VALIDATOR_TYPES_CONVERSION[validator.type]
        this.$watch(
          function () {
            return this.vuelidate.formData[this.id][validatorType]
          },
          function (newVal, oldVal) {
            if (newVal === false && oldVal !== false) {
              // Use $set since validatorWithErrors is an object
              this.$set(this.validatorsWithError, validatorType, validator)
            } else if (oldVal === false && newVal !== false) {
              // Use $delete since validatorWithErrors is an object
              this.$delete(this.validatorsWithError, validatorType)
            }
          }
        )
      }
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
