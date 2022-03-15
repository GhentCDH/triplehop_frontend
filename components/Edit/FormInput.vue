<template>
  <div v-frag>
    <b-form-input
      :id="id"
      :value="value"
      :state="validateState()"
      @input="onInput"
    />
    <form-feedback
      v-for="validator, validatorType in validatorsWithError"
      :key="validatorType"
      :validator="validator"
      :validator-type="validatorType"
    />
  </div>
</template>
<script>
import frag from 'vue-frag'

import FormFeedback from '~/components/Edit/FormFeedback.vue'
import { VALIDATOR_TYPES_CONVERSION } from '~/components/Edit/utils.js'

export default {
  directives: {
    frag
  },
  components: {
    FormFeedback
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
      type: String,
      required: true
    },
    vuelidateElement: {
      type: Object,
      required: true
    }
  },
  data () {
    return {
      validatorsWithError: {}
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
            return this.vuelidateElement[validatorType]
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
    onInput (value) {
      this.$emit(
        'input',
        {
          systemName: this.id,
          value
        }
      )
    },
    validateState () {
      const { $dirty, $invalid } = this.vuelidateElement
      return $dirty ? !$invalid : null
    }
  }
}
</script>
