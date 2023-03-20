<template>
  <div v-frag>
    <b-form-input
      :id="id"
      :value="value"
      :disabled="disabled"
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

import { generateValidations } from '~/assets/js/validation'
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
    disabled: {
      type: Boolean,
      required: true
    },
    field: {
      type: Object,
      required: true
    },
    initialValue: {
      // JSON representation
      type: String,
      default: () => null
    }
  },
  data () {
    return {
      value: JSON.parse(this.initialValue)
    }
  },
  validations () {
    return generateValidations(this.field)
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
        this.value = value === '' ? null : parseInt(value)
      } else {
        this.value = value
      }
      this.$emit(
        'input',
        {
          systemName: this.id,
          value: this.value
        }
      )
      // Wait untill components are updated before validating
      this.$nextTick(() => {
        this.$v.value.$touch()
      })
    }
  }
}
</script>
