<template>
  <div v-frag>
    <b-form-select
      :id="id"
      :value="value"
      :state="validateState"
      :options="field.options"
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
import { required } from 'vuelidate/lib/validators'

import FormFeedback from '~/components/Edit/FormFeedback.vue'

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
      type: String,
      default: null
    }
  },
  data () {
    return {
      value: this.initialValue
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
      }
    }
    return validations
  },
  computed: {
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
      if (this.initialValue !== this.value) {
        // Reset
        this.value = this.initialValue
        this.$v.$reset()
      }
    }
  },
  methods: {
    onInput (value) {
      this.value = value
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
