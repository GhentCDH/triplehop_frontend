<template>
  <b-form-group
    :label="field.label ? field.label : config.data[id].display_name"
    :label-for="id"
    :description="field.help_message"
  >
    <template
      v-for="individualField, fieldKey in fields"
    >
      <component
        :is="component_type(individualField.type)"
        :id="id"
        :key="`${fieldKey}_component`"
        :value="values[fieldKey]"
        :placeholder="individualField.placeholder"
        :state="validateState(fieldKey)"
        @input="onInput(fieldKey, $event)"
      />
      <b-form-invalid-feedback
        v-for="validator, validatorKey in validatorsWithError"
        :key="`${fieldKey}_feedback_${validatorKey}`"
      >
        <template v-if="validator.error_message">
          {{ validator.error_message }}
        </template>
        <template v-else-if="validatorKey === 'required'">
          This field is required.
        </template>
        <template v-else>
          The value provided for this field is invalid.
        </template>
      </b-form-invalid-feedback>
    </template>
  </b-form-group>
</template>
<script>
import { v4 as uuidv4 } from 'uuid'

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
    const data = {
      id: this.field.field.replace('$', ''),
      validatorsWithError: {},
      fields: {},
      fieldIndex: {}
    }
    if (this.field.multi) {
      for (let i = 0; i < this.value.length; i++) {
        const uuid = uuidv4()
        data.fields[uuid] = this.field
        data.fieldIndex[uuid] = i
      }
    } else {
      data.fields[uuidv4()] = this.field
    }
    return data
  },
  computed: {
    values () {
      const values = {}
      const fieldKeys = Object.keys(this.fields)
      if (this.field.multi) {
        for (let i = 0; i < this.value.length; i++) {
          values[fieldKeys[i]] = this.value[i]
        }
      } else {
        values[fieldKeys[0]] = this.value
      }
      return values
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
    onInput (fieldKey, $event) {
      const values = this.values
      values[fieldKey] = $event
      let value
      if (this.field.multi) {
        value = Object.values(values)
      } else {
        value = Object.values(values)[0]
      }
      this.$emit(
        'input',
        {
          systemName: this.id,
          value
        }
      )
    },
    validateState (fieldKey) {
      let $dirty, $invalid
      if (this.field.multi) {
        ({ $dirty, $invalid } = this.vuelidate.formData[this.id].$each[this.fieldIndex[fieldKey]])
      } else {
        ({ $dirty, $invalid } = this.vuelidate.formData[this.id])
      }
      return $dirty ? !$invalid : null
    }
  }
}
</script>
