<template>
  <div v-frag>
    <template
      v-for="fieldKey in fieldKeys"
    >
      <b-form-input
        :id="id"
        :key="`${fieldKey}_input`"
        :value="values[fieldKey]"
        :state="validateState(fieldKey)"
        @input="onInput(fieldKey, $event)"
      />
      <!-- TODO: add delete button (https://bootstrap-vue.org/docs/components/input-group) -->
      <form-feedback
        v-for="validator, validatorType in validatorsWithError[fieldKey]"
        :key="`${fieldKey}_feedback_${validatorType}`"
        :validator="validator"
        :validator-type="validatorType"
      />
    </template>
    <!-- TODO: add add button -->
  </div>
</template>
<script>
import frag from 'vue-frag'
import { v4 as uuidv4 } from 'uuid'

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
      fieldKeys: [],
      fieldReverseIndex: {},
      validatorsWithError: {}
    }
    for (let i = 0; i < this.value.length; i++) {
      const uuid = uuidv4()
      data.fieldKeys.push(uuid)
      data.fieldReverseIndex[uuid] = i
      data.validatorsWithError[uuid] = {}
    }
    return data
  },
  computed: {
    values () {
      const values = {}
      for (let i = 0; i < this.value.length; i++) {
        values[this.fieldKeys[i]] = this.value[i]
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
        for (let i = 0; i < this.fieldKeys.length; i++) {
          this.$watch(
            function () {
              return this.vuelidateElement.$each[i][validatorType]
            },
            function (newVal, oldVal) {
              if (newVal === false && oldVal !== false) {
                // Use $set since validatorWithErrors is an object
                this.$set(this.validatorsWithError[this.fieldKeys[i]], validatorType, validator)
              } else if (oldVal === false && newVal !== false) {
                // Use $delete since validatorWithErrors is an object
                this.$delete(this.validatorsWithError[this.fieldKeys[i]], validatorType)
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
