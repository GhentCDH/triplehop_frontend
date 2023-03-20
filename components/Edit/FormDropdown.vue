<template>
  <div v-frag>
    <multiselect
      :id="id"
      :value="value"
      :clear-on-select="false"
      :disabled="disabled"
      :multiple="field.multi"
      :options="field.options"
      :show-labels="false"
      :class="validateClass"
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
import Multiselect from 'vue-multiselect'
import { validationMixin } from 'vuelidate'

import { generateValidations } from '~/assets/js/validation'
import FormFeedback from '~/components/Edit/FormFeedback.vue'

export default {
  directives: {
    frag
  },
  components: {
    FormFeedback,
    Multiselect
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
      type: String,
      default: null
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
    },
    validateClass () {
      if (this.validateState == null) {
        return ''
      }
      return this.validateState ? 'is-valid' : 'is-invalid'
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
