<template>
  <div>
    <draggable
      handle=".draggable-handle"
      :list="values"
      @change="orderChanged"
    >
      <transition-group type="transition" tag="div" name="flip-list">
        <b-input-group
          v-for="fieldKey in fieldKeys"
          :key="fieldKey"
          class="mt-3"
        >
          <b-input-group-prepend>
            <b-button
              variant="outline-default"
              size="sm"
              class="draggable-handle"
            >
              <b-icon icon="arrows-move" />
            </b-button>
          </b-input-group-prepend>
          <b-form-input
            :value="keyedValues[fieldKey]"
            :state="keyedValidateState[fieldKey]"
            @input="onInput(fieldKey, $event)"
          />
          <b-input-group-append>
            <b-button
              variant="danger"
              size="sm"
              title="Remove this value"
              @click="del(fieldKey)"
            >
              <b-icon icon="trash" />
            </b-button>
          </b-input-group-append>
          <form-feedback
            v-for="validator of keyedValidatorsWithError[fieldKey]"
            :key="`${fieldKey}_${validator.type}`"
            :validator="validator"
          />
        </b-input-group>
      </transition-group>
    </draggable>
    <b-button
      variant="primary"
      size="sm"
      class="mt-3"
      @click="add"
    >
      <b-icon icon="plus" />
      Add
    </b-button>
  </div>
</template>
<script>
import draggable from 'vuedraggable'
import { v4 as uuidv4 } from 'uuid'
import { validationMixin } from 'vuelidate'
import { helpers, required } from 'vuelidate/lib/validators'

import FormFeedback from '~/components/Edit/FormFeedback.vue'
import { edtfYear } from '~/assets/js/validators'

export default {
  components: {
    draggable,
    FormFeedback
  },
  mixins: [
    validationMixin
  ],
  props: {
    id: {
      type: String,
      required: true
    },
    field: {
      type: Object,
      required: true
    },
    initialValue: {
      // JSON representation
      type: String,
      required: true
    }
  },
  data () {
    const data = {
      fieldKeys: [],
      values: []
    }
    if (this.initialValue !== 'null') {
      for (const value of JSON.parse(this.initialValue)) {
        data.values.push(value)
        data.fieldKeys.push(uuidv4())
      }
    }
    return data
  },
  validations () {
    const validations = {
      values: {
        $each: {}
      }
    }
    const validators = this.field.validators
    if (validators) {
      for (const validator of validators) {
        if (validator.type === 'required') {
          validations.values.$each.required = required
        }
        if (validator.type === 'edtf_year') {
          validations.values.$each.edtfYear = edtfYear
        }
        if (validator.type === 'regex') {
          validations.values.$each.regex = helpers.regex('regex', new RegExp(validator.regex))
        }
      }
    }
    return validations
  },
  computed: {
    keyedValues () {
      const keyedValues = {}
      for (const [index, fieldKey] of this.fieldKeys.entries()) {
        keyedValues[fieldKey] = this.values[index]
      }
      return keyedValues
    },
    keyedValidatorsWithError () {
      const keyedValidatorsWithError = {}
      for (const [index, fieldKey] of this.fieldKeys.entries()) {
        if (this.field.validators == null) {
          keyedValidatorsWithError[fieldKey] = []
        } else {
          keyedValidatorsWithError[fieldKey] = this.field.validators.filter(v => !this.$v.values.$each[index][v.type])
        }
      }
      return keyedValidatorsWithError
    },
    keyedValidateState () {
      const keyedValidateState = {}
      for (const [index, fieldKey] of this.fieldKeys.entries()) {
        const { $dirty, $invalid } = this.$v.values.$each[index]
        keyedValidateState[fieldKey] = $dirty ? !$invalid : null
      }
      return keyedValidateState
    }
  },
  watch: {
    initialValue () {
      if (
        (this.initialValue === 'null' && this.values.length !== 0) ||
        (this.initialValue !== 'null' && this.initialValue !== JSON.stringify(this.values))
      ) {
        // Reset
        this.reKey()
        this.$v.$reset()
      }
    }
  },
  methods: {
    add () {
      this.values.push('')
      this.fieldKeys.push(uuidv4())
    },
    del (fieldKey) {
      this.values.splice(this.fieldKeys.indexOf(fieldKey), 1)
      this.fieldKeys.splice(this.fieldKeys.indexOf(fieldKey), 1)
      this.$emit(
        'input',
        {
          systemName: this.id,
          value: JSON.parse(JSON.stringify(this.values))
        }
      )
    },
    reKey () {
      const values = []
      const fieldKeys = []

      if (this.initialValue !== 'null') {
        for (const value of JSON.parse(this.initialValue)) {
          values.push(value)
          fieldKeys.push(uuidv4())
        }
      }

      this.values = values
      this.fieldKeys = fieldKeys
    },
    onInput (fieldKey, $event) {
      // use $set so vuelidate revalidates
      this.$set(this.values, this.fieldKeys.indexOf(fieldKey), $event)
      this.$v.values.$each[this.fieldKeys.indexOf(fieldKey)].$touch()
      this.$emit(
        'input',
        {
          systemName: this.id,
          value: JSON.parse(JSON.stringify(this.values))
        }
      )
    },
    orderChanged ($event) {
      this.fieldKeys.splice($event.moved.newIndex, 0, this.fieldKeys.splice($event.moved.oldIndex, 1)[0])

      this.$emit(
        'input',
        {
          systemName: this.id,
          value: this.values
        }
      )
    }
  }
}
</script>
