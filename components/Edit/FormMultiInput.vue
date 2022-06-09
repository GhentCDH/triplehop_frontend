<template>
  <div v-frag>
    <draggable
      handle=".draggable-handle"
      :value="initialValue"
      @end="onDragEnd"
    >
      <transition-group type="transition" name="flip-list">
        <b-input-group
          v-for="fieldKey in fieldKeys"
          :key="fieldKey"
          class="mt-3"
        >
          <b-input-group-prepend>
            <b-button variant="outline-default" class="draggable-handle">
              <b-icon icon="arrows-move" />
            </b-button>
          </b-input-group-prepend>
          <b-form-input
            :value="keyedValues[fieldKey]"
            :state="validateState(fieldKey)"
            @input="onInput(fieldKey, $event)"
          />
          <b-input-group-append>
            <b-button
              variant="danger"
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
import { validationMixin } from 'vuelidate'
import { helpers, required } from 'vuelidate/lib/validators'

import FormFeedback from '~/components/Edit/FormFeedback.vue'
import { edtfYear } from '~/assets/js/validators'

export default {
  directives: {
    frag
  },
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
      type: Array,
      required: true
    }
  },
  data () {
    return {
      values: JSON.parse(JSON.stringify(this.initialValue)),
      fieldKeys: []
    }
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
    }
  },
  watch: {
    initialValue () {
      if (JSON.stringify(this.initialValue) !== JSON.stringify(this.values)) {
        // Reset
        this.values = JSON.parse(JSON.stringify(this.initialValue))
        this.$v.$reset()
        this.createKeys()
      }
    }
  },
  mounted () {
    this.createKeys()
  },
  methods: {
    add () {
      this.values.push('')
      this.fieldKeys.push(uuidv4())
    },
    del (fieldKey) {
      this.values.splice(this.fieldKeys.indexOf(fieldKey), 1)
      this.fieldKeys.splice(this.fieldKeys.indexOf(fieldKey), 1)
    },
    createKeys () {
      this.fieldKeys = []
      for (let i = 0; i < this.values.length; i++) {
        const uuid = uuidv4()
        this.fieldKeys.push(uuid)
      }
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
    onDragEnd ($event) {
      // Use the end event instead of changed event to workaround a bug on the first change
      // https://github.com/SortableJS/Vue.Draggable/issues/603
      // https://github.com/SortableJS/Vue.Draggable/issues/909
      this.fieldKeys.splice($event.newIndex, 0, this.fieldKeys.splice($event.oldIndex, 1)[0])
      this.values.splice($event.newIndex, 0, this.values.splice($event.oldIndex, 1)[0])
      this.$emit(
        'input',
        {
          systemName: this.id,
          value: this.values
        }
      )
    },
    validateState (fieldKey) {
      const { $dirty, $invalid } = this.$v.values.$each[this.fieldKeys.indexOf(fieldKey)]
      return $dirty ? !$invalid : null
    }
  }
}
</script>
