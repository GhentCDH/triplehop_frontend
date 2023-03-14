<template>
  <div v-frag>
    <b-form-input
      :id="id"
      :value="value"
      :state="validateState"
      :type="inputType"
      @input="onInput"
    />
    <form-feedback
      v-for="validator of validatorsWithError"
      :key="validator.type"
      :validator="validator"
    />
  </div>
</template>
<script>
import frag from 'vue-frag'
import { validationMixin } from 'vuelidate'
import { helpers, required } from 'vuelidate/lib/validators'

import FormFeedback from '~/components/Edit/FormFeedback.vue'
import { edtfYear } from '~/assets/js/validators'

export default {
  directives: {
    frag
  },
  components: {
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
    return {
      value: JSON.parse(this.initialValue)
    }
  },
  validations () {
    const validations = {
      value: {}
    }
    const validators = this.field.validators
    if (validators) {
      for (const validator of validators) {
        if (validator.type === 'required') {
          validations.value.required = required
        }
        if (validator.type === 'edtf_year') {
          validations.value.edtfYear = edtfYear
        }
        if (validator.type === 'regex') {
          validations.value.regex = helpers.regex('regex', new RegExp(validator.regex))
        }
      }
    }
    return validations
  },
  computed: {
    inputType () {
      if (this.field.type === 'number') {
        return 'number'
      }
      return 'text'
    },
    validatorsWithError () {
      if (this.field.validators == null) {
        return []
      }
      return this.field.validators.filter(v => !this.$v.value[v.type])
    },
    validateState () {
      // Only markup touched fields as correct or incorrect
      const { $dirty, $invalid } = this.$v.value
      return $dirty ? !$invalid : null
    }
  },
  watch: {
    initialValue () {
      if (
        (this.initialValue === 'null' && this.value !== '') ||
        (this.initialValue !== 'null' && this.initialValue !== JSON.stringify(this.value))
      ) {
        // Reset
        this.value = JSON.parse(this.initialValue)
        this.$v.$reset()
      }
    }
  },
  methods: {
    onInput (value) {
      if (this.field.type === 'number') {
        this.value = parseInt(value)
      } else {
        this.value = value
      }
      this.$v.value.$touch()
      this.$emit(
        'input',
        {
          systemName: this.id,
          value: this.value
        }
      )
    }
  }
}
</script>
