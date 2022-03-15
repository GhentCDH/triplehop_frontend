<template>
  <div v-frag>
    <template
      v-for="individualField, fieldKey in fields"
    >
      <b-form-input
        :id="id"
        :key="`${fieldKey}_input`"
        :value="values[fieldKey]"
        :state="validateState(fieldKey)"
        @input="onInput(fieldKey, $event)"
      />
      <!-- TODO: add delete button (https://bootstrap-vue.org/docs/components/input-group) -->
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
  </div>
</template>
<script>
import frag from 'vue-frag'
import { v4 as uuidv4 } from 'uuid'

import { VALIDATOR_TYPES_CONVERSION } from '~/components/Edit/utils.js'

export default {
  directives: {
    frag
  },
  props: {
    id: {
      type: String,
      required: true
    },
    field: {
      type: Object,
      required: true
    },
    value: {
      type: Array,
      required: true
    },
    vuelidateElement: {
      type: Object,
      required: true
    }
  },
  data () {
    const data = {
      fields: {},
      fieldIndex: {},
      fieldReverseIndex: {},
      validatorsWithError: {}
    }
    for (let i = 0; i < this.value.length; i++) {
      const uuid = uuidv4()
      data.fields[uuid] = this.field
      data.fieldIndex[i] = uuid
      data.fieldReverseIndex[uuid] = i
    }
    return data
  },
  computed: {
    values () {
      const values = {}
      for (let i = 0; i < this.value.length; i++) {
        values[this.fieldIndex[i]] = this.value[i]
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
        for (let i = 0; i < this.fields.length; i++) {
          this.$watch(
            function () {
              return this.vuelidateElement.$each[i][validatorType]
            },
            function (newVal, oldVal) {
              if (newVal === false && oldVal !== false) {
                // TODO: add fieldKey to validatorsWithError, to research: set nested object
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
    }
  },
  methods: {
    onInput (fieldKey, $event) {
      this.values[fieldKey] = $event
      this.$emit(
        'input',
        {
          systemName: this.id,
          value: Object.values(this.values)
        }
      )
    },
    validateState (fieldKey) {
      const { $dirty, $invalid } = this.vuelidateElement.$each[this.fieldReverseIndex[fieldKey]]
      return $dirty ? !$invalid : null
    }
  }
}
</script>
