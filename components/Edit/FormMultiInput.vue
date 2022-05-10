<template>
  <div v-frag>
    <draggable
      handle=".draggable-handle"
      :value="value"
      @change="orderChanged"
    >
      <transition-group type="transition" name="list">
        <b-input-group
          v-for="fieldKey in fieldKeys"
          :key="`${fieldKey}_input`"
          class="mt-3"
        >
          <b-input-group-prepend>
            <b-button variant="outline-default" class="draggable-handle">
              <b-icon icon="arrows-move" />
            </b-button>
          </b-input-group-prepend>
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
      </transition-group>
    </draggable>
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
import draggable from 'vuedraggable'
import { v4 as uuidv4 } from 'uuid'

import FormFeedback from '~/components/Edit/FormFeedback.vue'
import { VALIDATOR_TYPES_CONVERSION } from '~/components/Edit/utils.js'

export default {
  directives: {
    frag
  },
  components: {
    draggable,
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
    }
  },
  data () {
    return {
      fieldKeys: [],
      validatorsWithError: {},
      vuelidateWatchers: {}
    }
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
    this.initialize()
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
              // return this.vuelidate.$each[this.fieldKeys.indexOf(fieldKey)][validatorType]
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
    initialize () {
      for (const fieldKey of this.fieldKeys) {
        this.$delete(this.validatorsWithError, fieldKey)
        delete this.vuelidateWatchers[fieldKey]
      }
      this.fieldKeys = []
      for (let i = 0; i < this.value.length; i++) {
        const uuid = uuidv4()
        this.fieldKeys.push(uuid)
        this.validatorsWithError[uuid] = {}
        this.addVuelidateWatcher(uuid)
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
    orderChanged ($event) {
      const values = JSON.parse(JSON.stringify(this.value))
      const value = values.splice($event.moved.oldIndex, 1)[0]
      values.splice($event.moved.newIndex, 0, value)
      this.$emit(
        'input',
        {
          systemName: this.id,
          value: values
        }
      )
    },
    reset () {
      this.initialize()
    },
    validateState (fieldKey) {
      // const { $dirty, $invalid } = this.vuelidate.$each[this.fieldKeys.indexOf(fieldKey)]
      // return $dirty ? !$invalid : null
    }
  }
}
</script>
