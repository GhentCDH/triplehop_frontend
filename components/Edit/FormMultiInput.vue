<template>
  <div v-frag>
    <template
      v-for="fieldKey, index in fieldKeys"
    >
      <b-input-group
        :key="`${fieldKey}_input`"
        :class="{'mt-3': index}"
      >
        <b-form-input
          :value="values[fieldKey]"
          :state="validateState(fieldKey)"
          @input="onInput(fieldKey, $event)"
        />
        <b-input-group-append>
          <b-button
            variant="danger"
            @click="del(fieldKey)"
          >
            <b-icon icon="trash" />
            Delete
          </b-button>
        </b-input-group-append>
        <form-feedback
          v-for="validator, validatorType in validatorsWithError[fieldKey]"
          :key="`${fieldKey}_feedback_${validatorType}`"
          :validator="validator"
          :validator-type="validatorType"
        />
      </b-input-group>
    </template>
    <b-button
      class="mt-3"
      variant="primary"
      @click="add"
    >
      <b-icon icon="plus" />
      Add
    </b-button>
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
      validatorsWithError: {},
      vuelidateWatchers: {}
    }
    for (let i = 0; i < this.value.length; i++) {
      const uuid = uuidv4()
      data.fieldKeys.push(uuid)
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
    for (const fieldKey of this.fieldKeys) {
      this.addVuelidateWatcher(fieldKey)
    }
  },
  methods: {
    add () {
      // Add element to value array so vuelidate $each is updated
      this.$emit(
        'input',
        {
          systemName: this.id,
          value: [...Object.values(this.values), '']
        }
      )
      const fieldKey = uuidv4()
      this.fieldKeys.push(fieldKey)
      // Use $set since validatorWithErrors is an object
      this.$set(this.validatorsWithError, fieldKey, {})
      this.addVuelidateWatcher(fieldKey)
    },
    del (fieldKey) {
      // Delete element from value array so vuelidate $each is updated
      const values = { ...this.values }
      delete values[fieldKey]
      this.$emit(
        'input',
        {
          systemName: this.id,
          value: Object.values(values)
        }
      )
      this.fieldKeys.splice(this.fieldKeys.indexOf(fieldKey), 1)
      this.$delete(this.validatorsWithError, fieldKey)
      // Unwatch Vuelidate
      this.vuelidateWatchers[fieldKey]()
      delete this.vuelidateWatchers[fieldKey]
    },
    addVuelidateWatcher (fieldKey) {
      // Use a custom watcher to watch the vuelidate formData
      // Since formData is an object, computed properties based on formData are not reactive
      if (this.field.validators) {
        for (const validator of this.field.validators) {
          const validatorType = VALIDATOR_TYPES_CONVERSION[validator.type]
          this.vuelidateWatchers[fieldKey] = this.$watch(
            function () {
              return this.vuelidateElement.$each[this.fieldKeys.indexOf(fieldKey)][validatorType]
            },
            function (newVal, oldVal) {
              if (newVal === false && oldVal !== false) {
                // Use $set since validatorWithErrors is an object
                this.$set(this.validatorsWithError[fieldKey], validatorType, validator)
              } else if (oldVal === false && newVal !== false) {
                // Use $delete since validatorWithErrors is an object
                this.$delete(this.validatorsWithError[fieldKey], validatorType)
              }
            }
          )
        }
      }
    },
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
      const { $dirty, $invalid } = this.vuelidateElement.$each[this.fieldKeys.indexOf(fieldKey)]
      return $dirty ? !$invalid : null
    }
  }
}
</script>
